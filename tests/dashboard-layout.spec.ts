import { test, expect } from '@playwright/test';

for (const [role, path] of [['USER', '/dashboard'], ['TRAINER', '/trainer'], ['ADMIN', '/admin']]) {
  test(`${role} dashboard spacing, navigation and responsive layout`, async ({ page }, testInfo) => {
    await page.addInitScript(() => localStorage.setItem('ironcore_token', 'layout-test'));
    await page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url()).pathname;
      let result: unknown = {};
      if (url.endsWith('/auth/me')) result = {
        user: { id: 'layout-user', name: 'Alex Morgan', email: 'alex@example.com', role, status: 'ACTIVE' },
        profile: { currentWeight: 80, targetWeight: 75, height: 180 },
      };
      if (url.endsWith('/notifications')) result = { notifications: [] };
      if (url.endsWith('/dashboard-summary')) result = {
        stats: { currentWeight: 80, targetWeight: 75, caloriesBurned: 360, dailySteps: 8200,
          hasProgressToday: true, workoutStreak: 4, weightChange30d: -1.5, overallProgressPercent: 30 },
        profile: { currentWeight: 80, targetWeight: 75, height: 180 },
        todayWorkout: null, nutrition: null, upcomingBooking: null,
      };
      if (url.endsWith('/trainer/summary')) result = {
        stats: { assignedClientsCount: 12, todaySessionsCount: 3, totalPlansCount: 8 },
        clients: [], todaySessions: [],
      };
      if (url.endsWith('/admin/overview')) result = {
        stats: { totalUsers: 120, activeMembers: 96, totalRevenue: 6400, activeTrainers: 8, todayCheckins: 24 },
        recentUsers: [], recentPayments: [],
      };
      await route.fulfill({ json: result });
    });
    await page.goto(path);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('.dashboard-topbar')).toHaveCSS('height', '68px');
    const desktop = testInfo.project.name === 'desktop';
    if (desktop) {
      await expect(page.locator('.dashboard-sidebar')).toHaveCSS('width', '256px');
      await expect(page.locator('main')).toHaveCSS('padding-left', '32px');
      await expect(page.locator('main')).toHaveCSS('padding-top', '28px');
      await expect(page.locator('main')).toHaveCSS('padding-bottom', '40px');
      await page.getByRole('button', { name: 'Collapse sidebar' }).click();
      await expect(page.locator('.dashboard-sidebar')).toHaveCSS('width', '80px');
      await expect(page.locator('.dashboard-sidebar nav a').first()).toHaveAttribute('aria-current', 'page');
      await expect(page.locator('.dashboard-sidebar').getByRole('button', { name: 'Sign Out' })).toBeVisible();
      await page.getByRole('button', { name: 'Expand sidebar' }).click();
    } else {
      await expect(page.locator('.dashboard-sidebar')).toBeHidden();
      await expect(page.locator('main')).toHaveCSS('padding-left', '16px');
      await page.getByRole('button', { name: 'Toggle navigation' }).click();
      await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
      await page.getByRole('button', { name: 'Toggle navigation' }).click();
      if (role === 'USER') {
        await page.getByRole('button', { name: 'Notifications', exact: true }).click();
        const popup = await page.getByText('No notifications yet.').boundingBox();
        expect(popup!.x).toBeGreaterThanOrEqual(0);
        expect(popup!.x + popup!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
        await page.getByRole('button', { name: 'Notifications', exact: true }).click();
      }
    }
    const noOverflow = async () => expect(await page.evaluate(() =>
      document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await noOverflow();
    await page.screenshot({ path: testInfo.outputPath(`${role.toLowerCase()}-dashboard.png`), fullPage: true });
    if (desktop) {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('main')).toHaveCSS('max-width', '1440px');
      const content = await page.locator('main').boundingBox();
      expect(content!.width).toBe(1440);
      expect(content!.x - 256).toBeCloseTo((1920 - 256 - 1440) / 2, 0);
      await noOverflow();
    } else {
      await page.setViewportSize({ width: 320, height: 740 });
      await noOverflow();
    }
  });
}
