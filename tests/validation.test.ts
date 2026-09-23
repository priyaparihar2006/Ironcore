import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import express from 'express';
import type { Server } from 'node:http';
import type { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import {
  emailError,
  nameError,
  phoneError,
  normalizePhone,
  passwordError,
  confirmPasswordError,
  weightError,
  numberError,
  dateOfBirthError,
} from '../src/lib/validation.js';
import { hashPassword, verifyPassword } from '../server/passwords.js';
import { setPoolForTests, ensureSchema, persistAll, getPool } from '../server/postgres.js';
import { getDatabase, saveDatabase } from '../server/db.js';
import { verifyWeightNotation } from '../server/inputValidation.js';
import { publicErrorHandler } from '../server/httpErrors.js';
import type { DatabaseSchema } from '../server/types.js';

Object.assign(process.env, {
  NODE_ENV: 'test',
  SEED_DEMO_DATA: 'false',
  JWT_SECRET: randomBytes(32).toString('hex'),
  LOGIN_RATE_LIMIT_MAX: '500',
  REGISTER_RATE_LIMIT_MAX: '500',
  FORGOT_PASSWORD_RATE_LIMIT_MAX: '500',
});
const strong = () => 'Aa1!' + randomBytes(12).toString('hex');
const legacyPassword = 'legacy-' + randomBytes(12).toString('hex');
let db: PGlite, server: Server, base: string, memberToken: string, adminToken: string;
before(async () => {
  db = new PGlite();
  await db.waitReady;
  let tail = Promise.resolve();
  const query = async (sql: string, params?: unknown[]) =>
    sql.includes('CREATE TABLE') || sql.includes('DO $$')
      ? (await db.exec(sql)).at(-1)!
      : db.query(sql, params);
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
  } as unknown as Pool);
  await ensureSchema();
  const passwordHash = await bcrypt.hash(legacyPassword, 10);
  const fixture: DatabaseSchema = {
    users: [
      {
        id: 'member',
        name: 'Existing Member',
        email: 'existing@example.com',
        passwordHash,
        role: 'USER',
        status: 'ACTIVE',
        joinedDate: '2026-01-01',
      },
      {
        id: 'admin',
        name: 'Test Admin',
        email: 'admin@example.com',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        joinedDate: '2026-01-01',
      },
    ],
    profiles: [{ userId: 'member', height: 180, currentWeight: 80, targetWeight: 80 }],
    trainers: [],
    workoutPlans: [],
    workoutAssignments: [],
    progressRecords: [],
    nutritionLogs: [],
    membershipPlans: [
      {
        id: 'plan_basic',
        name: 'Basic',
        monthlyPrice: 0,
        annualPrice: 0,
        description: 'Test',
        badge: '',
        isPopular: false,
        features: [],
        status: 'ACTIVE',
      },
    ],
    userMemberships: [],
    bookings: [],
    payments: [],
    notifications: [],
    trainerNotes: [],
    passwordResetTokens: [],
  };
  await persistAll(fixture);
  const { apiRouter } = await import('../server/api.js');
  const { generateToken } = await import('../server/auth.js');
  memberToken = generateToken(fixture.users[0]);
  adminToken = generateToken(fixture.users[1]);
  const app = express();
  app.use(express.json({ verify: verifyWeightNotation }));
  app.use('/api', apiRouter);
  app.use(publicErrorHandler);
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  base = `http://127.0.0.1:${(server.address() as any).port}/api`;
});
after(async () => {
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  await db?.close();
});
async function request(
  path: string,
  body?: unknown,
  method = 'POST',
  token?: string,
  raw?: string,
) {
  const response = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(method !== 'GET' ? { body: raw ?? JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: (await response.json()) as any };
}
const registration = () => {
  const password = strong();
  return {
    name: 'Priya O’Neill',
    email: `member-${randomBytes(6).toString('hex')}@example.com`,
    password,
    confirmPassword: password,
    agreeTerms: true,
  };
};

test('workout assignment enforces trainer ownership and preserves admin access', async () => {
  const snapshot = await getDatabase();
  const trainer = {
    ...snapshot.users.find((user) => user.id === 'member')!,
    id: 'assignment-trainer',
    email: 'assignment-trainer@example.com',
    role: 'TRAINER' as const,
  };
  snapshot.users.push(trainer);
  snapshot.workoutPlans.push({
    id: 'assignment-plan', title: 'Test Workout', category: 'Strength',
    level: 'Beginner', durationMinutes: 30, caloriesBurn: 100,
    description: 'Test', exercises: [],
  });
  await saveDatabase(snapshot);
  const { generateToken } = await import('../server/auth.js');
  const trainerToken = generateToken(trainer);
  const body = { clientId: 'member', workoutPlanId: 'assignment-plan', scheduledDate: '2026-09-23' };
  const before = await getDatabase();
  assert.equal((await request('/trainer/assign-workout', body, 'POST', trainerToken)).status, 403);
  assert.equal((await request('/trainer/assign-workout', body, 'POST', memberToken)).status, 403);
  const afterDenied = await getDatabase();
  assert.deepEqual(afterDenied.workoutAssignments, before.workoutAssignments);
  assert.deepEqual(afterDenied.notifications, before.notifications);
  assert.equal((await request('/trainer/assign-workout', body, 'POST', adminToken)).status, 201);
  const assigned = await getDatabase();
  assigned.users.find((user) => user.id === 'member')!.assignedTrainerId = trainer.id;
  await saveDatabase(assigned);
  assert.equal((await request('/trainer/assign-workout', body, 'POST', trainerToken)).status, 201);
  const saved = await getDatabase();
  assert.equal(saved.workoutAssignments.length, before.workoutAssignments.length + 2);
});

test('weight validation covers requested boundaries, decimals and malformed types', () => {
  for (const value of [20, 65.5, 300, '20', '65.5', '300', ' 65.5 '])
    assert.equal(weightError(value), undefined, String(value));
  for (const value of [19, -50]) assert.equal(weightError(value), 'Weight must be at least 20 kg.');
  for (const value of [301, 4563789209])
    assert.equal(weightError(value), 'Weight must not exceed 300 kg.');
  for (const value of [65.55, '1e10', '1e2', NaN, Infinity, false, [], {}, '65kg', '0x40'])
    assert.equal(weightError(value), 'Please enter a valid weight.');
  for (const value of ['', ' ', undefined, null])
    assert.equal(weightError(value), 'Weight is required.');
});
test('email validation allows practical addresses and rejects malformed domain/local parts', () => {
  for (const value of [
    'user@gmail.com',
    'priya@example.com',
    'user.name@company.co.in',
    ' User+gym@Example.com ',
    "o'neill@example.com",
  ])
    assert.equal(emailError(value), undefined, value);
  for (const value of [
    'test',
    'test@',
    '@gmail.com',
    'test@gmail',
    'test @gmail.com',
    'test..email@gmail.com',
    '.test@example.com',
    'test@-example.com',
    'test@example..com',
    'test@example.com/path',
    false,
    {},
    ['user@gmail.com'],
  ])
    assert.equal(emailError(value), 'Please enter a valid email address.');
  assert.equal(emailError(''), 'Email is required.');
});
test('phone validation keeps optional and international fields while enforcing Indian prefixes', () => {
  for (const value of [
    '9876543210',
    '8765432109',
    '+91 98765 43210',
    '+1 (415) 555-2671',
    '+44 20 7946 0958',
  ])
    assert.equal(phoneError(value), undefined, value);
  for (const value of [
    '12345',
    '987654321',
    '98765432101',
    'abcdefghij',
    '1234567890',
    '98765@43210',
    '+91 12345 67890',
    '+999123456789',
    '(9876543210',
    '9'.repeat(100),
    true,
    {},
  ])
    assert.ok(phoneError(value), String(value));
  assert.equal(phoneError('', true), 'Phone number is required.');
  assert.equal(phoneError(''), undefined);
  assert.equal(normalizePhone('9876543210'), '+919876543210');
});
test('creation passwords, confirmation, names and supplemental fields have bounded validation', () => {
  assert.equal(passwordError('Priya@123'), undefined);
  assert.equal(passwordError('Aa1!' + 'x'.repeat(124)), undefined);
  assert.equal(passwordError('Aa1!' + 'x'.repeat(125)), 'Password must not exceed 128 characters.');
  assert.equal(passwordError('Aa1!'), 'Password must be at least 8 characters.');
  for (const value of ['password1!', 'PASSWORD1!', 'Password!', 'Password1'])
    assert.equal(
      passwordError(value),
      'Password must contain uppercase, lowercase, a number, and a special character.',
    );
  assert.equal(passwordError(''), 'Password is required.');
  assert.ok(passwordError(' Priya@123'));
  assert.equal(passwordError(legacyPassword, false), undefined);
  assert.equal(passwordError(' pass ', false), undefined);
  assert.equal(confirmPasswordError('test', 'test'), undefined);
  assert.equal(confirmPasswordError('test', ''), 'Passwords do not match.');
  assert.ok(confirmPasswordError('test', 'Test'));
  for (const name of ['Priya Sharma', 'Anne-Marie', "O'Neill", '李明', 'José García'])
    assert.equal(nameError(name), undefined);
  for (const name of ['', ' ', 'A', '<script>', 'X'.repeat(101), 1]) assert.ok(nameError(name));
  assert.ok(numberError('1e3', 'Steps', 0, 200000));
  assert.ok(numberError('10.5', 'Steps', 0, 200000));
  assert.ok(dateOfBirthError('2026-02-30'));
  assert.ok(dateOfBirthError('2999-01-01'));
});
test('new password hashes use the entire 128-character input and legacy bcrypt still verifies', async () => {
  const password = 'Aa1!' + 'x'.repeat(124),
    hash = await hashPassword(password);
  assert.match(hash, /^scrypt-v1\$/);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword(password.slice(0, -1) + 'y', hash), false);
  assert.equal(await verifyPassword(legacyPassword, await bcrypt.hash(legacyPassword, 10)), true);
  assert.equal(await verifyPassword('wrong', 'invalid-hash'), false);
});
test('backend rejects invalid progress without modifying existing records, including raw JSON exponent notation', async () => {
  const before = (await getDatabase()).progressRecords.length;
  for (const value of [19, 301, -50, 4563789209, 65.55, '', '1e10', '1e2', null, {}, false]) {
    const result = await request('/user/progress', { weightKg: value }, 'POST', memberToken);
    assert.equal(result.status, 400);
    assert.ok(result.body.fields.weightKg);
  }
  for (const raw of ['{"weightKg":1e2}', '{"weightKg":65.50}', '{"weight\\u004bg":1e2}'])
    assert.equal(
      (await request('/user/progress', undefined, 'POST', memberToken, raw)).status,
      400,
    );
  assert.equal((await getDatabase()).progressRecords.length, before);
  for (const value of [20, 65.5, 300])
    assert.equal(
      (await request('/user/progress', { weightKg: value }, 'POST', memberToken)).status,
      201,
    );
  assert.equal((await getDatabase()).progressRecords.length, before + 3);
  assert.equal(
    (await request('/user/progress', { weightKg: 65.5, steps: '1e3' }, 'POST', memberToken)).status,
    400,
  );
});
test('malformed credential bodies are rejected without echoing sensitive input', async () => {
  const secret = strong();
  for (const body of [
    null,
    [],
    { email: {}, password: secret },
    { email: 'x@example.com', password: {} },
  ]) {
    const r = await request('/auth/login', body);
    assert.equal(r.status, 400);
    assert.ok(!JSON.stringify(r.body).includes(secret));
  }
  const r = await request('/auth/login', undefined, 'POST', undefined, '{"password":"sensitive",');
  assert.equal(r.status, 400);
  assert.deepEqual(r.body, { error: 'Please provide valid JSON.' });
});
test('Express route variants cannot bypass validation', async () => {
  for (const path of ['/AUTH/REGISTER/', '/auth/register/', '/ADMIN/USERS/']) {
    const result = await request(path, { email: {}, password: [] }, 'POST', adminToken);
    assert.equal(result.status, 400);
    assert.ok(result.body.fields);
  }
});
test('legacy login works; unknown email, wrong password and inactive user return the same safe error', async () => {
  const valid = await request('/auth/login', {
    email: ' EXISTING@EXAMPLE.COM ',
    password: legacyPassword,
  });
  assert.equal(valid.status, 200);
  assert.ok(valid.body.token);
  assert.equal(valid.body.user.passwordHash, undefined);
  const wrong = await request('/auth/login', { email: 'existing@example.com', password: strong() });
  const unknown = await request('/auth/login', {
    email: 'missing@example.com',
    password: strong(),
  });
  assert.equal(wrong.status, 401);
  assert.deepEqual(wrong.body, unknown.body);
  await getPool().query("UPDATE users SET status='INACTIVE' WHERE id='member'");
  const inactive = await request('/auth/login', {
    email: 'existing@example.com',
    password: legacyPassword,
  });
  assert.equal(inactive.status, 401);
  assert.deepEqual(inactive.body, wrong.body);
  await getPool().query("UPDATE users SET status='ACTIVE' WHERE id='member'");
});
test('registration validates all fields, stores normalized credentials and blocks duplicate email', async () => {
  const baseBody = registration();
  for (const override of [
    { name: ' ' },
    { email: 'test..name@example.com' },
    { phone: '1234567890' },
    { password: 'password' },
    { confirmPassword: '' },
    { dateOfBirth: '2999-01-01' },
    { agreeTerms: false },
    { gender: {} },
    { fitnessGoal: [] },
  ])
    assert.equal((await request('/auth/register', { ...baseBody, ...override })).status, 400);
  const body = {
    ...baseBody,
    email: ' ' + baseBody.email.toUpperCase() + ' ',
    phone: '9876543210',
  };
  const created = await request('/auth/register', body);
  assert.equal(created.status, 201);
  assert.equal(created.body.user.email, baseBody.email);
  assert.equal(created.body.user.phone, '+919876543210');
  assert.equal(created.body.user.passwordHash, undefined);
  assert.equal(
    (await request('/auth/login', { email: baseBody.email, password: baseBody.password })).status,
    200,
  );
  assert.equal((await request('/auth/register', baseBody)).status, 409);
  const stored = (await getDatabase()).users.find((u) => u.email === baseBody.email)!;
  assert.match(stored.passwordHash, /^scrypt-v1\$/);
  assert.ok(!JSON.stringify(created.body).includes(baseBody.password));
});
test('admin-created accounts and updates cannot bypass validation', async () => {
  for (const path of ['/admin/users', '/admin/trainers']) {
    assert.equal(
      (
        await request(
          path,
          { ...registration(), password: 'weak', phone: 'letters' },
          'POST',
          adminToken,
        )
      ).status,
      400,
    );
    assert.equal(
      (await request(path, { ...registration(), role: 'OWNER' }, 'POST', adminToken)).status,
      400,
    );
  }
  assert.equal(
    (
      await request(
        '/admin/users/member',
        { name: '', phone: 'abc', status: 'WRONG' },
        'PUT',
        adminToken,
      )
    ).status,
    400,
  );
  assert.equal(
    (await request('/auth/profile', { currentWeight: '1e2' }, 'PUT', memberToken)).status,
    400,
  );
  assert.equal(
    (
      await request(
        '/auth/profile',
        { currentWeight: '65.5', phone: '+1 (415) 555-2671' },
        'PUT',
        memberToken,
      )
    ).status,
    200,
  );
});
test('forgot-password responses do not disclose accounts or reset tokens', async () => {
  assert.equal((await request('/auth/forgot-password', { email: 'bad' })).status, 400);
  const known = await request('/auth/forgot-password', { email: 'existing@example.com' });
  const unknown = await request('/auth/forgot-password', { email: 'unknown@example.com' });
  assert.equal(known.status, 200);
  assert.deepEqual(known.body, unknown.body);
  assert.deepEqual(Object.keys(known.body), ['message']);
});
test('reset and change-password require confirmation and enforce new complexity', async () => {
  const token = (await getDatabase()).passwordResetTokens.find(
    (t) => t.email === 'existing@example.com',
  )!.token;
  const password = strong();
  assert.equal(
    (await request('/auth/reset-password', { token, newPassword: password })).status,
    400,
  );
  assert.equal(
    (await request('/auth/reset-password', { token, newPassword: 'weak', confirmPassword: 'weak' }))
      .status,
    400,
  );
  assert.equal(
    (
      await request('/auth/reset-password', {
        token,
        newPassword: password,
        confirmPassword: password,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request('/auth/reset-password', {
        token,
        newPassword: password,
        confirmPassword: password,
      })
    ).status,
    400,
  );
  assert.equal(
    (await request('/auth/login', { email: 'existing@example.com', password })).status,
    200,
  );
  const nextPassword = strong();
  assert.equal(
    (
      await request(
        '/auth/change-password',
        { currentPassword: password, newPassword: nextPassword },
        'PUT',
        memberToken,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        '/auth/change-password',
        { currentPassword: password, newPassword: nextPassword, confirmPassword: nextPassword },
        'PUT',
        memberToken,
      )
    ).status,
    200,
  );
  assert.equal(
    (await request('/auth/login', { email: 'existing@example.com', password: nextPassword }))
      .status,
    200,
  );
});
test('database constraints block direct invalid weights and duplicate normalized email; migration retains legacy rows', async () => {
  for (const value of [301, 65.55, -50])
    await assert.rejects(
      getPool().query(
        'INSERT INTO progress_records(id,"userId",date,"weightKg") VALUES($1,$2,$3,$4)',
        [randomBytes(6).toString('hex'), 'member', '2026-01-01', value],
      ),
      (e: any) => e.code === '23514',
    );
  await assert.rejects(
    getPool().query("UPDATE users SET email=' EXISTING@EXAMPLE.COM ' WHERE id='admin'"),
    (e: any) => e.code === '23505',
  );
  await getPool().query('ALTER TABLE progress_records DROP CONSTRAINT progress_weight_valid');
  await getPool().query(
    'INSERT INTO progress_records(id,"userId",date,"weightKg") VALUES($1,$2,$3,$4)',
    ['legacy', 'member', '2025-01-01', 350],
  );
  await ensureSchema();
  await ensureSchema();
  assert.equal(
    (await getPool().query('SELECT "weightKg" FROM progress_records WHERE id=\'legacy\'')).rows[0]
      .weightKg,
    350,
  );
  assert.ok((await getDatabase()).users.some((u) => u.id === 'member'));
});
