// One-time SQLite -> PostgreSQL (Supabase) data migration.
//
// - Reads the existing data/ironcore.db via sqlite.ts's hydrateAll() — this
//   ONLY reads from SQLite; it never writes to, modifies, or deletes
//   data/ironcore.db, data/ironcore.db-shm, data/ironcore.db-wal, or
//   data/ironcore_db.json.
// - Creates the PostgreSQL schema (CREATE TABLE IF NOT EXISTS — never drops
//   or alters an existing table) if it doesn't already exist.
// - Refuses to touch anything if PostgreSQL already has data — this script
//   is meant to run exactly once, against an empty Supabase database. If
//   Postgres already has users, it's treated as "already migrated": counts
//   are printed and nothing is changed.
// - Inserts all 14 tables inside one transaction, parent-first, with
//   deferred foreign-key checks (see server/postgres.ts persistAll()).
//
// Usage: npm run migrate:postgres
// Requires DATABASE_URL to be set (see .env.example).
import 'dotenv/config';
import { hydrateAll as hydrateSqlite, SQLITE_DB_PATH, JSON_DB_PATH } from './sqlite.js';
import {
  ensureSchema,
  isDatabaseEmpty,
  getTableCounts,
  persistAll,
  closePool,
  TABLES_PARENT_FIRST,
} from './postgres.js';

function printCounts(title: string, counts: Record<string, number>): void {
  console.log(title);
  for (const table of TABLES_PARENT_FIRST) {
    console.log(`  ${table.padEnd(22)} ${counts[table] ?? 0}`);
  }
}

async function main(): Promise<void> {
  console.log('IronCore SQLite -> PostgreSQL migration');
  console.log('  SQLite source (read-only) :', SQLITE_DB_PATH);
  console.log('  JSON file (untouched)     :', JSON_DB_PATH);

  if (!process.env.DATABASE_URL?.trim()) {
    console.error();
    console.error('ERROR: DATABASE_URL is not set.');
    console.error(
      'Add it to your .env file — Supabase Dashboard → Project Settings → Database → ' +
        'Connection string → Session pooler (fill in your real password; never commit it).'
    );
    process.exitCode = 1;
    return;
  }

  console.log();
  console.log('Reading existing SQLite database (read-only)...');
  const sqliteData = hydrateSqlite();
  const sqliteCounts: Record<string, number> = {
    users: sqliteData.users.length,
    membership_plans: sqliteData.membershipPlans.length,
    profiles: sqliteData.profiles.length,
    trainers: sqliteData.trainers.length,
    workout_plans: sqliteData.workoutPlans.length,
    workout_assignments: sqliteData.workoutAssignments.length,
    progress_records: sqliteData.progressRecords.length,
    nutrition_logs: sqliteData.nutritionLogs.length,
    user_memberships: sqliteData.userMemberships.length,
    bookings: sqliteData.bookings.length,
    payments: sqliteData.payments.length,
    notifications: sqliteData.notifications.length,
    trainer_notes: sqliteData.trainerNotes.length,
    password_reset_tokens: sqliteData.passwordResetTokens.length,
  };
  printCounts('SQLite row counts:', sqliteCounts);

  console.log();
  console.log('Connecting to PostgreSQL and ensuring schema exists...');
  try {
    await ensureSchema();
  } catch (err) {
    console.error();
    console.error('ERROR: Failed to connect to PostgreSQL or create schema.');
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
    return;
  }
  console.log('PostgreSQL connection OK. Schema ready (14 tables).');

  const alreadyHasData = !(await isDatabaseEmpty());
  if (alreadyHasData) {
    console.log();
    console.log('PostgreSQL already contains data — treating as already migrated. Nothing was changed.');
    printCounts('Existing PostgreSQL row counts:', await getTableCounts());
    await closePool();
    return;
  }

  console.log();
  console.log('PostgreSQL is empty. Migrating data inside a single transaction...');
  try {
    await persistAll(sqliteData);
  } catch (err) {
    console.error();
    console.error('MIGRATION FAILED — transaction rolled back. No partial data was written.');
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
    await closePool();
    return;
  }

  console.log('Migration transaction committed successfully.');
  console.log();

  const pgCounts = await getTableCounts();
  printCounts('PostgreSQL row counts after migration:', pgCounts);

  console.log();
  let mismatch = false;
  for (const table of TABLES_PARENT_FIRST) {
    if ((sqliteCounts[table] ?? 0) !== (pgCounts[table] ?? 0)) {
      mismatch = true;
      console.error(
        `MISMATCH: ${table} — SQLite had ${sqliteCounts[table] ?? 0}, PostgreSQL has ${pgCounts[table] ?? 0}`
      );
    }
  }

  if (mismatch) {
    console.error('Row counts do not match between SQLite and PostgreSQL. Investigate before trusting this migration.');
    process.exitCode = 1;
  } else {
    console.log('All row counts match between SQLite and PostgreSQL. Migration verified.');
  }

  await closePool();
}

main().catch(async (err) => {
  console.error('Unexpected error during migration:', err);
  try {
    await closePool();
  } catch {
    // ignore
  }
  process.exitCode = 1;
});
