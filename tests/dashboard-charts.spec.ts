import { test, expect, type Page } from '@playwright/test';

async function mockApi(page: Page, role: 'USER' | 'TRAINER' | 'ADMIN') {
  await page.addInitScript(() => localStorage.setItem('ironcore_token', 'charts-test'));
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url()).pathname;
    let result: unknown = {};
    if (url.endsWith('/auth/me')) result = {
      user: { id: 'u1', name: 'Priya Parihar', email: 'priya@example.com', role, status: 'ACTIVE', joinedDate: '2026-01-15', fitnessGoal: 'Muscle Gain' },
      profile: { currentWeight: 72, targetWeight: 68, height: 175, bodyFatPercentage: 18, muscleMass: 40 },
    };
    if (url.endsWith('/notifications')) result = { notifications: [] };
    if (url.endsWith('/user/membership')) result = {
      membership: { id: 'm1', userId: 'u1', planId: 'p1', planName: 'Premium', status: 'ACTIVE', startDate: '2026-01-15', expiryDate: '2027-01-15', billingCycle: 'annual', pricePaid: 499, autoRenew: true },
      plans: [],
    };
    if (url.endsWith('/dashboard-summary')) result = {
      stats: { currentWeight: 72, targetWeight: 68, caloriesBurned: 360, dailySteps: 8200,
        hasProgressToday: true, workoutStreak: 4, weightChange30d: -1.5, overallProgressPercent: 30 },
      profile: { currentWeight: 72, targetWeight: 68, height: 175 },
      todayWorkout: null, nutrition: null, upcomingBooking: null,
    };
    if (url.endsWith('/progress')) result = { records: [
      { id: 'p1', userId: 'u1', date: '2026-09-01', weightKg: 75, caloriesBurned: 400, steps: 7000, strengthScore: 60, status: 'LOGGED' },
      { id: 'p2', userId: 'u1', date: '2026-09-08', weightKg: 74, caloriesBurned: 420, steps: 7500, strengthScore: 62, status: 'LOGGED' },
      { id: 'p3', userId: 'u1', date: '2026-09-15', weightKg: 73, caloriesBurned: 410, steps: 8000, strengthScore: 65, status: 'LOGGED' },
      { id: 'p4', userId: 'u1', date: '2026-09-22', weightKg: 72, caloriesBurned: 440, steps: 8200, strengthScore: 68, status: 'LOGGED' },
    ] };
    if (url.endsWith('/admin/overview')) result = {
      stats: { totalUsers: 120, activeMembers: 96, totalRevenue: 6400, activeTrainers: 8, todayCheckins: 0 },
      recentUsers: [{ userId: 'a', name: 'Sam Rivera', fitnessGoal: 'Strength', status: 'ACTIVE' }],
      recentPayments: [{ id: 'p1', planName: 'Pro', date: '2026-09-01', paymentMethod: 'Card', amount: 49, status: 'PAID' }],
    };
    if (url.endsWith('/admin/analytics')) result = {
      stats: { newRegistrationsThisMonth: 14 },
      charts: {
        userGrowth: [
          { month: 'Apr', users: 60, revenue: 2000 }, { month: 'May', users: 72, revenue: 2400 },
          { month: 'Jun', users: 84, revenue: 2800 }, { month: 'Jul', users: 95, revenue: 3100 },
          { month: 'Aug', users: 108, revenue: 3600 }, { month: 'Sep', users: 120, revenue: 4000 },
        ],
        membershipDistribution: [{ name: 'Basic', count: 40 }, { name: 'Pro', count: 55 }, { name: 'Elite', count: 21 }],
      },
    };
    if (url.endsWith('/trainer/summary')) {
      const today = new Date().toISOString().split('T')[0];
      result = {
        stats: { assignedClientsCount: 12, todaySessionsCount: 1, totalPlansCount: 8 },
        clients: [{ userId: 'c1', name: 'Jo Lee', fitnessGoal: 'Endurance' }],
        todaySessions: [{ id: 's1', userId: 'c1', sessionType: '1-on-1 PT', date: today, timeSlot: '10:00 AM', status: 'CONFIRMED' }],
        upcomingSessions: [{ id: 's1', userId: 'c1', sessionType: '1-on-1 PT', date: today, timeSlot: '10:00 AM', status: 'CONFIRMED' }],
      };
    }
    await route.fulfill({ json: result });
  });
}

test('trainer summary stats populate the KPI cards (no blank cards from a field-name mismatch)', async ({ page }) => {
  await mockApi(page, 'TRAINER');
  await page.goto('/trainer');
  const kpis = page.locator('.kpi-card');
  await expect(kpis.filter({ hasText: 'Assigned Athletes' })).toBeVisible();
  await expect(kpis.filter({ hasText: 'Assigned Athletes' }).locator('.kpi-value')).toHaveText('12');
  await expect(kpis.filter({ hasText: 'Workout Plans' }).locator('.kpi-value')).toHaveText('8');
});

test('line, bar and donut charts render at a readable size and respond to hover', async ({ page }, testInfo) => {
  await mockApi(page, 'ADMIN');
  await page.goto('/admin');

  const lineChart = page.locator('.card', { hasText: 'Member Growth' }).locator('svg').first();
  const lineBox = await lineChart.boundingBox();
  expect(lineBox!.width).toBeGreaterThanOrEqual(300);
  expect(lineBox!.height).toBeGreaterThanOrEqual(220);

  await lineChart.hover({ position: { x: 200, y: 100 } });
  await expect(page.locator('.chart-tooltip')).toBeVisible();

  const donut = page.locator('.card', { hasText: 'Membership Mix' });
  await expect(donut.locator('.chart-legend').getByText('Basic')).toBeVisible();
  await expect(donut.locator('.chart-legend').getByText('Pro')).toBeVisible();
  await expect(donut.locator('.chart-legend').getByText('Elite')).toBeVisible();

  await page.screenshot({ path: testInfo.outputPath('admin-charts.png'), fullPage: true });
});

test('trainer sessions bar chart renders and profile hero shows real identity data', async ({ page }, testInfo) => {
  await mockApi(page, 'TRAINER');
  await page.goto('/trainer');
  const bars = page.locator('.card', { hasText: 'Sessions This Week' }).locator('svg rect[rx="4"]');
  await expect(bars).toHaveCount(7);

  await mockApi(page, 'USER');
  await page.goto('/dashboard/profile');
  await expect(page.getByRole('heading', { name: 'Priya Parihar' })).toBeVisible();
  await expect(page.getByText('Premium Member')).toBeVisible();
  await expect(page.getByText('Member since January 2026')).toBeVisible();
  await expect(page.getByText('72 kg')).toBeVisible();
  await expect(page.getByText('175 cm')).toBeVisible();
  const overview = page.locator('.card', { hasText: 'Overview' });
  await expect(overview.getByText('23.5')).toBeVisible();
  await expect(overview.getByText('Muscle Gain')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('profile-hero.png'), fullPage: true });
});

test('progress page renders a real weight trend line chart from logged entries', async ({ page }) => {
  await mockApi(page, 'USER');
  await page.goto('/dashboard/progress');
  const chart = page.locator('.card', { hasText: 'Weight Trend' }).locator('svg').first();
  await expect(chart).toBeVisible();
  const box = await chart.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(300);
  expect(box!.height).toBeGreaterThanOrEqual(220);
});
