import { test, expect } from '@playwright/test';

test('a member can cancel a booking using the server PUT endpoint', async ({ page }) => {
  let cancelled = false;
  await page.addInitScript(() => localStorage.setItem('ironcore_token', 'test-token'));
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/me')) {
      await route.fulfill({ json: {
        user: { id: 'member', name: 'Test Member', role: 'USER', status: 'ACTIVE' },
        profile: { currentWeight: 80, targetWeight: 75, height: 180 },
      } });
    } else if (path.endsWith('/user/bookings/booking/cancel')) {
      if (route.request().method() !== 'PUT') {
        await route.fulfill({ status: 404, json: { error: 'Route not found' } });
        return;
      }
      cancelled = true;
      await route.fulfill({ json: { message: 'Booking has been cancelled.' } });
    } else if (path.endsWith('/user/bookings')) {
      await route.fulfill({ json: { trainers: [], bookings: [{
        id: 'booking', trainerName: 'Test Trainer', sessionType: 'Coaching',
        date: '2026-09-24', timeSlot: '10:00 AM - 11:00 AM',
        status: cancelled ? 'CANCELLED' : 'CONFIRMED',
      }] } });
    } else {
      await route.fulfill({ json: { notifications: [] } });
    }
  });
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/dashboard/bookings');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByText('No upcoming sessions booked')).toBeVisible();
  expect(cancelled).toBe(true);
});
