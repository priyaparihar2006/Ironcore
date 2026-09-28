import { test, expect, type Page } from '@playwright/test';

async function mockApi(page: Page, role: 'USER' | 'TRAINER' | 'ADMIN') {
  await page.addInitScript(() => localStorage.setItem('ironcore_token', 'topbar-test'));
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url()).pathname;
    let result: unknown = {};
    if (url.endsWith('/auth/me')) result = {
      user: { id: 'u1', name: 'Alex Morgan', email: 'alex@example.com', role, status: 'ACTIVE' },
      profile: { currentWeight: 80, targetWeight: 75, height: 180 },
    };
    if (url.endsWith('/notifications')) result = { notifications: [
      { id: 'n1', userId: 'u1', title: 'Welcome', message: 'Glad you are here', date: 'Today', read: false, type: 'info' },
    ] };
    if (url.endsWith('/dashboard-summary')) result = {
      stats: { currentWeight: 80, targetWeight: 75, caloriesBurned: 360, dailySteps: 8200,
        hasProgressToday: true, workoutStreak: 4, weightChange30d: -1.5, overallProgressPercent: 30 },
      profile: { currentWeight: 80, targetWeight: 75, height: 180 },
      todayWorkout: null, nutrition: null, upcomingBooking: null,
    };
    if (url.endsWith('/admin/overview')) result = {
      stats: { totalUsers: 120, activeMembers: 96, totalRevenue: 6400, activeTrainers: 8, todayCheckins: 24 },
      recentUsers: [{ userId: 'a', name: 'Sam Rivera', fitnessGoal: 'Strength', status: 'ACTIVE' }],
      recentPayments: [{ id: 'p1', planName: 'Pro', date: '2026-09-01', paymentMethod: 'Card', amount: 49, status: 'PAID' }],
    };
    if (url.endsWith('/admin/analytics')) result = {
      stats: { newRegistrationsThisMonth: 5 },
      charts: { userGrowth: [{ month: 'Sep', users: 96, revenue: 400 }], membershipDistribution: [{ name: 'Pro', count: 1 }] },
    };
    if (url.endsWith('/admin/users')) result = { users: [
      { id: 'a', name: 'Sam Rivera', email: 'sam@example.com', role: 'USER', status: 'ACTIVE', createdAt: '2026-01-01' },
      { id: 'b', name: 'Jo Lee', email: 'jo@example.com', role: 'TRAINER', status: 'ACTIVE', createdAt: '2026-01-02' },
    ] };
    await route.fulfill({ json: result });
  });
}

test('topbar is compact: 40px search up to 280px wide, and a short row of actions', async ({ page }, testInfo) => {
  await mockApi(page, 'USER');
  await page.goto('/dashboard');
  const search = page.getByRole('searchbox');
  const box = await search.boundingBox();
  expect(box!.height).toBe(40);
  expect(box!.width).toBeLessThanOrEqual(280);
  await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible();
  if (testInfo.project.name === 'desktop') {
    await expect(page.getByRole('button', { name: 'Help' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Switch to dark theme/ })).toBeVisible();
    // Bell, help, theme and profile only.
    expect(await page.locator('.dashboard-topbar button:not(.lg\\:hidden)').count()).toBeLessThanOrEqual(4);
  }
});

test('page header, KPI cards and 12-column grid follow the design system', async ({ page }, testInfo) => {
  await mockApi(page, 'ADMIN');
  await page.goto('/admin');
  const title = page.locator('main h1');
  await expect(title).toHaveText('Overview');
  const desktop = testInfo.project.name === 'desktop';
  await expect(title).toHaveCSS('font-size', desktop ? '30px' : '28px');
  await expect(page.locator('.page-subtitle')).toHaveCSS('font-size', '14px');
  await expect(page.locator('.page-header .btn-primary')).toHaveCSS('height', '42px');

  const kpis = page.locator('.kpi-card');
  expect(await kpis.count()).toBeLessThanOrEqual(4);
  const first = await kpis.first().boundingBox();
  expect(first!.height).toBeGreaterThanOrEqual(120);
  expect(first!.height).toBeLessThanOrEqual(140);
  await expect(kpis.first()).toHaveCSS('border-radius', '16px');

  if (desktop) {
    const [main, side] = await Promise.all([
      page.locator('.dashboard-grid .span-8').first().boundingBox(),
      page.locator('.dashboard-grid .span-4').first().boundingBox(),
    ]);
    expect(main!.width / side!.width).toBeGreaterThan(1.8);
    expect(main!.width / side!.width).toBeLessThan(2.2);
  }
});

test('theme toggle switches the dashboard to dark and remembers the choice', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'toggle lives in the topbar on desktop');
  await mockApi(page, 'USER');
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.dashboard-shell')).toHaveCSS('color-scheme', 'dark');
  await page.screenshot({ path: testInfo.outputPath('user-dark.png'), fullPage: true });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('topbar search sends admins to the user directory with the query applied', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'search field is exercised on desktop');
  await mockApi(page, 'ADMIN');
  await page.goto('/admin');
  await page.getByRole('searchbox').fill('jo lee');
  await page.getByRole('searchbox').press('Enter');
  await expect(page).toHaveURL(/\/admin\/users\?q=jo%20lee/);
  await expect(page.getByPlaceholder('Search by athlete name or email...')).toHaveValue('jo lee');
  await expect(page.getByText('jo@example.com')).toBeVisible();
  await expect(page.getByText('sam@example.com')).toHaveCount(0);
});

test('help and account panels open and close with Escape', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'help lives in the topbar on desktop');
  await mockApi(page, 'USER');
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Help' }).click();
  await expect(page.getByText('Help & support')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Help & support')).toHaveCount(0);
  await page.getByRole('button', { name: 'Account menu' }).click();
  await expect(page.getByRole('button', { name: 'Sign Out' }).last()).toBeVisible();
});
