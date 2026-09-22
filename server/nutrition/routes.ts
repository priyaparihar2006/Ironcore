import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { asyncRouter } from '../router.js';
import { authMiddleware, type AuthenticatedRequest } from '../auth.js';
import { getDatabase, saveDatabase } from '../db.js';
import type { DatabaseSchema, MealItem, NutritionLog } from '../types.js';
import { activeTarget, hash, healthState, userDate } from '../health/state.js';
import { validDate } from '../health/calculations.js';
import { fail } from '../ai/provider.js';

export const nutritionRouter = asyncRouter();
nutritionRouter.use('/user/nutrition', authMiddleware);
function requestedDate(value: unknown, today: string): string {
  if (value === undefined) return today;
  if (!validDate(value) || value > today || value < '2000-01-01')
    throw fail('Choose a valid date between 2000 and today.');
  return value;
}
export function recalcNutritionTotals(log: NutritionLog) {
  for (const [total, field] of [
    ['consumedCalories', 'calories'],
    ['consumedProteinGrams', 'proteinGrams'],
    ['consumedCarbsGrams', 'carbsGrams'],
    ['consumedFatsGrams', 'fatsGrams'],
  ] as const) {
    log[total] = Math.round(log.meals.reduce((n, m) => n + m[field], 0));
  }
}
function emptyLog(db: DatabaseSchema, id: string, date: string): NutritionLog {
  const target =
    date === userDate(db, id) && process.env.HEALTH_POLICY_REVIEWED === 'true'
      ? activeTarget(db, id)
      : undefined;
  return {
    id: `nutri_${id}_${date}`,
    userId: id,
    date,
    ...(target?.estimate.targets || {
      dailyCalorieTarget: 0,
      proteinTargetGrams: 0,
      carbsTargetGrams: 0,
      fatsTargetGrams: 0,
    }),
    consumedCalories: 0,
    consumedProteinGrams: 0,
    consumedCarbsGrams: 0,
    consumedFatsGrams: 0,
    meals: [],
  };
}
function manualMeal(body: any): Omit<MealItem, 'id' | 'time'> {
  if (
    !body ||
    typeof body.name !== 'string' ||
    !body.name.trim() ||
    body.name.length > 500 ||
    !['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(body.type)
  )
    throw fail('Enter a meal name and a valid meal type.');
  function number(value: unknown, max: number, optional = false) {
    if (optional && (value === undefined || value === null || value === '')) return 0;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max)
      throw fail('Enter valid non-negative nutrition amounts.');
    return Math.round(value);
  }
  return {
    name: body.name.trim(),
    type: body.type,
    calories: number(body.calories, 20000),
    proteinGrams: number(body.proteinGrams, 2000, true),
    carbsGrams: number(body.carbsGrams, 2000, true),
    fatsGrams: number(body.fatsGrams, 2000, true),
    source: 'manual',
    unknownMacros: ['proteinGrams', 'carbsGrams', 'fatsGrams'].some(
      (k) => body[k] === undefined || body[k] === null || body[k] === '',
    ),
  };
}
nutritionRouter.get('/user/nutrition', async (req: AuthenticatedRequest, res: Response) => {
  const db = await getDatabase(),
    id = req.user!.id,
    date = requestedDate(req.query.date, userDate(db, id));
  const log =
    db.nutritionLogs.find((n) => n.userId === id && n.date === date) || emptyLog(db, id, date);
  recalcNutritionTotals(log);
  res.json({ nutrition: log });
});
nutritionRouter.post('/user/nutrition/meals', async (req: AuthenticatedRequest, res: Response) => {
  const db = await getDatabase(),
    id = req.user!.id,
    date = requestedDate(req.body?.date, userDate(db, id));
  const requestId = req.body?.requestId;
  if (typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId))
    throw fail('A unique request ID is required. Refresh and try again.');
  const requestHash = hash(req.body);
  const previousLog = db.nutritionLogs.find(
    (l) => l.userId === id && l.meals.some((m) => m.requestId === requestId),
  );
  if (previousLog) {
    const meal = previousLog.meals.find((m) => m.requestId === requestId)!;
    if (meal.requestHash !== requestHash)
      throw fail('This request ID was already used for another meal.', 409);
    res.json({ meal, nutrition: previousLog });
    return;
  }
  let fields: Omit<MealItem, 'id' | 'time'>;
  if (req.body.draftId) {
    const state = healthState(db, id),
      draft = state.drafts.find((d) => d.id === req.body.draftId);
    if (!draft || draft.status !== 'ready')
      throw fail('Meal estimate not found. Estimate the meal again.', 404);
    if (!['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(req.body.type))
      throw fail('Choose a meal type.');
    if (req.body.confirmed !== true)
      throw fail('Confirm food matches and portions before logging.');
    if (req.body.suitableForDiet === true && state.preferences)
      draft.approvedDiet = state.preferences.diet;
    fields = {
      name: draft.name,
      type: req.body.type,
      calories: draft.calories,
      proteinGrams: draft.proteinGrams,
      carbsGrams: draft.carbsGrams,
      fatsGrams: draft.fatsGrams,
      source: 'USDA estimate',
      draftId: draft.id,
    };
  } else fields = manualMeal(req.body);
  let log = db.nutritionLogs.find((n) => n.userId === id && n.date === date);
  if (!log) {
    log = emptyLog(db, id, date);
    db.nutritionLogs.push(log);
  }
  if (log.meals.length >= 100) throw fail('This day has reached the meal-entry limit.');
  const timezone = healthState(db, id).preferences?.timezone || 'UTC';
  const meal: MealItem = {
    ...fields,
    id: randomUUID(),
    requestId,
    requestHash,
    eatenAt: new Date().toISOString(),
    time: new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date()),
  };
  log.meals.push(meal);
  recalcNutritionTotals(log);
  await saveDatabase(db);
  res.status(201).json({ meal, nutrition: log });
});
nutritionRouter.patch(
  '/user/nutrition/meals/:id',
  async (req: AuthenticatedRequest, res: Response) => {
    const db = await getDatabase(),
      log = db.nutritionLogs.find(
        (l) => l.userId === req.user!.id && l.meals.some((m) => m.id === req.params.id),
      );
    if (!log) throw fail('Meal not found.', 404);
    const old = log.meals.find((m) => m.id === req.params.id)!;
    const fields = manualMeal(req.body);
    Object.assign(old, fields, { draftId: undefined });
    recalcNutritionTotals(log);
    await saveDatabase(db);
    res.json({ nutrition: log });
  },
);
nutritionRouter.delete(
  '/user/nutrition/meals/:id',
  async (req: AuthenticatedRequest, res: Response) => {
    const db = await getDatabase(),
      log = db.nutritionLogs.find(
        (l) => l.userId === req.user!.id && l.meals.some((m) => m.id === req.params.id),
      );
    if (!log) throw fail('Meal not found.', 404);
    log.meals = log.meals.filter((m) => m.id !== req.params.id);
    recalcNutritionTotals(log);
    await saveDatabase(db);
    res.json({ nutrition: log });
  },
);
