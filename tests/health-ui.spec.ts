import { test, expect } from '@playwright/test';

test('health onboarding, report and manual/AI meal confirmation work on desktop and mobile', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('ironcore_token', 'ui-test-token'));
  const preferences = {
    dateOfBirth: '1990-01-01',
    formulaSex: 'male',
    activity: 'sedentary',
    goal: 'maintain',
    timezone: 'Asia/Kolkata',
    eligibility: 'general',
    diet: 'vegetarian',
    allergies: 'none',
    dislikes: '',
    cuisine: '',
    cookingMinutes: 30,
    budget: 'medium',
    aiConsent: true,
  };
  const estimate = {
    status: 'ready',
    message: 'Review these estimated targets before applying them.',
    bmi: 24.7,
    restingCalories: 1750,
    maintenanceCalories: 2100,
    targets: {
      dailyCalorieTarget: 2100,
      proteinTargetGrams: 105,
      carbsTargetGrams: 262,
      fatsTargetGrams: 70,
    },
    assumptions: ['BMI is a screening measure.'],
    formulaVersion: 'test',
    policyVersion: 'test',
  };
  const state: any = { preferences, targets: [], drafts: [], plans: [], reports: [] };
  const nutrition: any = {
    id: 'day',
    date: '2026-09-22',
    dailyCalorieTarget: 0,
    proteinTargetGrams: 0,
    carbsTargetGrams: 0,
    fatsTargetGrams: 0,
    consumedCalories: 0,
    consumedProteinGrams: 0,
    consumedCarbsGrams: 0,
    consumedFatsGrams: 0,
    meals: [],
  };
  const report = {
    id: 'report',
    createdAt: new Date().toISOString(),
    start: '2026-09-16',
    end: '2026-09-22',
    timezone: 'Asia/Kolkata',
    loggedDays: 0,
    totalDays: 7,
    averageLoggedCalories: null,
    weightChangeKg: null,
    measurements: 0,
    commentary: ['No meals were logged.'],
    source: 'calculated',
    inputHash: 'test',
    inputSnapshot: { days: [], weights: [] },
  };
  const draft = {
    id: 'draft',
    name: '150 g cooked rice',
    status: 'ready',
    createdAt: new Date().toISOString(),
    calories: 195,
    proteinGrams: 4,
    carbsGrams: 42,
    fatsGrams: 0,
    questions: [],
    assumptions: ['Confirm these candidate matches.'],
    portions: [
      {
        foodId: 123,
        name: 'Rice, cooked',
        grams: 150,
        calories: 195,
        proteinGrams: 4,
        carbsGrams: 42,
        fatsGrams: 0,
        source: 'https://fdc.nal.usda.gov/food-details/123/nutrients',
      },
    ],
  };
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^.*\/api/, '');
    const method = route.request().method();
    const body =
      method === 'POST' || method === 'PUT' || method === 'PATCH'
        ? route.request().postDataJSON()
        : {};
    let result: unknown = {};
    if (path === '/auth/me')
      result = {
        user: {
          id: 'u',
          name: 'Test Athlete',
          role: 'USER',
          status: 'ACTIVE',
          email: 'athlete@example.test',
        },
        profile: { currentWeight: 80, targetWeight: 80, height: 180 },
      };
    else if (path === '/user/notifications') result = { notifications: [] };
    else if (path === '/user/health')
      result = { state, estimate, aiAvailable: true, foodAvailable: true, policyReviewed: false };
    else if (path === '/user/health/preferences') {
      state.preferences = body;
      result = { preferences: body, estimate };
    } else if (path === '/user/health/estimate') {
      const target = { id: 'target', estimate, inputHash: 'test' };
      state.targets = [target];
      result = { estimate, target };
    } else if (path === '/user/reports') {
      state.reports = [report];
      result = { report };
    } else if (path === '/user/nutrition/estimate-meal') result = { draft };
    else if (path === '/user/nutrition/meals' && method === 'POST') {
      const m = body.draftId
        ? { ...draft, type: body.type, source: 'USDA estimate' }
        : { ...body, source: 'manual' };
      nutrition.meals.push({ ...m, id: 'meal-' + nutrition.meals.length, time: '12:00' });
      nutrition.consumedCalories = nutrition.meals.reduce(
        (n: number, entry: any) => n + entry.calories,
        0,
      );
      result = { nutrition };
    } else if (path === '/user/nutrition') result = { nutrition };
    else {
      await route.fulfill({ status: 404, json: { error: 'Unexpected mocked path: ' + path } });
      return;
    }
    await route.fulfill({ json: result });
  });
  await page.goto('/dashboard/health');
  await expect(page.getByRole('heading', { name: 'Understand your needs.' })).toBeVisible();
  await page.getByLabel('Preferred cuisines').fill('Indian');
  await expect(page.getByRole('button', { name: 'Calculate my estimates' })).toBeDisabled();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await expect(page.getByRole('status')).toContainText('Preferences saved');
  await page.getByRole('button', { name: 'Calculate my estimates' }).click();
  await expect(page.getByRole('button', { name: 'Accept these targets' })).toBeDisabled();
  await page.getByRole('button', { name: 'Last 7 days' }).click();
  await expect(page.getByText('No meals were logged.')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('NaN');
  await page.goto('/dashboard/nutrition');
  await expect(
    page.getByText('No personalized targets for this day.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Log a meal', exact: true }).click();
  await page.getByLabel('Meal name', { exact: true }).fill('Lunch bowl');
  await page.getByLabel('Calories (kcal)', { exact: true }).fill('450');
  await page.getByRole('button', { name: 'Save meal', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lunch bowl' })).toBeVisible();
  await page.getByLabel('Meal description').fill('150 g cooked rice');
  await page.getByRole('button', { name: 'Estimate meal', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Confirm and log meal' })).toBeDisabled();
  await page.getByLabel('I checked the food matches, preparation and portions.').check();
  await page.getByRole('button', { name: 'Confirm and log meal' }).click();
  await expect(page.getByRole('heading', { name: '150 g cooked rice' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});
