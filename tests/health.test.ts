import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import express from 'express';
import type { Pool } from 'pg';
import type { Server } from 'node:http';
import type { DatabaseSchema } from '../server/types.js';
import type { HealthPreferences } from '../src/health.js';
import { calculateHealth, localDate, validDate, ageAt } from '../server/health/calculations.js';
import { buildReport } from '../server/reports/service.js';
import { setPoolForTests, ensureSchema, persistAll, hydrateAll } from '../server/postgres.js';
import { persistChanges } from '../server/persistence.js';

process.env.NODE_ENV = 'test';
process.env.SEED_DEMO_DATA = 'false';
process.env.JWT_SECRET = 'isolated-tests-only';
process.env.AI_ENABLED = 'false';
process.env.HEALTH_POLICY_REVIEWED = 'false';

const preferences: HealthPreferences = {
  dateOfBirth: '1990-01-01',
  formulaSex: 'male',
  activity: 'sedentary',
  goal: 'maintain',
  timezone: 'Asia/Kolkata',
  eligibility: 'general',
  diet: 'vegetarian',
  allergies: 'none',
  dislikes: '',
  cuisine: 'Indian',
  cookingMinutes: 30,
  budget: 'medium',
  aiConsent: true,
};
let fixturePasswordHash: string;
const fixture = (): DatabaseSchema => ({
  users: [
    {
      id: 'member1',
      name: 'First Member',
      email: 'first@example.test',
      passwordHash: fixturePasswordHash,
      role: 'USER',
      status: 'ACTIVE',
      joinedDate: '2026-01-01',
    },
    {
      id: 'member2',
      name: 'Second Member',
      email: 'second@example.test',
      passwordHash: fixturePasswordHash,
      role: 'USER',
      status: 'ACTIVE',
      joinedDate: '2026-01-01',
    },
  ],
  profiles: [{ userId: 'member1', height: 180, currentWeight: 80, targetWeight: 80 }],
  trainers: [],
  workoutPlans: [],
  workoutAssignments: [],
  progressRecords: [],
  nutritionLogs: [],
  membershipPlans: [],
  userMemberships: [],
  bookings: [],
  payments: [],
  notifications: [],
  trainerNotes: [],
  passwordResetTokens: [],
});
let database: PGlite, server: Server, base: string, token: string, secondToken: string;
let sqlFailure = false;
const realFetch = globalThis.fetch;
let providerMode: 'normal' | 'malformed' | 'refusal' | 'timeout' = 'normal';
let providerCalls = 0;
let providerPayload: unknown;
const capturedInputs: string[] = [];

before(async () => {
  fixturePasswordHash = await bcrypt.hash(randomBytes(24).toString('hex'), 10);
  database = new PGlite();
  await database.waitReady;
  // PGlite is a real embedded PostgreSQL engine with one connection. Serialize
  // test clients; production uses independent pg connections and advisory locks.
  let tail = Promise.resolve();
  const query = async (sql: string, params?: unknown[]) => {
    if (sqlFailure && sql.startsWith('INSERT INTO nutrition_logs')) {
      sqlFailure = false;
      throw new Error('simulated disk failure');
    }
    if (sql.includes('CREATE TABLE') || sql.includes('DO $$')) {
      const r = await database.exec(sql);
      return r.at(-1)!;
    }
    return database.query(sql, params);
  };
  const connect = async () => {
    const previous = tail;
    let release!: () => void;
    tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    return { query, release };
  };
  setPoolForTests({
    connect,
    query: async (sql: string, params?: unknown[]) => {
      const c = await connect();
      try {
        return await c.query(sql, params);
      } finally {
        c.release();
      }
    },
    end: async () => {},
  } as unknown as Pool);
  await ensureSchema();
  await persistAll(fixture());
  const { apiRouter } = await import('../server/api.js');
  const { generateToken } = await import('../server/auth.js');
  token = generateToken(fixture().users[0]);
  secondToken = generateToken(fixture().users[1]);
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);
  app.use((error: any, _req: any, res: any, _next: any) =>
    res
      .status(error.status || 500)
      .json({ error: error.status ? error.message : 'Service unavailable' }),
  );
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  base = `http://127.0.0.1:${(server.address() as any).port}/api`;
  globalThis.fetch = (async (url: any, init?: RequestInit) => {
    if (String(url).startsWith('https://api.openai.com/')) {
      providerCalls++;
      capturedInputs.push(String(init?.body));
      if (providerMode === 'timeout') throw new DOMException('timeout', 'TimeoutError');
      const content =
        providerMode === 'refusal'
          ? [{ type: 'refusal', refusal: 'cannot comply' }]
          : [
              {
                type: 'output_text',
                text:
                  providerMode === 'malformed'
                    ? '{bad'
                    : JSON.stringify(
                        providerPayload || {
                          items: [{ food: 'cooked rice', grams: 150 }],
                          questions: [],
                          assumptions: [],
                        },
                      ),
              },
            ];
      return Response.json({
        status: 'completed',
        output: [{ content }],
        usage: { input_tokens: 20, output_tokens: 30 },
      });
    }
    if (String(url).startsWith('https://api.nal.usda.gov/'))
      return Response.json({
        foods: [
          {
            fdcId: 123,
            description: 'Rice, cooked',
            foodNutrients: [
              { nutrientId: 1008, value: 130 },
              { nutrientId: 1003, value: 2.7 },
              { nutrientId: 1005, value: 28 },
              { nutrientId: 1004, value: 0.3 },
            ],
          },
        ],
      });
    return realFetch(url, init);
  }) as typeof fetch;
});
after(async () => {
  globalThis.fetch = realFetch;
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  await database?.close();
});
async function request(path: string, method = 'GET', body?: unknown, auth = token) {
  const response = await realFetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: (await response.json()) as any };
}

