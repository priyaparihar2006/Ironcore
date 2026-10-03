import { test, expect } from '@playwright/test';

const widths = [375, 390, 768, 1024, 1366, 1440, 1920];
const dashboardRoutes = [
  { role: 'USER', paths: ['/dashboard', '/dashboard/workouts', '/dashboard/progress', '/dashboard/nutrition', '/dashboard/membership', '/dashboard/bookings', '/dashboard/profile', '/dashboard/health'] },
  { role: 'TRAINER', paths: ['/trainer', '/trainer/clients', '/trainer/plans', '/trainer/schedule'] },
  { role: 'ADMIN', paths: ['/admin', '/admin/users', '/admin/trainers', '/admin/memberships', '/admin/payments'] },
] as const;

test('landing and all dashboard routes fit requested responsive widths', async ({ page }) => {
  test.setTimeout(240_000);
  let activeRole: string = 'USER';
  const workout = {
    id: 'workout-1',
    workoutTitle: 'Full Body Strength',
    assignedByTrainerName: 'Coach Morgan',
    status: 'PENDING',
    notes: 'Keep a controlled tempo and focus on form throughout each set.',
    exercises: [{ id: 'exercise-1', name: 'Romanian Deadlift', targetMuscle: 'Hamstrings and posterior chain', sets: 4, reps: 12, weightKg: 45 }],
  };
  const nutrition = {
    id: 'nutrition-1', date: '2026-10-02', dailyCalorieTarget: 2200,
    proteinTargetGrams: 150, carbsTargetGrams: 240, fatsTargetGrams: 70,
    consumedCalories: 850, consumedProteinGrams: 64, consumedCarbsGrams: 95,
    consumedFatsGrams: 26, meals: [],
  };

  await page.addInitScript(() => localStorage.setItem('ironcore_token', 'responsive-qa'));
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^.*\/api/, '');
    let result: unknown = {};
    if (path === '/auth/me') result = {
      user: { id: 'qa-user', name: 'Alex Morgan', email: 'alex@example.test', role: activeRole, status: 'ACTIVE' },
      profile: { currentWeight: 80, targetWeight: 75, height: 180 },
    };
    else if (path === '/user/notifications') result = { notifications: [] };
    else if (path === '/user/dashboard-summary') result = {
      stats: { currentWeight: 80, targetWeight: 75, caloriesBurned: 360, dailySteps: 8200, hasProgressToday: true, workoutStreak: 4, weightChange30d: -1.5, overallProgressPercent: 30 },
      profile: { currentWeight: 80, targetWeight: 75, height: 180 },
      todayWorkout: workout, nutrition, upcomingBooking: null,
    };
    else if (path === '/user/workouts') result = { workouts: [workout] };
    else if (path === '/user/progress') result = { records: [] };
    else if (path.startsWith('/user/nutrition')) result = { nutrition };
    else if (path === '/user/health') result = {
      state: { preferences: { timezone: 'UTC', goal: 'maintain', diet: 'omnivore' }, targets: [], drafts: [], plans: [], reports: [] },
      estimate: undefined, activeTarget: null, aiAvailable: false, foodAvailable: false, policyReviewed: false,
    };
    else if (path === '/user/membership') result = { membership: null, plans: [] };
    else if (path === '/user/bookings') result = { bookings: [], trainers: [] };
    else if (path === '/trainer/summary') result = {
      stats: { assignedClientsCount: 0, todaySessionsCount: 0, totalPlansCount: 0 }, clients: [], todaySessions: [],
    };
    else if (path === '/trainer/clients') result = { clients: [], workoutPlans: [] };
    else if (path === '/trainer/workouts') result = { workoutPlans: [] };
    else if (path === '/trainer/schedule') result = { sessions: [] };
    else if (path === '/admin/overview') result = {
      stats: { totalUsers: 0, activeMembers: 0, totalRevenue: 0, activeTrainers: 0, todayCheckins: 0 }, recentUsers: [], recentPayments: [],
    };
    else if (path === '/admin/users') result = { users: [] };
    else if (path === '/admin/trainers') result = { trainers: [], users: [] };
    else if (path === '/admin/memberships') result = { plans: [] };
    else if (path === '/admin/payments') result = { payments: [] };
    await route.fulfill({ json: result });
  });

  const checkViewportFit = async () => {
    const issues = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const outOfBounds: string[] = [];
      for (const element of document.querySelectorAll<HTMLElement>('button, a, input, select, textarea, img')) {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0) continue;
        if (rect.left < -1 || rect.right > viewportWidth + 1) {
          outOfBounds.push(`${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}: ${Math.round(rect.left)}..${Math.round(rect.right)}`);
        }
      }
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth,
        outOfBounds,
      };
    });
    expect(issues.documentWidth, `document overflow at ${issues.viewportWidth}px`).toBeLessThanOrEqual(issues.viewportWidth);
    expect(issues.outOfBounds, `visible controls/images outside viewport at ${issues.viewportWidth}px`).toEqual([]);
  };

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('#hero-primary-cta')).toBeVisible();
    await checkViewportFit();

    const heroImageElement = page.locator('img[alt="Fit athletic trainer"]');
    await expect.poll(() => heroImageElement.evaluate((image: HTMLImageElement) => image.naturalWidth), {
      message: 'hero image should load from the bundled asset',
      timeout: 30_000,
    }).toBeGreaterThan(0);
    const heroImage = await heroImageElement.evaluate((image: HTMLImageElement) => ({
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      rect: image.getBoundingClientRect().toJSON(),
    }));
    expect(heroImage.naturalWidth).toBeGreaterThan(0);
    expect(heroImage.rect.left).toBeGreaterThanOrEqual(-1);
    expect(heroImage.rect.right).toBeLessThanOrEqual(width + 1);

    const floatingCards = await page.locator('.hero-floating-card').evaluateAll((cards) => cards
      .filter((card) => getComputedStyle(card).display !== 'none')
      .map((card) => card.getBoundingClientRect().toJSON()));
    expect(floatingCards).toHaveLength(width >= 1280 ? 4 : 0);
    for (let first = 0; first < floatingCards.length; first += 1) {
      const card = floatingCards[first];
      expect(card.left).toBeGreaterThanOrEqual(-1);
      expect(card.right).toBeLessThanOrEqual(width + 1);
      for (let second = first + 1; second < floatingCards.length; second += 1) {
        const other = floatingCards[second];
        const overlaps = card.left < other.right && other.left < card.right
          && card.top < other.bottom && other.top < card.bottom;
        expect(overlaps, `floating cards ${first} and ${second} overlap at ${width}px`).toBe(false);
      }
    }

    const heroButton = page.locator('#hero-primary-cta');
    const normal = await heroButton.evaluate((element) => getComputedStyle(element).color);
    expect(normal).toBe('rgb(23, 25, 28)');
    await heroButton.hover();
    const hover = await heroButton.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      color: getComputedStyle(element).color,
    }));
    expect(hover.background).not.toBe('rgb(0, 0, 0)');
    expect(hover.color).toBe('rgb(23, 25, 28)');
    await heroButton.focus();
    const focus = await heroButton.evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(focus).toBe('solid');
    const buttonBounds = await heroButton.boundingBox();
    await page.mouse.move(buttonBounds!.x + buttonBounds!.width / 2, buttonBounds!.y + buttonBounds!.height / 2);
    await page.mouse.down();
    const active = await heroButton.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      color: getComputedStyle(element).color,
    }));
    expect(active.background).not.toBe('rgb(0, 0, 0)');
    expect(active.color).toBe('rgb(23, 25, 28)');
    await page.mouse.move(0, 0);
    await page.mouse.up();

    if (width < 1024) {
      await page.getByRole('button', { name: 'Toggle navigation' }).click();
      await expect(page.locator('header nav')).toBeVisible();
      await checkViewportFit();
    }
  }

  for (const group of dashboardRoutes) {
    activeRole = group.role;
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of group.paths) {
        await page.goto(path);
        await expect(page.locator('.dashboard-content')).toBeVisible();
        await checkViewportFit();
      }

      if (width < 1024) {
        await page.getByRole('button', { name: 'Toggle navigation' }).click();
        await expect(page.locator('.dashboard-sidebar')).toBeHidden();
        await expect(page.locator('.dashboard-content')).toBeVisible();
        await checkViewportFit();
      } else {
        await expect(page.locator('.dashboard-sidebar')).toBeVisible();
      }

      if (group.role === 'USER') {
        await page.goto('/dashboard');
        const completeButton = page.getByRole('button', { name: 'Mark Workout Complete' });
        await expect(completeButton).toBeVisible();
        await completeButton.hover();
        const buttonState = await completeButton.evaluate((element) => ({
          background: getComputedStyle(element).backgroundColor,
          color: getComputedStyle(element).color,
          iconColor: getComputedStyle(element.querySelector('svg')!).color,
        }));
        expect(buttonState.background).not.toBe('rgb(0, 0, 0)');
        expect(buttonState.color).toBe('rgb(23, 25, 28)');
        expect(buttonState.iconColor).toBe('rgb(23, 25, 28)');
        await checkViewportFit();
      }
    }
  }
});