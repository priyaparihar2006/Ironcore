import { isDeepStrictEqual } from 'node:util';
import type { DatabaseSchema } from './types.js';
import { getPool } from './postgres.js';

// Static identifiers only. All values are parameters. Legacy callers retain their
// load/mutate/save API, but only changed rows are written, never whole tables.
export const collections = {
  users: ['users', 'id'],
  membershipPlans: ['membership_plans', 'id'],
  profiles: ['profiles', 'userId'],
  trainers: ['trainers', 'id'],
  workoutPlans: ['workout_plans', 'id'],
  workoutAssignments: ['workout_assignments', 'id'],
  progressRecords: ['progress_records', 'id'],
  nutritionLogs: ['nutrition_logs', 'id'],
  userMemberships: ['user_memberships', 'id'],
  bookings: ['bookings', 'id'],
  payments: ['payments', 'id'],
  notifications: ['notifications', 'id'],
  trainerNotes: ['trainer_notes', 'id'],
  passwordResetTokens: ['password_reset_tokens', 'token'],
  wellnessStates: ['wellness_states', 'userId'],
} as const;

export function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, canonical(v)]),
    );
  return value;
}
export const same = (a: unknown, b: unknown) => isDeepStrictEqual(canonical(a), canonical(b));
export function conflict(): Error {
  return Object.assign(
    new Error('This record changed in another request. Refresh and try again.'),
    { status: 409 },
  );
}

export async function persistChanges(before: DatabaseSchema, after: DatabaseSchema): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    // Coordinates all application writers (including deletion) across instances.
    await client.query('SELECT pg_advisory_xact_lock(73180421)');
    await client.query('SET CONSTRAINTS ALL DEFERRED');
    const changes: { table: string; key: string; id: string; row?: Record<string, unknown> }[] = [];
    for (const row of after.nutritionLogs) {
      if (
        same(
          before.nutritionLogs.find((r) => r.id === row.id),
          row,
        )
      )
        continue;
      const currentState = (
        await client.query('SELECT * FROM wellness_states WHERE "userId"=$1 FOR UPDATE', [
          row.userId,
        ])
      ).rows[0];
      if (
        !same(
          currentState,
          before.wellnessStates?.find((r) => r.userId === row.userId),
        )
      )
        throw conflict();
      const currentProfile = (
        await client.query('SELECT * FROM profiles WHERE "userId"=$1 FOR UPDATE', [row.userId])
      ).rows[0];
      if (
        !same(
          currentProfile,
          before.profiles.find((r) => r.userId === row.userId),
        )
      )
        throw conflict();
    }
    // Check dependencies before saving recommendations computed from a snapshot.
    for (const row of after.wellnessStates || []) {
      const old = before.wellnessStates?.find((r) => r.userId === row.userId);
      if (same(old, row)) continue;
      for (const [table, key, original] of [
        ['profiles', 'userId', before.profiles.find((p) => p.userId === row.userId)],
        ['users', 'id', before.users.find((u) => u.id === row.userId)],
      ] as const) {
        const current = (
          await client.query(`SELECT * FROM ${table} WHERE "${key}"=$1 FOR UPDATE`, [row.userId])
        ).rows[0];
        if (!same(current, original)) throw conflict();
      }
    }
    // AI results must not commit against meal/progress data changed while an
    // external request was running. Reports still retain their input snapshots.
    for (const row of after.wellnessStates || []) {
      if (
        same(
          before.wellnessStates?.find((r) => r.userId === row.userId),
          row,
        )
      )
        continue;
      for (const [table, original] of [
        ['nutrition_logs', before.nutritionLogs.filter((r) => r.userId === row.userId)],
        ['progress_records', before.progressRecords.filter((r) => r.userId === row.userId)],
      ] as const) {
        const current = (
          await client.query(`SELECT * FROM ${table} WHERE "userId"=$1 FOR UPDATE`, [row.userId])
        ).rows;
        const ordered = (rows: { id: string }[]) =>
          [...rows].sort((a, b) => a.id.localeCompare(b.id));
        if (!same(ordered(current), ordered(original))) throw conflict();
      }
    }
    // Validate every changed row before deletes can cascade into other rows.
    for (const [collection, [table, key]] of Object.entries(collections)) {
      const oldRows = new Map<string, Record<string, unknown>>(
        (before[collection] || []).map((r) => [r[key], r]),
      );
      const newRows = new Map<string, Record<string, unknown>>(
        (after[collection] || []).map((r) => [r[key], r]),
      );
      for (const id of new Set([...oldRows.keys(), ...newRows.keys()])) {
        const oldRow = oldRows.get(id),
          newRow = newRows.get(id);
        if (same(oldRow, newRow)) continue;
        const current = (
          await client.query(`SELECT * FROM ${table} WHERE "${key}"=$1 FOR UPDATE`, [id])
        ).rows[0];
        if (!same(current, oldRow)) throw conflict();
        changes.push({ table, key, id, row: newRow });
      }
    }
    for (const { table, key, id } of changes.filter((c) => !c.row).reverse()) {
      await client.query(`DELETE FROM ${table} WHERE "${key}"=$1`, [id]);
    }
    for (const { table, key, row } of changes.filter((c) => c.row)) {
      const columns = (
        await client.query(
          'SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=$1 ORDER BY ordinal_position',
          [table],
        )
      ).rows.map((r) => r.column_name as string);
      const quoted = columns.map((c) => '"' + c.replaceAll('"', '""') + '"');
      const assignments = columns
        .filter((c) => c !== key)
        .map((c) => `"${c}"=EXCLUDED."${c}"`)
        .join(',');
      await client.query(
        `INSERT INTO ${table} (${quoted.join(',')}) SELECT ${quoted.join(',')} FROM jsonb_populate_record(NULL::${table}, $1::jsonb) ON CONFLICT ("${key}") DO UPDATE SET ${assignments}`,
        [JSON.stringify(row)],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    if ((error as { code?: string }).code === '23505') throw conflict();
    throw error;
  } finally {
    client.release();
  }
}
