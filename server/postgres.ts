import { Pool, type PoolClient } from 'pg';
import type {
  DatabaseSchema,
  User,
  UserProfile,
  TrainerInfo,
  WorkoutPlan,
  WorkoutAssignment,
  ProgressRecord,
  NutritionLog,
  MembershipPlan,
  UserMembership,
  Booking,
  PaymentRecord,
  NotificationItem,
  ClientProgressNote,
  PasswordResetToken,
} from './types.js';

// ---------------------------------------------------------------------------
// Connection
//
// Uses DATABASE_URL (the Supabase "Session pooler" connection string) — a
// long-running Node/Express server keeps a small persistent pool rather than
// opening a connection per request. The password must never be hardcoded;
// it only ever comes from the environment (see .env.example).
// Supabase requires TLS; `rejectUnauthorized: false` is used because
// Supabase's pooler certificate chain is not present in Node's default CA
// store — this still encrypts the connection, it just skips validating the
// certificate against a known root.
// ---------------------------------------------------------------------------
let pool: Pool | null = null;

function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is required to connect to PostgreSQL. ' +
        'Set it in your .env file — Supabase Dashboard → Project Settings → Database → ' +
        'Connection string → Session pooler (copy the URI and fill in your real password).'
    );
  }
  return url;
}

export function getPool(): Pool {
  if (pool) return pool;
  pool = new Pool({
    connectionString: resolveDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  return pool;
}

/** For clean process shutdown / one-off scripts (e.g. the migration script). */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// ---------------------------------------------------------------------------
// Schema — a direct translation of server/sqlite.ts's 14-table schema.
// Every mixed-case column is double-quoted so Postgres preserves the exact
// camelCase name (Postgres lower-cases unquoted identifiers), keeping row
// shapes identical to the existing DatabaseSchema types. Booleans and JSON
// columns become native BOOLEAN/JSONB (SQLite used INTEGER 0/1 and TEXT).
// expiresAt is BIGINT (SQLite's INTEGER already holds ms timestamps that
// exceed Postgres's 4-byte INTEGER range). All foreign keys are DEFERRABLE
// INITIALLY DEFERRED so persistAll() can delete+reinsert every table inside
// one transaction without worrying about statement-order FK violations
// (checked once at COMMIT instead of per-statement) — the Postgres-native
// replacement for SQLite's `PRAGMA foreign_keys = OFF` bulk-resync trick.
// ---------------------------------------------------------------------------
export const TABLES_PARENT_FIRST = [
  'users',
  'membership_plans',
  'profiles',
  'trainers',
  'workout_plans',
  'workout_assignments',
  'progress_records',
  'nutrition_logs',
  'user_memberships',
  'bookings',
  'payments',
  'notifications',
  'trainer_notes',
  'password_reset_tokens',
] as const;

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('USER','TRAINER','ADMIN')),
    phone TEXT,
    "dateOfBirth" TEXT,
    gender TEXT,
    "fitnessGoal" TEXT,
    status TEXT NOT NULL CHECK(status IN ('ACTIVE','INACTIVE')),
    "joinedDate" TEXT NOT NULL,
    avatar TEXT,
    "assignedTrainerId" TEXT REFERENCES users(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED
  );
  CREATE INDEX IF NOT EXISTS idx_users_assignedTrainerId ON users("assignedTrainerId");

  CREATE TABLE IF NOT EXISTS profiles (
    "userId" TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    "currentWeight" REAL NOT NULL,
    "targetWeight" REAL NOT NULL,
    height REAL NOT NULL,
    "bodyFatPercentage" REAL NOT NULL,
    "muscleMass" REAL NOT NULL,
    "emergencyContact" TEXT,
    bio TEXT
  );

  CREATE TABLE IF NOT EXISTS trainers (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    specialty TEXT,
    experience TEXT,
    rating REAL NOT NULL DEFAULT 0,
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    bio TEXT,
    certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
    "clientCount" INTEGER NOT NULL DEFAULT 0,
    "availableSlots" JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL CHECK(status IN ('ACTIVE','INACTIVE'))
  );

  CREATE TABLE IF NOT EXISTS workout_plans (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    level TEXT,
    "durationMinutes" INTEGER,
    "caloriesBurn" INTEGER,
    description TEXT,
    "createdByTrainerId" TEXT REFERENCES users(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb
  );
  CREATE INDEX IF NOT EXISTS idx_workout_plans_createdBy ON workout_plans("createdByTrainerId");

  CREATE TABLE IF NOT EXISTS workout_assignments (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    "workoutPlanId" TEXT REFERENCES workout_plans(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED,
    "workoutTitle" TEXT NOT NULL,
    "assignedByTrainerName" TEXT,
    "assignedDate" TEXT NOT NULL,
    "scheduledDate" TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('PENDING','IN_PROGRESS','COMPLETED')),
    "completedAt" TEXT,
    notes TEXT,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb
  );
  CREATE INDEX IF NOT EXISTS idx_workout_assignments_userId ON workout_assignments("userId");

  CREATE TABLE IF NOT EXISTS progress_records (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    date TEXT NOT NULL,
    "weightKg" REAL NOT NULL,
    "caloriesBurned" INTEGER NOT NULL DEFAULT 0,
    steps INTEGER NOT NULL DEFAULT 0,
    "workoutCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "strengthScore" INTEGER NOT NULL DEFAULT 0,
    notes TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_progress_records_userId ON progress_records("userId");

  CREATE TABLE IF NOT EXISTS nutrition_logs (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    date TEXT NOT NULL,
    "dailyCalorieTarget" INTEGER NOT NULL DEFAULT 0,
    "consumedCalories" INTEGER NOT NULL DEFAULT 0,
    "proteinTargetGrams" INTEGER NOT NULL DEFAULT 0,
    "consumedProteinGrams" INTEGER NOT NULL DEFAULT 0,
    "carbsTargetGrams" INTEGER NOT NULL DEFAULT 0,
    "consumedCarbsGrams" INTEGER NOT NULL DEFAULT 0,
    "fatsTargetGrams" INTEGER NOT NULL DEFAULT 0,
    "consumedFatsGrams" INTEGER NOT NULL DEFAULT 0,
    meals JSONB NOT NULL DEFAULT '[]'::jsonb
  );
  CREATE INDEX IF NOT EXISTS idx_nutrition_logs_userId_date ON nutrition_logs("userId", date);

  CREATE TABLE IF NOT EXISTS membership_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "monthlyPrice" REAL NOT NULL,
    "annualPrice" REAL NOT NULL,
    description TEXT,
    badge TEXT,
    "isPopular" BOOLEAN NOT NULL DEFAULT FALSE,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL CHECK(status IN ('ACTIVE','INACTIVE'))
  );

  CREATE TABLE IF NOT EXISTS user_memberships (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    "planId" TEXT REFERENCES membership_plans(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED,
    "planName" TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('ACTIVE','EXPIRED','PENDING','CANCELLED')),
    "startDate" TEXT NOT NULL,
    "expiryDate" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL CHECK("billingCycle" IN ('monthly','annual')),
    "pricePaid" REAL NOT NULL DEFAULT 0,
    "autoRenew" BOOLEAN NOT NULL DEFAULT FALSE
  );
  CREATE INDEX IF NOT EXISTS idx_user_memberships_userId ON user_memberships("userId");

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    "userName" TEXT NOT NULL,
    "trainerId" TEXT REFERENCES users(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED,
    "trainerName" TEXT,
    date TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('CONFIRMED','COMPLETED','CANCELLED','RESCHEDULED')),
    location TEXT,
    notes TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_bookings_userId ON bookings("userId");
  CREATE INDEX IF NOT EXISTS idx_bookings_trainerId ON bookings("trainerId");

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    "userName" TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK(status IN ('PAID','REFUNDED','FAILED')),
    date TEXT NOT NULL,
    description TEXT,
    "invoiceNumber" TEXT,
    "planName" TEXT,
    method TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_payments_userId ON payments("userId");

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    title TEXT NOT NULL,
    message TEXT,
    date TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    type TEXT CHECK(type IN ('info','success','warning'))
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications("userId");

  CREATE TABLE IF NOT EXISTS trainer_notes (
    id TEXT PRIMARY KEY,
    "trainerId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    date TEXT NOT NULL,
    note TEXT NOT NULL,
    flag TEXT CHECK(flag IN ('ON_TRACK','ATTENTION_NEEDED','MILESTONE_REACHED'))
  );
  CREATE INDEX IF NOT EXISTS idx_trainer_notes_userId ON trainer_notes("userId");

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    "expiresAt" BIGINT NOT NULL
  );
`;

export async function ensureSchema(): Promise<void> {
  await getPool().query(SCHEMA_SQL);
}

// ---------------------------------------------------------------------------
// Row helpers — pg already returns BOOLEAN columns as real booleans and
// JSONB columns as parsed JS values, so (unlike sqlite.ts) no toBool()/
// toJson() conversion is needed here. Only NULL -> undefined normalization
// is required to match the existing DatabaseSchema row shapes.
// ---------------------------------------------------------------------------
function nullsToUndefined<T extends Record<string, unknown>>(row: T): T {
  for (const key of Object.keys(row)) {
    if (row[key] === null) (row as Record<string, unknown>)[key] = undefined;
  }
  return row;
}

// ---------------------------------------------------------------------------
// Hydrate: PostgreSQL -> in-memory DatabaseSchema.
// ---------------------------------------------------------------------------
export async function hydrateAll(): Promise<DatabaseSchema> {
  const db = getPool();

  const users = (await db.query('SELECT * FROM users')).rows.map(
    (r) => nullsToUndefined(r) as unknown as User
  );
  const profiles = (await db.query('SELECT * FROM profiles')).rows.map(
    (r) => nullsToUndefined(r) as unknown as UserProfile
  );
  const trainers = (await db.query('SELECT * FROM trainers')).rows.map(
    (r) => nullsToUndefined(r) as unknown as TrainerInfo
  );
  const workoutPlans = (await db.query('SELECT * FROM workout_plans')).rows.map(
    (r) => nullsToUndefined(r) as unknown as WorkoutPlan
  );
  const workoutAssignments = (await db.query('SELECT * FROM workout_assignments')).rows.map(
    (r) => nullsToUndefined(r) as unknown as WorkoutAssignment
  );
  const progressRecords = (await db.query('SELECT * FROM progress_records')).rows.map(
    (r) => nullsToUndefined(r) as unknown as ProgressRecord
  );
  const nutritionLogs = (await db.query('SELECT * FROM nutrition_logs')).rows.map(
    (r) => nullsToUndefined(r) as unknown as NutritionLog
  );
  const membershipPlans = (await db.query('SELECT * FROM membership_plans')).rows.map(
    (r) => nullsToUndefined(r) as unknown as MembershipPlan
  );
  const userMemberships = (await db.query('SELECT * FROM user_memberships')).rows.map(
    (r) => nullsToUndefined(r) as unknown as UserMembership
  );
  const bookings = (await db.query('SELECT * FROM bookings')).rows.map(
    (r) => nullsToUndefined(r) as unknown as Booking
  );
  const payments = (await db.query('SELECT * FROM payments')).rows.map(
    (r) => nullsToUndefined(r) as unknown as PaymentRecord
  );
  const notifications = (await db.query('SELECT * FROM notifications')).rows.map(
    (r) => nullsToUndefined(r) as unknown as NotificationItem
  );
  const trainerNotes = (await db.query('SELECT * FROM trainer_notes')).rows.map(
    (r) => nullsToUndefined(r) as unknown as ClientProgressNote
  );
  const passwordResetTokens = (await db.query('SELECT * FROM password_reset_tokens')).rows.map(
    (r) => nullsToUndefined(r) as unknown as PasswordResetToken
  );

  return {
    users,
    profiles,
    trainers,
    workoutPlans,
    workoutAssignments,
    progressRecords,
    nutritionLogs,
    membershipPlans,
    userMemberships,
    bookings,
    payments,
    notifications,
    trainerNotes,
    passwordResetTokens,
  };
}

// ---------------------------------------------------------------------------
// Persist: full in-memory DatabaseSchema -> PostgreSQL.
//
// Same "load whole DB, mutate freely, save whole thing back" model as
// sqlite.ts: every save deletes every row and reinserts the current
// in-memory state, wrapped in one transaction. All foreign keys are declared
// DEFERRABLE INITIALLY DEFERRED (see SCHEMA_SQL), and `SET CONSTRAINTS ALL
// DEFERRED` here defers their checks to COMMIT, so delete/insert order within
// the transaction doesn't matter — Postgres's equivalent of SQLite's
// `PRAGMA foreign_keys = OFF` bulk-resync trick.
// ---------------------------------------------------------------------------
export async function persistAll(data: DatabaseSchema): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('SET CONSTRAINTS ALL DEFERRED');

    for (const table of [...TABLES_PARENT_FIRST].reverse()) {
      await client.query(`DELETE FROM ${table}`);
    }

    await insertUsers(client, data.users);
    await insertMembershipPlans(client, data.membershipPlans);
    await insertProfiles(client, data.profiles);
    await insertTrainers(client, data.trainers);
    await insertWorkoutPlans(client, data.workoutPlans);
    await insertWorkoutAssignments(client, data.workoutAssignments);
    await insertProgressRecords(client, data.progressRecords);
    await insertNutritionLogs(client, data.nutritionLogs);
    await insertUserMemberships(client, data.userMemberships);
    await insertBookings(client, data.bookings);
    await insertPayments(client, data.payments);
    await insertNotifications(client, data.notifications);
    await insertTrainerNotes(client, data.trainerNotes);
    await insertPasswordResetTokens(client, data.passwordResetTokens);

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function insertUsers(client: PoolClient, rows: User[]): Promise<void> {
  for (const u of rows) {
    await client.query(
      `INSERT INTO users (id, name, email, "passwordHash", role, phone, "dateOfBirth", gender, "fitnessGoal", status, "joinedDate", avatar, "assignedTrainerId")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        u.id,
        u.name,
        u.email,
        u.passwordHash,
        u.role,
        u.phone ?? null,
        u.dateOfBirth ?? null,
        u.gender ?? null,
        u.fitnessGoal ?? null,
        u.status,
        u.joinedDate,
        u.avatar ?? null,
        u.assignedTrainerId ?? null,
      ]
    );
  }
}

async function insertMembershipPlans(client: PoolClient, rows: MembershipPlan[]): Promise<void> {
  for (const p of rows) {
    await client.query(
      `INSERT INTO membership_plans (id, name, "monthlyPrice", "annualPrice", description, badge, "isPopular", features, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)`,
      [
        p.id,
        p.name,
        p.monthlyPrice,
        p.annualPrice,
        p.description ?? null,
        p.badge ?? null,
        Boolean(p.isPopular),
        JSON.stringify(p.features ?? []),
        p.status,
      ]
    );
  }
}

async function insertProfiles(client: PoolClient, rows: UserProfile[]): Promise<void> {
  for (const p of rows) {
    await client.query(
      `INSERT INTO profiles ("userId", "currentWeight", "targetWeight", height, "bodyFatPercentage", "muscleMass", "emergencyContact", bio)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        p.userId,
        p.currentWeight,
        p.targetWeight,
        p.height,
        p.bodyFatPercentage,
        p.muscleMass,
        p.emergencyContact ?? null,
        p.bio ?? null,
      ]
    );
  }
}

