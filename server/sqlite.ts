import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
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
// Reliable paths — anchored to this file's real location, never process.cwd().
// server/sqlite.ts (dev) and the bundled dist/server.cjs (prod) both sit
// exactly one directory below the project root. See server.ts for why
// __dirname is resolved this way (a real local var in the esbuild CJS bundle,
// vs import.meta.url in real ESM/tsx dev).
// ---------------------------------------------------------------------------
function resolveAppDir(): string {
  if (typeof __dirname !== 'undefined') return __dirname;
  return path.dirname(fileURLToPath(import.meta.url));
}
const PROJECT_ROOT = path.join(resolveAppDir(), '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
export const SQLITE_DB_PATH = path.join(DATA_DIR, 'ironcore.db');
export const JSON_DB_PATH = path.join(DATA_DIR, 'ironcore_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const sqlite = new Database(SQLITE_DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('USER','TRAINER','ADMIN')),
    phone TEXT,
    dateOfBirth TEXT,
    gender TEXT,
    fitnessGoal TEXT,
    status TEXT NOT NULL CHECK(status IN ('ACTIVE','INACTIVE')),
    joinedDate TEXT NOT NULL,
    avatar TEXT,
    assignedTrainerId TEXT REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS idx_users_assignedTrainerId ON users(assignedTrainerId);

  CREATE TABLE IF NOT EXISTS profiles (
    userId TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    currentWeight REAL NOT NULL,
    targetWeight REAL NOT NULL,
    height REAL NOT NULL,
    bodyFatPercentage REAL NOT NULL,
    muscleMass REAL NOT NULL,
    emergencyContact TEXT,
    bio TEXT
  );

  CREATE TABLE IF NOT EXISTS trainers (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    specialty TEXT,
    experience TEXT,
    rating REAL NOT NULL DEFAULT 0,
    reviewsCount INTEGER NOT NULL DEFAULT 0,
    bio TEXT,
    certifications TEXT NOT NULL DEFAULT '[]',
    clientCount INTEGER NOT NULL DEFAULT 0,
    availableSlots TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL CHECK(status IN ('ACTIVE','INACTIVE'))
  );

  CREATE TABLE IF NOT EXISTS workout_plans (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    level TEXT,
    durationMinutes INTEGER,
    caloriesBurn INTEGER,
    description TEXT,
    createdByTrainerId TEXT REFERENCES users(id) ON DELETE SET NULL,
    exercises TEXT NOT NULL DEFAULT '[]'
  );
  CREATE INDEX IF NOT EXISTS idx_workout_plans_createdBy ON workout_plans(createdByTrainerId);

  CREATE TABLE IF NOT EXISTS workout_assignments (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workoutPlanId TEXT REFERENCES workout_plans(id) ON DELETE SET NULL,
    workoutTitle TEXT NOT NULL,
    assignedByTrainerName TEXT,
    assignedDate TEXT NOT NULL,
    scheduledDate TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('PENDING','IN_PROGRESS','COMPLETED')),
    completedAt TEXT,
    notes TEXT,
    exercises TEXT NOT NULL DEFAULT '[]'
  );
  CREATE INDEX IF NOT EXISTS idx_workout_assignments_userId ON workout_assignments(userId);

  CREATE TABLE IF NOT EXISTS progress_records (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    weightKg REAL NOT NULL,
    caloriesBurned INTEGER NOT NULL DEFAULT 0,
    steps INTEGER NOT NULL DEFAULT 0,
    workoutCompleted INTEGER NOT NULL DEFAULT 0,
    strengthScore INTEGER NOT NULL DEFAULT 0,
    notes TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_progress_records_userId ON progress_records(userId);

  CREATE TABLE IF NOT EXISTS nutrition_logs (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    dailyCalorieTarget INTEGER NOT NULL DEFAULT 0,
    consumedCalories INTEGER NOT NULL DEFAULT 0,
    proteinTargetGrams INTEGER NOT NULL DEFAULT 0,
    consumedProteinGrams INTEGER NOT NULL DEFAULT 0,
    carbsTargetGrams INTEGER NOT NULL DEFAULT 0,
    consumedCarbsGrams INTEGER NOT NULL DEFAULT 0,
    fatsTargetGrams INTEGER NOT NULL DEFAULT 0,
    consumedFatsGrams INTEGER NOT NULL DEFAULT 0,
    meals TEXT NOT NULL DEFAULT '[]'
  );
  CREATE INDEX IF NOT EXISTS idx_nutrition_logs_userId_date ON nutrition_logs(userId, date);

  CREATE TABLE IF NOT EXISTS membership_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    monthlyPrice REAL NOT NULL,
    annualPrice REAL NOT NULL,
    description TEXT,
    badge TEXT,
    isPopular INTEGER NOT NULL DEFAULT 0,
    features TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL CHECK(status IN ('ACTIVE','INACTIVE'))
  );

  CREATE TABLE IF NOT EXISTS user_memberships (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    planId TEXT REFERENCES membership_plans(id) ON DELETE SET NULL,
    planName TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('ACTIVE','EXPIRED','PENDING','CANCELLED')),
    startDate TEXT NOT NULL,
    expiryDate TEXT NOT NULL,
    billingCycle TEXT NOT NULL CHECK(billingCycle IN ('monthly','annual')),
    pricePaid REAL NOT NULL DEFAULT 0,
    autoRenew INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_user_memberships_userId ON user_memberships(userId);

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    userName TEXT NOT NULL,
    trainerId TEXT REFERENCES users(id) ON DELETE SET NULL,
    trainerName TEXT,
    date TEXT NOT NULL,
    timeSlot TEXT NOT NULL,
    sessionType TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('CONFIRMED','COMPLETED','CANCELLED','RESCHEDULED')),
    location TEXT,
    notes TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_bookings_userId ON bookings(userId);
  CREATE INDEX IF NOT EXISTS idx_bookings_trainerId ON bookings(trainerId);

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    userName TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK(status IN ('PAID','REFUNDED','FAILED')),
    date TEXT NOT NULL,
    description TEXT,
    invoiceNumber TEXT,
    planName TEXT,
    method TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_payments_userId ON payments(userId);

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    date TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    type TEXT CHECK(type IN ('info','success','warning'))
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);

  CREATE TABLE IF NOT EXISTS trainer_notes (
    id TEXT PRIMARY KEY,
    trainerId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    note TEXT NOT NULL,
    flag TEXT CHECK(flag IN ('ON_TRACK','ATTENTION_NEEDED','MILESTONE_REACHED'))
  );
  CREATE INDEX IF NOT EXISTS idx_trainer_notes_userId ON trainer_notes(userId);

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    expiresAt INTEGER NOT NULL
  );
