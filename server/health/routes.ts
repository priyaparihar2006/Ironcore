import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { asyncRouter } from '../router.js';
import { authMiddleware, type AuthenticatedRequest } from '../auth.js';
import { getDatabase, saveDatabase } from '../db.js';
import { activeTarget, currentEstimate, healthInput, healthState, inputHash } from './state.js';
import { activityFactors, ageAt, localDate, sumNutrients, validDate } from './calculations.js';
import {
  aiAvailable,
  fail,
  generateStructured,
  objectSchema,
  stringArray,
  textList,
} from '../ai/provider.js';
import { foodPortion } from '../nutrition/foods.js';
import { buildReport } from '../reports/service.js';
import type { DietPlan, FoodPortion, HealthPreferences, MealDraft } from '../../src/health.js';
import rateLimit from 'express-rate-limit';
import { aiConfig } from '../ai/config.js';

export const healthRouter = asyncRouter();
healthRouter.use(
  [
    '/user/health',
    '/user/reports',
    '/user/nutrition/estimate-meal',
    '/user/nutrition/plan',
    '/user/nutrition/plans',
  ],
  authMiddleware,
);
healthRouter.use(
  ['/user/nutrition/estimate-meal', '/user/nutrition/plan', '/user/reports'],
  rateLimit({
    windowMs: 60000,
    limit: 30,
    keyGenerator: (req: AuthenticatedRequest) => req.user!.id,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please wait a minute.' },
  }),
);
const owner = (req: AuthenticatedRequest) => req.user!.id;
const text = (value: unknown, max = 200) => {
  if (typeof value !== 'string' || value.length > max)
    throw fail('A text field is missing or too long.');
  return value.trim();
};
const policyReviewed = () => process.env.HEALTH_POLICY_REVIEWED === 'true';
function preferences(body: any): HealthPreferences {
  if (!body || !validDate(body.dateOfBirth) || body.dateOfBirth > localDate('UTC'))
    throw fail('Enter a valid date of birth.');
  const timezone = text(body.timezone, 80);
  try {
    localDate(timezone);
  } catch {
    throw fail('Choose a valid IANA timezone, such as Asia/Kolkata.');
  }
  if (
    !['male', 'female', 'unspecified'].includes(body.formulaSex) ||
    !Object.hasOwn(activityFactors, body.activity) ||
    !['maintain', 'lose', 'gain'].includes(body.goal) ||
    !['general', 'review', 'unanswered'].includes(body.eligibility) ||
    !['omnivore', 'vegetarian', 'vegan'].includes(body.diet) ||
    !['low', 'medium', 'flexible'].includes(body.budget) ||
    typeof body.aiConsent !== 'boolean' ||
    !Number.isInteger(body.cookingMinutes) ||
    body.cookingMinutes < 5 ||
    body.cookingMinutes > 180
  )
    throw fail('Check your health preference selections.');
  const allergies = text(body.allergies);
  if (!allergies) throw fail('List your allergies, or enter none.');
  return {
    dateOfBirth: body.dateOfBirth,
    formulaSex: body.formulaSex,
    activity: body.activity,
    goal: body.goal,
    timezone,
    eligibility: body.eligibility,
    diet: body.diet,
    allergies,
    dislikes: text(body.dislikes),
    cuisine: text(body.cuisine),
    budget: body.budget,
    cookingMinutes: body.cookingMinutes,
    aiConsent: body.aiConsent,
  };
}
function consent(state: ReturnType<typeof healthState>) {
  if (!state.preferences?.aiConsent)
    throw fail('Enable AI data-sharing consent in health preferences first.', 403);
  const p = state.preferences;
  if (ageAt(p.dateOfBirth, localDate(p.timezone)) < 20 || p.eligibility !== 'general')
    throw fail(
      'Personalized AI guidance requires an eligible adult profile. Manual tracking remains available.',
      422,
    );
}