test('energy reference fixture, age boundaries, invalid data and timezone midnight', () => {
  const estimate = calculateHealth(
    { height: 180, currentWeight: 80 },
    preferences,
    new Date('2026-09-22T00:00:00Z'),
  );
  assert.equal(estimate.bmi, 24.7);
  assert.equal(estimate.restingCalories, 1750);
  assert.equal(estimate.maintenanceCalories, 2100);
  assert.equal(estimate.targets?.dailyCalorieTarget, 2100);
  assert.equal(
    calculateHealth({ height: 0, currentWeight: 80 }, preferences).status,
    'needs_input',
  );
  assert.equal(
    calculateHealth({ height: 180, currentWeight: 80 }, { ...preferences, eligibility: 'review' })
      .status,
    'review_required',
  );
  assert.equal(
    calculateHealth(
      { height: 180, currentWeight: 80 },
      { ...preferences, dateOfBirth: '2010-01-01' },
    ).status,
    'review_required',
  );
  assert.equal(localDate('Asia/Kolkata', new Date('2026-09-22T20:00:00Z')), '2026-09-23');
  assert.equal(localDate('America/Los_Angeles', new Date('2026-09-22T01:00:00Z')), '2026-09-21');
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(ageAt('2006-09-23', '2026-09-22'), 19);
});
test('schema migration is idempotent and preserves existing rows', async () => {
  await ensureSchema();
  assert.equal((await hydrateAll()).users.length, 2);
});
test('independent stale snapshots merge; conflicting row writes reject atomically', async () => {
  const beforeA = await hydrateAll(),
    beforeB = await hydrateAll();
  const afterA = structuredClone(beforeA),
    afterB = structuredClone(beforeB);
  afterA.users[0].phone = '111';
  afterB.users[1].phone = '222';
  await Promise.all([persistChanges(beforeA, afterA), persistChanges(beforeB, afterB)]);
  assert.deepEqual((await hydrateAll()).users.map((u) => u.phone).sort(), ['111', '222']);
  const conflicting = structuredClone(beforeA);
  conflicting.users[0].phone = '333';
  await assert.rejects(persistChanges(beforeA, conflicting), (e: any) => e.status === 409);
  assert.equal((await hydrateAll()).users.find((u) => u.id === 'member1')?.phone, '111');
});
test('unauthorized requests denied; preferences validated; targets reviewed and accepted', async () => {
  assert.equal((await request('/user/health', 'GET', undefined, '')).status, 401);
  assert.equal(
    (
      await request('/user/health/preferences', 'PUT', {
        ...preferences,
        timezone: 'invalid/timezone',
      })
    ).status,
    400,
  );
  assert.equal((await request('/user/health/preferences', 'PUT', preferences)).status, 200);
  const proposal = await request('/user/health/estimate', 'POST', {});
  assert.equal(proposal.status, 200);
  assert.ok(proposal.body.target.id);
  assert.equal(
    (await request(`/user/health/targets/${proposal.body.target.id}/accept`, 'POST', {})).status,
    422,
  );
  process.env.HEALTH_POLICY_REVIEWED = 'true';
  assert.equal(
    (
      await request(
        `/user/health/targets/${proposal.body.target.id}/accept`,
        'POST',
        {},
        secondToken,
      )
    ).status,
    404,
  );
  assert.equal(
    (await request(`/user/health/targets/${proposal.body.target.id}/accept`, 'POST', {})).status,
    200,
  );
  assert.equal((await request('/user/nutrition')).body.nutrition.dailyCalorieTarget > 0, true);
});
test('manual logs retain unknown values, reject retries with changed bodies, edit and delete only own meals', async () => {
  const body = {
    requestId: 'manual-request-0001',
    type: 'Lunch',
    name: 'Test meal',
    calories: 500,
    proteinGrams: null,
    carbsGrams: 80,
    fatsGrams: 10,
  };
  const first = await request('/user/nutrition/meals', 'POST', body);
  assert.equal(first.status, 201);
  assert.equal(first.body.meal.unknownMacros, true);
  const replay = await request('/user/nutrition/meals', 'POST', body);
  assert.equal(replay.status, 200);
  assert.equal(replay.body.nutrition.meals.length, 1);
  assert.equal(
    (await request('/user/nutrition/meals', 'POST', { ...body, calories: 600 })).status,
    409,
  );
  assert.equal(
    (await request(`/user/nutrition/meals/${first.body.meal.id}`, 'DELETE', undefined, secondToken))
      .status,
    404,
  );
  const updated = await request(`/user/nutrition/meals/${first.body.meal.id}`, 'PATCH', {
    ...body,
    calories: 300,
  });
  assert.equal(updated.body.nutrition.consumedCalories, 300);
  assert.equal(
    (await request(`/user/nutrition/meals/${first.body.meal.id}`, 'DELETE')).body.nutrition
      .consumedCalories,
    0,
  );
});
test('a failed save does not report success or leak partially mutated state', async () => {
  sqlFailure = true;
  const response = await request('/user/nutrition/meals', 'POST', {
    requestId: 'manual-request-0002',
    type: 'Lunch',
    name: 'Not saved',
    calories: 400,
  });
  assert.equal(response.status, 500);
  assert.equal((await request('/user/nutrition')).body.nutrition.meals.length, 0);
});
test('AI unavailable is explicit; consent is required; provider output uses database nutrition', async () => {
  assert.equal(
    (await request('/user/nutrition/estimate-meal', 'POST', { description: '150g rice' })).status,
    503,
  );
  Object.assign(process.env, {
    AI_ENABLED: 'true',
    AI_MODEL: 'test-model',
    AI_API_KEY: 'test-key',
    FOOD_DATA_API_KEY: 'test-food-key',
    AI_INPUT_USD_PER_MILLION: '1',
    AI_OUTPUT_USD_PER_MILLION: '1',
    AI_MONTHLY_BUDGET: '10',
  });
  const result = await request('/user/nutrition/estimate-meal', 'POST', {
    description: '150g cooked rice',
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.draft.calories, 195);
  assert.ok(
    capturedInputs.every((s) => !s.includes('first@example.test') && !s.includes('First Member')),
  );
  const confirmed = await request('/user/nutrition/meals', 'POST', {
    requestId: 'estimated-request-01',
    draftId: result.body.draft.id,
    type: 'Lunch',
    confirmed: true,
    suitableForDiet: true,
  });
  assert.equal(confirmed.status, 201);
  assert.equal(confirmed.body.meal.source, 'USDA estimate');
  assert.equal((await request('/user/nutrition/plan', 'POST', {})).status, 422);
});
test('malformed output, refusal and provider timeout cannot save a draft', async () => {
  const previous = (await request('/user/health')).body.state.drafts.length;
  for (const mode of ['malformed', 'refusal', 'timeout'] as const) {
    providerMode = mode;
    assert.ok(
      (await request('/user/nutrition/estimate-meal', 'POST', { description: '150g cooked rice' }))
        .status >= 400,
    );
  }
  providerMode = 'normal';
  assert.equal((await request('/user/health')).body.state.drafts.length, previous);
});
test('reports calculate coverage, preserve snapshots and keep another member private', async () => {
  const result = await request('/user/reports', 'POST', { days: 7 });
  assert.equal(result.status, 200);
  assert.equal(result.body.report.loggedDays, 1);
  assert.equal(result.body.report.totalDays, 7);
  assert.equal(result.body.report.averageLoggedCalories, 195);
  assert.equal(result.body.report.weightChangeKg, null);
  assert.ok(result.body.report.inputSnapshot.days.length);
  assert.equal(
    (await request(`/user/reports/${result.body.report.id}`, 'GET', undefined, secondToken)).status,
    404,
  );
  const empty = buildReport(fixture(), 'member2');
  assert.equal(empty.averageLoggedCalories, null);
});
test('changed inputs invalidate target acceptance; revocation blocks AI before calling provider', async () => {
  const target = (await request('/user/health')).body.state.targets[0];
  await request('/user/health/preferences', 'PUT', {
    ...preferences,
    activity: 'active',
    aiConsent: false,
  });
  assert.equal((await request(`/user/health/targets/${target.id}/accept`, 'POST', {})).status, 409);
  const count = providerCalls;
  assert.equal(
    (await request('/user/nutrition/estimate-meal', 'POST', { description: 'rice' })).status,
    403,
  );
  assert.equal(providerCalls, count);
});

test('stale health recommendations conflict with a concurrent profile change', async () => {
  const before = await hydrateAll(),
    stale = structuredClone(before);
  stale.wellnessStates![0].payload.consentVersion = 'stale-result';
  const fresh = await hydrateAll(),
    changed = structuredClone(fresh);
  changed.profiles[0].currentWeight = 81;
  await persistChanges(fresh, changed);
  await assert.rejects(persistChanges(before, stale), (e: any) => e.status === 409);
});

test('diet plans recalculate approved foods, reject unknown IDs, and respect allergy restrictions', async () => {
  await request('/user/health/preferences', 'PUT', preferences);
  const proposal = (await request('/user/health/estimate', 'POST', {})).body.target;
  await request(`/user/health/targets/${proposal.id}/accept`, 'POST', {});
  const { getDatabase, saveDatabase } = await import('../server/db.js');
  const { healthState } = await import('../server/health/state.js');
  const db = await getDatabase(),
    state = healthState(db, 'member1');
  const t = proposal.estimate.targets;
  const foodTotals = {
    calories: t.dailyCalorieTarget / 3,
    proteinGrams: t.proteinTargetGrams / 3,
    carbsGrams: t.carbsTargetGrams / 3,
    fatsGrams: t.fatsTargetGrams / 3,
  };
  const log = db.nutritionLogs.find((l) => l.userId === 'member1')!;
  for (let i = 0; i < 3; i++) {
    const id = `approved-${i}`;
    state.drafts.push({
      id,
      name: `Approved food ${i}`,
      approvedDiet: 'vegetarian',
      createdAt: new Date().toISOString(),
      status: 'ready',
      questions: [],
      assumptions: [],
      ...foodTotals,
      portions: [
        {
          foodId: 900 + i,
          name: `Approved food ${i}`,
          grams: 100,
          source: 'https://example.test/food',
          ...foodTotals,
        },
      ],
    });
    log.meals.push({ id, draftId: id, type: 'Lunch', time: '12:00', name: id, ...foodTotals });
  }
  await saveDatabase(db);
  providerPayload = {
    meals: [0, 1, 2].map((i) => ({
      name: `Meal ${i}`,
      portions: [{ foodId: 900 + i, grams: 100 }],
    })),
  };
  const result = await request('/user/nutrition/plan', 'POST', {});
  assert.equal(result.status, 200);
  assert.ok(Math.abs(result.body.plan.totals.calories - t.dailyCalorieTarget) <= 2);
  assert.equal(
    (await request(`/user/nutrition/plans/${result.body.plan.id}`, 'GET', undefined, secondToken))
      .status,
    404,
  );
  providerPayload = {
    meals: [0, 1, 2].map((i) => ({
      name: `Meal ${i}`,
      portions: [{ foodId: 999999, grams: 100 }],
    })),
  };
  assert.equal((await request('/user/nutrition/plan', 'POST', {})).status, 502);
  await request('/user/health/preferences', 'PUT', { ...preferences, allergies: 'peanuts' });
  const allergyTarget = (await request('/user/health/estimate', 'POST', {})).body.target;
  await request(`/user/health/targets/${allergyTarget.id}/accept`, 'POST', {});
  const calls = providerCalls;
  assert.equal((await request('/user/nutrition/plan', 'POST', {})).status, 422);
  assert.equal(providerCalls, calls);
  providerPayload = undefined;
});

test('ambiguous portions prompt for details and budget exhaustion makes no provider call', async () => {
  providerPayload = {
    items: [{ food: 'rice', grams: null }],
    questions: ['How many grams of cooked rice?'],
    assumptions: [],
  };
  const uncertain = await request('/user/nutrition/estimate-meal', 'POST', { description: 'rice' });
  assert.equal(uncertain.status, 200);
  assert.equal(uncertain.body.draft.status, 'needs_input');
  const calls = providerCalls;
  process.env.AI_MONTHLY_BUDGET = '0.000001';
  assert.equal(
    (await request('/user/nutrition/estimate-meal', 'POST', { description: '150g rice' })).status,
    429,
  );
  assert.equal(providerCalls, calls);
  process.env.AI_MONTHLY_BUDGET = '10';
  providerPayload = undefined;
});

test('deleting health artifacts removes preferences and preserves manually logged meals', async () => {
  const count = (await request('/user/nutrition')).body.nutrition.meals.length;
  assert.equal((await request('/user/health', 'DELETE')).status, 200);
  const state = (await request('/user/health')).body.state;
  assert.equal(state.preferences, undefined);
  assert.equal(state.reports.length, 0);
  assert.equal(state.targets.length, 0);
  assert.equal((await request('/user/nutrition')).body.nutrition.meals.length, count);
});