async function insertTrainers(client: PoolClient, rows: TrainerInfo[]): Promise<void> {
  for (const t of rows) {
    await client.query(
      `INSERT INTO trainers (id, "userId", name, email, phone, specialty, experience, rating, "reviewsCount", bio, certifications, "clientCount", "availableSlots", status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13::jsonb,$14)`,
      [
        t.id,
        t.userId,
        t.name,
        t.email,
        t.phone ?? null,
        t.specialty ?? null,
        t.experience ?? null,
        t.rating,
        t.reviewsCount,
        t.bio ?? null,
        JSON.stringify(t.certifications ?? []),
        t.clientCount,
        JSON.stringify(t.availableSlots ?? []),
        t.status,
      ]
    );
  }
}

async function insertWorkoutPlans(client: PoolClient, rows: WorkoutPlan[]): Promise<void> {
  for (const w of rows) {
    await client.query(
      `INSERT INTO workout_plans (id, title, category, level, "durationMinutes", "caloriesBurn", description, "createdByTrainerId", exercises)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
      [
        w.id,
        w.title,
        w.category ?? null,
        w.level ?? null,
        w.durationMinutes ?? null,
        w.caloriesBurn ?? null,
        w.description ?? null,
        w.createdByTrainerId ?? null,
        JSON.stringify(w.exercises ?? []),
      ]
    );
  }
}

async function insertWorkoutAssignments(client: PoolClient, rows: WorkoutAssignment[]): Promise<void> {
  for (const a of rows) {
    await client.query(
      `INSERT INTO workout_assignments (id, "userId", "workoutPlanId", "workoutTitle", "assignedByTrainerName", "assignedDate", "scheduledDate", status, "completedAt", notes, exercises)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)`,
      [
        a.id,
        a.userId,
        a.workoutPlanId ?? null,
        a.workoutTitle,
        a.assignedByTrainerName ?? null,
        a.assignedDate,
        a.scheduledDate,
        a.status,
        a.completedAt ?? null,
        a.notes ?? null,
        JSON.stringify(a.exercises ?? []),
      ]
    );
  }
}

async function insertProgressRecords(client: PoolClient, rows: ProgressRecord[]): Promise<void> {
  for (const p of rows) {
    await client.query(
      `INSERT INTO progress_records (id, "userId", date, "weightKg", "caloriesBurned", steps, "workoutCompleted", "strengthScore", notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        p.id,
        p.userId,
        p.date,
        p.weightKg,
        p.caloriesBurned,
        p.steps,
        Boolean(p.workoutCompleted),
        p.strengthScore,
        p.notes ?? null,
      ]
    );
  }
}