healthRouter.get('/user/health', async (req: AuthenticatedRequest, res: Response) => {
  const db = await getDatabase(),
    id = owner(req);
  res.json({
    state: healthState(db, id),
    estimate: currentEstimate(db, id),
    activeTarget: activeTarget(db, id),
    aiAvailable: aiAvailable(),
    aiProviderHost: aiConfig() ? new URL(aiConfig()!.endpoint).hostname : undefined,
    foodAvailable: !!process.env.FOOD_DATA_API_KEY,
    policyReviewed: policyReviewed(),
  });
});
healthRouter.put('/user/health/preferences', async (req: AuthenticatedRequest, res: Response) => {
  const p = preferences(req.body),
    db = await getDatabase(),
    state = healthState(db, owner(req));
  state.preferences = p;
  state.consentAt = p.aiConsent ? new Date().toISOString() : undefined;
  state.consentVersion = p.aiConsent ? 'wellness-sharing-v1' : undefined;
  await saveDatabase(db);
  res.json({ preferences: p, estimate: currentEstimate(db, owner(req)) });
});
healthRouter.post('/user/health/estimate', async (req: AuthenticatedRequest, res: Response) => {
  const db = await getDatabase(),
    id = owner(req),
    state = healthState(db, id),
    estimate = currentEstimate(db, id);
  if (estimate.status !== 'ready') {
    res.json({ estimate });
    return;
  }
  const fingerprint = inputHash(db, id);
  let target = state.targets.find((t) => t.inputHash === fingerprint);
  if (!target) {
    target = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      inputHash: fingerprint,
      inputSnapshot: healthInput(db, id),
      estimate,
    };
    state.targets = [target, ...state.targets].slice(0, 100);
    await saveDatabase(db);
  }
  res.json({ estimate, target });
});
healthRouter.post(
  '/user/health/targets/:id/accept',
  async (req: AuthenticatedRequest, res: Response) => {
    if (!policyReviewed())
      throw fail(
        'Target activation is awaiting professional review of the nutrition policy. You can preview estimates and continue logging meals.',
        422,
      );
    const db = await getDatabase(),
      id = owner(req),
      state = healthState(db, id);
    const target = state.targets.find((t) => t.id === req.params.id);
    if (!target) throw fail('Target not found.', 404);
    if (target.inputHash !== inputHash(db, id) || currentEstimate(db, id).status !== 'ready')
      throw fail('Your inputs changed. Calculate a fresh estimate before accepting.', 409);
    target.acceptedAt ||= new Date().toISOString();
    // Today's existing log keeps its historical snapshot; new days use this target.
    await saveDatabase(db);
    res.json({ target });
  },
);

healthRouter.post(
  '/user/nutrition/estimate-meal',
  async (req: AuthenticatedRequest, res: Response) => {
    const db = await getDatabase(),
      id = owner(req),
      state = healthState(db, id);
    const description = text(req.body?.description, 1500);
    if (!description) throw fail('Describe the meal before requesting an estimate.');
    let items: { food: string; grams: number | null }[];
    let questions: string[] = [],
      assumptions: string[] = [];
    if (Array.isArray(req.body?.portions)) {
      // Member corrections can be looked up without another model call.
      items = req.body.portions;
    } else {
      consent(state);
      const raw: any = await generateStructured(
        id,
        'Extract meal ingredients only. Never supply nutrition values. Set grams to null and ask a specific question when quantity, household conversion, raw/cooked state, cooking oil or a mixed recipe is unclear. Do not invent a recipe. At most 8 ingredients. Food names should specify preparation.',
        { description },
        objectSchema({
          items: {
            type: 'array',
            items: objectSchema({ food: { type: 'string' }, grams: { type: ['number', 'null'] } }),
          },
          questions: stringArray,
          assumptions: stringArray,
        }),
      );
      items = raw.items;
      questions = textList(raw.questions);
      assumptions = textList(raw.assumptions);
    }
    if (
      !Array.isArray(items) ||
      !items.length ||
      items.length > 8 ||
      items.some(
        (i) =>
          !i ||
          typeof i.food !== 'string' ||
          !i.food.trim() ||
          i.food.length > 150 ||
          (i.grams !== null &&
            (typeof i.grams !== 'number' ||
              !Number.isFinite(i.grams) ||
              i.grams < 1 ||
              i.grams > 2000)),
      )
    )
      throw fail('Specify up to eight foods with portions in grams.', 422);
    if (items.some((i) => i.grams === null) || questions.length) {
      res.json({
        draft: {
          status: 'needs_input',
          questions: questions.length
            ? questions
            : ['Add the weight in grams for each ingredient and describe preparation.'],
          assumptions,
          portions: [],
          name: description,
        },
      });
      return;
    }
    const portions: FoodPortion[] = await Promise.all(
      items.map((item) => foodPortion(item.food, item.grams!)),
    );
    const draft: MealDraft = {
      id: randomUUID(),
      name: description,
      portions,
      ...sumNutrients(portions),
      questions: [],
      assumptions: [
        ...assumptions,
        'These are candidate USDA matches. Confirm food identity, preparation and grams; estimates vary by recipe.',
      ],
      status: 'ready',
      createdAt: new Date().toISOString(),
    };
    if (
      draft.calories > 20000 ||
      [draft.proteinGrams, draft.carbsGrams, draft.fatsGrams].some((n) => n > 2000)
    )
      throw fail('This estimate is too large for one meal. Check quantities and units.', 422);
    state.drafts = [draft, ...state.drafts].slice(0, 100);
    await saveDatabase(db);
    res.json({ draft });
  },
);