`);

// Table names in an order safe for INSERT (parents before children) —
// reversed, it's also safe for DELETE (children before parents).
const TABLES_PARENT_FIRST = [
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

// ---------------------------------------------------------------------------
// Row <-> object helpers
// ---------------------------------------------------------------------------
// SQLite rows come back as plain untyped objects; these helpers normalize
// them (NULL -> undefined, 0/1 -> boolean, JSON text -> parsed value) before
// they're cast to the real DatabaseSchema row types below.
function nullsToUndefined(row: unknown): Record<string, unknown> {
  const obj = row as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (obj[key] === null) obj[key] = undefined;
  }
  return obj;
}
const toBool = (v: unknown): boolean => Boolean(v);
const toJson = (v: unknown): unknown => (typeof v === 'string' ? JSON.parse(v) : v);

// ---------------------------------------------------------------------------
// Hydrate: SQLite -> in-memory DatabaseSchema (used once at startup; the
// resulting object is then cached and mutated directly by the API routes,
// exactly like the old JSON-file version did).
// ---------------------------------------------------------------------------
export function hydrateAll(): DatabaseSchema {
  const users = sqlite
    .prepare('SELECT * FROM users')
    .all()
    .map((r) => nullsToUndefined(r) as unknown as User);

  const profiles = sqlite
    .prepare('SELECT * FROM profiles')
    .all()
    .map((r) => nullsToUndefined(r) as unknown as UserProfile);

  const trainers = sqlite
    .prepare('SELECT * FROM trainers')
    .all()
    .map((r) => {
      const row = nullsToUndefined(r);
      return {
        ...row,
        certifications: toJson(row.certifications) as string[],
        availableSlots: toJson(row.availableSlots) as string[],
      } as unknown as TrainerInfo;
    });

  const workoutPlans = sqlite
    .prepare('SELECT * FROM workout_plans')
    .all()
    .map((r) => {
      const row = nullsToUndefined(r);
      return { ...row, exercises: toJson(row.exercises) } as unknown as WorkoutPlan;
    });

  const workoutAssignments = sqlite
    .prepare('SELECT * FROM workout_assignments')
    .all()
    .map((r) => {
      const row = nullsToUndefined(r);
      return { ...row, exercises: toJson(row.exercises) } as unknown as WorkoutAssignment;
    });

  const progressRecords = sqlite
    .prepare('SELECT * FROM progress_records')
    .all()
    .map((r) => {
      const row = nullsToUndefined(r);
      return { ...row, workoutCompleted: toBool(row.workoutCompleted) } as unknown as ProgressRecord;
    });

  const nutritionLogs = sqlite
    .prepare('SELECT * FROM nutrition_logs')
    .all()
    .map((r) => {
      const row = nullsToUndefined(r);
      return { ...row, meals: toJson(row.meals) } as unknown as NutritionLog;
    });

  const membershipPlans = sqlite
    .prepare('SELECT * FROM membership_plans')
    .all()
    .map((r) => {
      const row = nullsToUndefined(r);
      return {
        ...row,
        features: toJson(row.features),
        isPopular: row.isPopular === undefined ? undefined : toBool(row.isPopular),
      } as unknown as MembershipPlan;
    });

  const userMemberships = sqlite
    .prepare('SELECT * FROM user_memberships')
    .all()
    .map((r) => {
      const row = nullsToUndefined(r);
      return { ...row, autoRenew: toBool(row.autoRenew) } as unknown as UserMembership;
    });

  const bookings = sqlite
    .prepare('SELECT * FROM bookings')
    .all()
    .map((r) => nullsToUndefined(r) as unknown as Booking);

  const payments = sqlite
    .prepare('SELECT * FROM payments')
    .all()
    .map((r) => nullsToUndefined(r) as unknown as PaymentRecord);

  const notifications = sqlite
    .prepare('SELECT * FROM notifications')
    .all()
    .map((r) => {
      const row = nullsToUndefined(r);
      return { ...row, read: toBool(row.read) } as unknown as NotificationItem;
    });

  const trainerNotes = sqlite
    .prepare('SELECT * FROM trainer_notes')
    .all()
    .map((r) => nullsToUndefined(r) as unknown as ClientProgressNote);

  const passwordResetTokens = sqlite
    .prepare('SELECT * FROM password_reset_tokens')
    .all() as PasswordResetToken[];

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
// Persist: full in-memory DatabaseSchema -> SQLite.
//
// The whole app is built around "load the whole DB into memory, mutate freely,
// save the whole thing back" (this was true for the JSON file too — every
// route calls getDatabase() then saveDatabase(db)). Rewriting every route to
// do incremental SQL statements would be a large, risky rewrite that isn't
// asked for. Instead, each save does a full, transactional resync: delete
// every row, reinsert the current in-memory state. Foreign keys are
// temporarily disabled for the resync (a self-referencing FK — users.
// assignedTrainerId — makes a bulk delete/reinsert otherwise order-sensitive
// in ways not worth the complexity) and restored immediately after. It's
// wrapped in a single transaction, so it's atomic and, for this app's data
// volume (dozens to low hundreds of rows), takes low single-digit
// milliseconds with better-sqlite3's synchronous API.
// ---------------------------------------------------------------------------
export function persistAll(data: DatabaseSchema): void {
  sqlite.pragma('foreign_keys = OFF');
  try {
    const run = sqlite.transaction(() => {
      for (const table of [...TABLES_PARENT_FIRST].reverse()) {
        sqlite.exec(`DELETE FROM ${table}`);
      }

      const insertUser = sqlite.prepare(
        `INSERT INTO users (id, name, email, passwordHash, role, phone, dateOfBirth, gender, fitnessGoal, status, joinedDate, avatar, assignedTrainerId)
         VALUES (@id, @name, @email, @passwordHash, @role, @phone, @dateOfBirth, @gender, @fitnessGoal, @status, @joinedDate, @avatar, @assignedTrainerId)`
      );
      for (const u of data.users) {
        insertUser.run({
          phone: null, dateOfBirth: null, gender: null, fitnessGoal: null, avatar: null, assignedTrainerId: null,
          ...u,
        });
      }

      const insertPlan = sqlite.prepare(
        `INSERT INTO membership_plans (id, name, monthlyPrice, annualPrice, description, badge, isPopular, features, status)
         VALUES (@id, @name, @monthlyPrice, @annualPrice, @description, @badge, @isPopular, @features, @status)`
      );
      for (const p of data.membershipPlans) {
        insertPlan.run({
          badge: null,
          ...p,
          isPopular: p.isPopular ? 1 : 0,
          features: JSON.stringify(p.features ?? []),
        });
      }

      const insertProfile = sqlite.prepare(
        `INSERT INTO profiles (userId, currentWeight, targetWeight, height, bodyFatPercentage, muscleMass, emergencyContact, bio)
         VALUES (@userId, @currentWeight, @targetWeight, @height, @bodyFatPercentage, @muscleMass, @emergencyContact, @bio)`
      );
      for (const p of data.profiles) {
        insertProfile.run({ emergencyContact: null, bio: null, ...p });
      }

      const insertTrainer = sqlite.prepare(
        `INSERT INTO trainers (id, userId, name, email, phone, specialty, experience, rating, reviewsCount, bio, certifications, clientCount, availableSlots, status)
         VALUES (@id, @userId, @name, @email, @phone, @specialty, @experience, @rating, @reviewsCount, @bio, @certifications, @clientCount, @availableSlots, @status)`
      );
      for (const t of data.trainers) {
        insertTrainer.run({
          ...t,
          certifications: JSON.stringify(t.certifications ?? []),
          availableSlots: JSON.stringify(t.availableSlots ?? []),
        });
      }

      const insertWorkoutPlan = sqlite.prepare(
        `INSERT INTO workout_plans (id, title, category, level, durationMinutes, caloriesBurn, description, createdByTrainerId, exercises)
         VALUES (@id, @title, @category, @level, @durationMinutes, @caloriesBurn, @description, @createdByTrainerId, @exercises)`
      );
      for (const w of data.workoutPlans) {
        insertWorkoutPlan.run({
          createdByTrainerId: null,
          ...w,
          exercises: JSON.stringify(w.exercises ?? []),
        });
      }

      const insertAssignment = sqlite.prepare(
        `INSERT INTO workout_assignments (id, userId, workoutPlanId, workoutTitle, assignedByTrainerName, assignedDate, scheduledDate, status, completedAt, notes, exercises)
         VALUES (@id, @userId, @workoutPlanId, @workoutTitle, @assignedByTrainerName, @assignedDate, @scheduledDate, @status, @completedAt, @notes, @exercises)`
      );
      for (const a of data.workoutAssignments) {
        insertAssignment.run({
          assignedByTrainerName: null, completedAt: null, notes: null,
          ...a,
          exercises: JSON.stringify(a.exercises ?? []),
        });
      }

      const insertProgress = sqlite.prepare(
        `INSERT INTO progress_records (id, userId, date, weightKg, caloriesBurned, steps, workoutCompleted, strengthScore, notes)
         VALUES (@id, @userId, @date, @weightKg, @caloriesBurned, @steps, @workoutCompleted, @strengthScore, @notes)`
      );
      for (const p of data.progressRecords) {
        insertProgress.run({ notes: null, ...p, workoutCompleted: p.workoutCompleted ? 1 : 0 });
      }

      const insertNutrition = sqlite.prepare(
        `INSERT INTO nutrition_logs (id, userId, date, dailyCalorieTarget, consumedCalories, proteinTargetGrams, consumedProteinGrams, carbsTargetGrams, consumedCarbsGrams, fatsTargetGrams, consumedFatsGrams, meals)
         VALUES (@id, @userId, @date, @dailyCalorieTarget, @consumedCalories, @proteinTargetGrams, @consumedProteinGrams, @carbsTargetGrams, @consumedCarbsGrams, @fatsTargetGrams, @consumedFatsGrams, @meals)`
      );
      for (const n of data.nutritionLogs) {
        insertNutrition.run({ ...n, meals: JSON.stringify(n.meals ?? []) });
      }

      const insertMembership = sqlite.prepare(
        `INSERT INTO user_memberships (id, userId, planId, planName, status, startDate, expiryDate, billingCycle, pricePaid, autoRenew)
         VALUES (@id, @userId, @planId, @planName, @status, @startDate, @expiryDate, @billingCycle, @pricePaid, @autoRenew)`
      );
      for (const m of data.userMemberships) {
        insertMembership.run({ planId: null, ...m, autoRenew: m.autoRenew ? 1 : 0 });
      }

      const insertBooking = sqlite.prepare(
        `INSERT INTO bookings (id, userId, userName, trainerId, trainerName, date, timeSlot, sessionType, status, location, notes)
         VALUES (@id, @userId, @userName, @trainerId, @trainerName, @date, @timeSlot, @sessionType, @status, @location, @notes)`
      );
      for (const b of data.bookings) {
        insertBooking.run({ trainerId: null, trainerName: null, location: null, notes: null, ...b });
      }

      const insertPayment = sqlite.prepare(
        `INSERT INTO payments (id, userId, userName, amount, currency, status, date, description, invoiceNumber, planName, method)
         VALUES (@id, @userId, @userName, @amount, @currency, @status, @date, @description, @invoiceNumber, @planName, @method)`
      );
      for (const p of data.payments) {
        insertPayment.run({ description: null, invoiceNumber: null, planName: null, method: null, ...p });
      }

      const insertNotification = sqlite.prepare(
        `INSERT INTO notifications (id, userId, title, message, date, read, type)
         VALUES (@id, @userId, @title, @message, @date, @read, @type)`
      );
      for (const n of data.notifications) {
        insertNotification.run({ message: null, type: null, ...n, read: n.read ? 1 : 0 });
      }

      const insertNote = sqlite.prepare(
        `INSERT INTO trainer_notes (id, trainerId, userId, date, note, flag)
         VALUES (@id, @trainerId, @userId, @date, @note, @flag)`
      );
      for (const n of data.trainerNotes) {
        insertNote.run({ flag: null, ...n });
      }

      const insertToken = sqlite.prepare(
        `INSERT INTO password_reset_tokens (token, email, expiresAt) VALUES (@token, @email, @expiresAt)`
      );
      for (const t of data.passwordResetTokens) {
        insertToken.run(t);
      }
    });

    run();
  } finally {
    sqlite.pragma('foreign_keys = ON');
  }
}

// ---------------------------------------------------------------------------
// Migration bookkeeping
// ---------------------------------------------------------------------------
export function getTableCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const table of TABLES_PARENT_FIRST) {
    const row = sqlite.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as { c: number };
    counts[table] = row.c;
  }
  return counts;
}

export function isDatabaseEmpty(): boolean {
  const row = sqlite.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  return row.c === 0;
}

export interface MigrationResult {
  ranMigration: boolean;
  source: 'json' | 'seed' | 'existing';
  counts: Record<string, number>;
}

/**
 * Safe, idempotent migration entry point.
 * - If SQLite already has users, it's considered "already migrated" — does
 *   nothing and never touches existing rows.
 * - Otherwise, if data/ironcore_db.json exists, imports it into SQLite (the
 *   JSON file itself is never modified or deleted).
 * - Otherwise, falls back to the given seed data (fresh install, no prior data
 *   at all) so the app still boots with demo data as before.
 */
export function migrateFromJsonIfNeeded(seedFallback: () => DatabaseSchema): MigrationResult {
  if (!isDatabaseEmpty()) {
    return { ranMigration: false, source: 'existing', counts: getTableCounts() };
  }

  if (fs.existsSync(JSON_DB_PATH)) {
    const raw = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    const json = JSON.parse(raw) as DatabaseSchema;
    persistAll(normalizeSchema(json));
    return { ranMigration: true, source: 'json', counts: getTableCounts() };
  }

  persistAll(seedFallback());
  return { ranMigration: true, source: 'seed', counts: getTableCounts() };
}

/** Fills in any arrays missing from an older/partial JSON file with []. */
function normalizeSchema(json: Partial<DatabaseSchema>): DatabaseSchema {
  return {
    users: json.users ?? [],
    profiles: json.profiles ?? [],
    trainers: json.trainers ?? [],
    workoutPlans: json.workoutPlans ?? [],
    workoutAssignments: json.workoutAssignments ?? [],
    progressRecords: json.progressRecords ?? [],
    nutritionLogs: json.nutritionLogs ?? [],
    membershipPlans: json.membershipPlans ?? [],
    userMemberships: json.userMemberships ?? [],
    bookings: json.bookings ?? [],
    payments: json.payments ?? [],
    notifications: json.notifications ?? [],
    trainerNotes: json.trainerNotes ?? [],
    passwordResetTokens: json.passwordResetTokens ?? [],
  };
}
