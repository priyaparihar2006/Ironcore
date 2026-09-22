import { test, expect } from '@playwright/test';

test('credential forms reject invalid input before sending a request', async ({ page }) => {
  const writes: string[] = [];
  await page.route('**/api/**', async (route) => {
    if (route.request().method() === 'POST') writes.push(route.request().url());
    await route.fulfill({ status: 401, json: { error: 'Invalid email or password.' } });
  });
  await page.goto('/login');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText('Email is required.', { exact: true })).toBeVisible();
  await page.getByLabel('Email address', { exact: true }).fill('a..b@example.com');
  await page.getByLabel('Password', { exact: true }).fill('legacy');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByLabel('Email address', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  expect(writes).toHaveLength(0);
  await page.getByLabel('Email address', { exact: true }).fill('member@example.com');
  await page.locator('button[type="submit"]').click();
  await expect.poll(() => writes.length).toBe(1);
  await page.goto('/signup');
  await page.getByLabel('Full name', { exact: true }).fill('A');
  await page.getByLabel('Phone number', { exact: true }).fill('1234567890');
  await page.getByLabel('Password', { exact: true }).fill('weak');
  await page.getByLabel('Confirm password', { exact: true }).fill('different');
  await page.locator('button[type="submit"]').click();
  for (const message of [
    'Please enter a valid name.',
    'Please enter a valid 10-digit mobile number.',
    'Password must be at least 8 characters.',
    'Passwords do not match.',
  ]) {
    await expect(page.getByText(message, { exact: true })).toBeVisible();
  }
  await page.goto('/forgot-password');
  await page.getByLabel('Email address', { exact: true }).fill('broken@domain');
  await page.locator('button[type="submit"]').click();
  await expect(
    page.getByText('Please enter a valid email address.', { exact: true }),
  ).toBeVisible();
  await page.goto('/reset-password?token=' + 'a'.repeat(64));
  await page.getByLabel('New password', { exact: true }).fill('Short1!');
  await page.getByLabel('Confirm password', { exact: true }).fill('other');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText('Passwords do not match.', { exact: true })).toBeVisible();
  expect(writes).toHaveLength(1);
});

test('progress rejects invalid weights and submits valid decimal once', async ({ page }) => {
  const writes: any[] = [];
  await page.addInitScript(() => localStorage.setItem('ironcore_token', 'test-token'));
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let result: any = {};
    if (path.endsWith('/auth/me'))
      result = {
        user: {
          id: 'u',
          name: 'Test Athlete',
          role: 'USER',
          status: 'ACTIVE',
          email: 'member@example.com',
        },
        profile: { currentWeight: 80, targetWeight: 75, height: 180 },
      };
    if (path.endsWith('/notifications')) result = { notifications: [] };
    if (path.endsWith('/progress')) {
      result = { records: [] };
      if (route.request().method() === 'POST') writes.push(route.request().postDataJSON());
    }
    await route.fulfill({ json: result });
  });
  await page.goto('/dashboard/progress');
  await page.getByRole('button', { name: 'Log Progress Entry' }).click();
  const input = page.getByLabel('Weight (kg)', { exact: true });
  for (const [value, error] of [
    ['', 'Weight is required.'],
    ['19', 'Weight must be at least 20 kg.'],
    ['301', 'Weight must not exceed 300 kg.'],
    ['65.55', 'Please enter a valid weight.'],
    ['1e2', 'Please enter a valid weight.'],
  ]) {
    await input.fill(value);
    await page.getByRole('button', { name: 'Save Progress Entry' }).click();
    await expect(page.getByText(error, { exact: true })).toBeVisible();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
  }
  expect(writes).toHaveLength(0);
  await input.fill('65.5');
  await page.getByRole('button', { name: 'Save Progress Entry' }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].weightKg).toBe('65.5');
});

test('profile and admin provisioning show field errors without writes', async ({ page }) => {
  let role = 'USER';
  const writes: string[] = [];
  await page.addInitScript(() => localStorage.setItem('ironcore_token', 'test-token'));
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (['PUT', 'POST'].includes(route.request().method())) writes.push(path);
    let result: any = {};
    if (path.endsWith('/auth/me')) result = { user: { id: 'u', name: 'Test Athlete', role, status: 'ACTIVE', email: 'member@example.com', gender: 'Prefer not to say', fitnessGoal: 'General Fitness' }, profile: { currentWeight: 80, targetWeight: 75, height: 180 } };
    if (path.endsWith('/notifications')) result = { notifications: [] };
    if (path.endsWith('/admin/users')) result = { users: [] };
    await route.fulfill({ json: result });
  });
  await page.goto('/dashboard/profile');
  await page.getByLabel('Current weight (kg)', { exact: true }).fill('65.55');
  await page.getByRole('button', { name: 'Save Profile Changes' }).click();
  await expect(page.getByText('Please enter a valid weight.', { exact: true })).toBeVisible();
  await page.getByLabel('Current password', { exact: true }).fill('legacy');
  await page.getByLabel('New password', { exact: true }).fill('weak');
  await page.getByLabel('Confirm new password', { exact: true }).fill('other');
  await page.getByRole('button', { name: 'Update Password', exact: true }).click();
  await expect(page.getByText('Passwords do not match.', { exact: true })).toBeVisible();
  role = 'ADMIN';
  await page.goto('/admin/users');
  await page.getByRole('button', { name: 'Provision New User' }).click();
  await page.getByRole('button', { name: 'Create User Account' }).click();
  await expect(page.getByText('Name is required.', { exact: true })).toBeVisible();
  await expect(page.getByText('Email is required.', { exact: true })).toBeVisible();
  await expect(page.getByText('Password is required.', { exact: true })).toBeVisible();
  expect(writes).toHaveLength(0);
});