healthRouter.post('/user/nutrition/plan', async (req: AuthenticatedRequest, res: Response) => {
  const db = await getDatabase(),
    id = owner(req),
    state = healthState(db, id);
  consent(state);
  const target = activeTarget(db, id);
  if (!target || !policyReviewed())
    throw fail('Accept reviewed nutrition targets before generating a diet plan.', 422);
  // Food APIs do not guarantee allergen safety; never guess from food names.
  if (state.preferences!.allergies.toLowerCase() !== 'none')
    throw fail(
      'Automatic meal plans are unavailable with reported allergies. Please use a professionally reviewed plan.',
      422,
    );
  const usedDrafts = new Set(
    db.nutritionLogs.filter((l) => l.userId === id).flatMap((l) => l.meals.map((m) => m.draftId)),
  );
  const catalog = [
    ...new Map(
      state.drafts
        .filter((d) => usedDrafts.has(d.id) && d.approvedDiet === state.preferences!.diet)
        .flatMap((d) => d.portions)
        .map((p) => [p.foodId, p]),
    ).values(),
  ].slice(0, 30);
  if (catalog.length < 3)
    throw fail(
      'First confirm and log at least three different database foods as suitable for your diet. Plans reuse these verified choices.',
      422,
    );
  const raw: any = await generateStructured(
    id,
    'Create one day of meals using ONLY supplied food IDs, with portions in grams. Respect preferences. Aim within 10% of the supplied calorie and macro targets. Use 3 or 4 meals, at most 6 portions per meal. Do not add other foods, medical advice, fasting, or supplements.',
    {
      targets: target.estimate.targets,
      preferences: {
        diet: state.preferences!.diet,
        cuisine: state.preferences!.cuisine,
        dislikes: state.preferences!.dislikes,
        budget: state.preferences!.budget,
        cookingMinutes: state.preferences!.cookingMinutes,
      },
      foods: catalog,
    },
    objectSchema({
      meals: {
        type: 'array',
        items: objectSchema({
          name: { type: 'string' },
          portions: {
            type: 'array',
            items: objectSchema({ foodId: { type: 'number' }, grams: { type: 'number' } }),
          },
        }),
      },
    }),
  );
  if (!Array.isArray(raw.meals) || raw.meals.length < 3 || raw.meals.length > 4)
    throw fail('AI returned an invalid plan. Try again.', 502);
  const meals = raw.meals.map((m: any) => {
    if (
      typeof m.name !== 'string' ||
      m.name.length > 100 ||
      !Array.isArray(m.portions) ||
      !m.portions.length ||
      m.portions.length > 6
    )
      throw fail('AI returned an invalid meal.', 502);
    const portions = m.portions.map((p: any) => {
      const food = catalog.find((f) => f.foodId === p.foodId);
      if (
        !food ||
        typeof p.grams !== 'number' ||
        !Number.isFinite(p.grams) ||
        p.grams < 10 ||
        p.grams > 750
      )
        throw fail('AI suggested an unsupported food or portion. Try again.', 502);
      const grams = Math.round(p.grams * 10) / 10;
      const ratio = grams / food.grams;
      return {
        ...food,
        grams,
        calories: Math.round(food.calories * ratio),
        proteinGrams: Math.round(food.proteinGrams * ratio),
        carbsGrams: Math.round(food.carbsGrams * ratio),
        fatsGrams: Math.round(food.fatsGrams * ratio),
      };
    });
    return { name: m.name, portions, totals: sumNutrients(portions) };
  });
  const totals = sumNutrients(meals.map((m) => m.totals));
  const targets = target.estimate.targets!;
  for (const [value, expected] of [
    [totals.calories, targets.dailyCalorieTarget],
    [totals.proteinGrams, targets.proteinTargetGrams],
    [totals.carbsGrams, targets.carbsTargetGrams],
    [totals.fatsGrams, targets.fatsTargetGrams],
  ]) {
    if (value < expected * 0.8 || value > expected * 1.2)
      throw fail(
        'The suggested plan did not fit your nutrition targets. Add more varied foods or try again.',
        422,
      );
  }
  const plan: DietPlan = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    targetId: target.id,
    meals,
    totals,
    notes: [
      'A proposal using foods you confirmed for this diet. Check preparation, ingredients and preferences before use.',
      'Meals are not logged as eaten. Nutrition is recalculated from database portions.',
    ],
  };
  state.plans = [plan, ...state.plans].slice(0, 20);
  await saveDatabase(db);
  res.json({ plan });
});
healthRouter.get('/user/nutrition/plans/:id', async (req: AuthenticatedRequest, res: Response) => {
  const plan = healthState(await getDatabase(), owner(req)).plans.find(
    (p) => p.id === req.params.id,
  );
  if (!plan) throw fail('Plan not found.', 404);
  res.json({ plan });
});
healthRouter.post('/user/reports', async (req: AuthenticatedRequest, res: Response) => {
  const db = await getDatabase(),
    id = owner(req),
    state = healthState(db, id);
  const days = req.body?.days === 1 ? 1 : 7;
  const report = buildReport(db, id, days);
  const existing = state.reports.find(
    (r) => r.inputHash === report.inputHash && (req.body?.enhance !== true || r.source === 'ai'),
  );
  if (existing) {
    res.json({ report: existing });
    return;
  }
  if (req.body?.enhance === true) {
    consent(state);
    const raw: any = await generateStructured(
      id,
      'Explain these computed wellness metrics in at most three brief observations. Clearly state missing data and incomplete meal logs. Do not infer actual intake from logged calories, prescribe targets, diagnose, claim causation or invent numbers.',
      {
        start: report.start,
        end: report.end,
        loggedDays: report.loggedDays,
        totalDays: days,
        averageLoggedCalories: report.averageLoggedCalories,
        weightChangeKg: report.weightChangeKg,
        measurements: report.measurements,
      },
      objectSchema({ observations: stringArray }),
    );
    report.commentary = [...report.commentary, ...textList(raw.observations, 3)];
    report.source = 'ai';
  }
  state.reports = [report, ...state.reports].slice(0, 52);
  await saveDatabase(db);
  res.json({ report });
});
healthRouter.get('/user/reports/:id', async (req: AuthenticatedRequest, res: Response) => {
  const report = healthState(await getDatabase(), owner(req)).reports.find(
    (r) => r.id === req.params.id,
  );
  if (!report) throw fail('Report not found.', 404);
  res.json({ report });
});
healthRouter.get('/user/health/export', async (req: AuthenticatedRequest, res: Response) => {
  const db = await getDatabase(),
    id = owner(req);
  res.json({
    health: healthState(db, id),
    nutrition: db.nutritionLogs.filter((l) => l.userId === id),
    progress: db.progressRecords.filter((p) => p.userId === id),
  });
});
healthRouter.delete('/user/health', async (req: AuthenticatedRequest, res: Response) => {
  const db = await getDatabase();
  db.wellnessStates = (db.wellnessStates || []).filter((s) => s.userId !== owner(req));
  await saveDatabase(db);
  // Keep usage reservations to prevent deletion from bypassing cost limits;
  // they contain no health text and are removed on account deletion.
  res.json({
    message:
      'Health preferences, AI drafts, targets, plans and reports deleted. Meal and progress logs remain.',
  });
});