async function insertNutritionLogs(client: PoolClient, rows: NutritionLog[]): Promise<void> {
  for (const n of rows) {
    await client.query(
      `INSERT INTO nutrition_logs (id, "userId", date, "dailyCalorieTarget", "consumedCalories", "proteinTargetGrams", "consumedProteinGrams", "carbsTargetGrams", "consumedCarbsGrams", "fatsTargetGrams", "consumedFatsGrams", meals)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)`,
      [
        n.id,
        n.userId,
        n.date,
        n.dailyCalorieTarget,
        n.consumedCalories,
        n.proteinTargetGrams,
        n.consumedProteinGrams,
        n.carbsTargetGrams,
        n.consumedCarbsGrams,
        n.fatsTargetGrams,
        n.consumedFatsGrams,
        JSON.stringify(n.meals ?? []),
      ]
    );
  }
}

async function insertUserMemberships(client: PoolClient, rows: UserMembership[]): Promise<void> {
  for (const m of rows) {
    await client.query(
      `INSERT INTO user_memberships (id, "userId", "planId", "planName", status, "startDate", "expiryDate", "billingCycle", "pricePaid", "autoRenew")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        m.id,
        m.userId,
        m.planId ?? null,
        m.planName,
        m.status,
        m.startDate,
        m.expiryDate,
        m.billingCycle,
        m.pricePaid,
        Boolean(m.autoRenew),
      ]
    );
  }
}

async function insertBookings(client: PoolClient, rows: Booking[]): Promise<void> {
  for (const b of rows) {
    await client.query(
      `INSERT INTO bookings (id, "userId", "userName", "trainerId", "trainerName", date, "timeSlot", "sessionType", status, location, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        b.id,
        b.userId,
        b.userName,
        b.trainerId ?? null,
        b.trainerName ?? null,
        b.date,
        b.timeSlot,
        b.sessionType,
        b.status,
        b.location ?? null,
        b.notes ?? null,
      ]
    );
  }
}

async function insertPayments(client: PoolClient, rows: PaymentRecord[]): Promise<void> {
  for (const p of rows) {
    await client.query(
      `INSERT INTO payments (id, "userId", "userName", amount, currency, status, date, description, "invoiceNumber", "planName", method)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        p.id,
        p.userId,
        p.userName,
        p.amount,
        p.currency,
        p.status,
        p.date,
        p.description ?? null,
        p.invoiceNumber ?? null,
        p.planName ?? null,
        p.method ?? null,
      ]
    );
  }
}

async function insertNotifications(client: PoolClient, rows: NotificationItem[]): Promise<void> {
  for (const n of rows) {
    await client.query(
      `INSERT INTO notifications (id, "userId", title, message, date, read, type)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [n.id, n.userId, n.title, n.message ?? null, n.date, Boolean(n.read), n.type ?? null]
    );
  }
}

async function insertTrainerNotes(client: PoolClient, rows: ClientProgressNote[]): Promise<void> {
  for (const n of rows) {
    await client.query(
      `INSERT INTO trainer_notes (id, "trainerId", "userId", date, note, flag)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [n.id, n.trainerId, n.userId, n.date, n.note, n.flag ?? null]
    );
  }
}

async function insertPasswordResetTokens(client: PoolClient, rows: PasswordResetToken[]): Promise<void> {
  for (const t of rows) {
    await client.query(
      `INSERT INTO password_reset_tokens (token, email, "expiresAt") VALUES ($1,$2,$3)`,
      [t.token, t.email, t.expiresAt]
    );
  }
}

// ---------------------------------------------------------------------------
// Migration bookkeeping
// ---------------------------------------------------------------------------
export async function getTableCounts(): Promise<Record<string, number>> {
  const db = getPool();
  const counts: Record<string, number> = {};
  for (const table of TABLES_PARENT_FIRST) {
    const result = await db.query(`SELECT COUNT(*)::int as c FROM ${table}`);
    counts[table] = result.rows[0].c;
  }
  return counts;
}

export async function isDatabaseEmpty(): Promise<boolean> {
  const result = await getPool().query('SELECT COUNT(*)::int as c FROM users');
  return result.rows[0].c === 0;
}

export interface PgSeedResult {
  ranSeed: boolean;
  source: 'seed' | 'existing';
  counts: Record<string, number>;
}

/**
 * Postgres-side counterpart to sqlite.ts's migrateFromJsonIfNeeded — but with
 * no JSON-file-fallback branch, since Postgres data is populated by the
 * dedicated server/migrate-to-postgres.ts script, not an automatic local
 * JSON check. If the database already has users, does nothing. Otherwise,
 * seeds it with the given fallback ONLY when demo seeding is allowed by the
 * caller (see shouldSeedDemoData() in server/db.ts).
 */
export async function seedIfEmpty(seedFallback: () => DatabaseSchema): Promise<PgSeedResult> {
  await ensureSchema();

  if (!(await isDatabaseEmpty())) {
    return { ranSeed: false, source: 'existing', counts: await getTableCounts() };
  }

  await persistAll(seedFallback());
  return { ranSeed: true, source: 'seed', counts: await getTableCounts() };
}
