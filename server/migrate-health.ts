import 'dotenv/config';
import { closePool, ensureSchema, getPool } from './postgres.js';

try {
  const exists = (await getPool().query("SELECT to_regclass('public.nutrition_logs') AS name"))
    .rows[0].name;
  if (exists) {
    const duplicates = (
      await getPool().query(
        'SELECT count(*) AS count FROM (SELECT "userId", date FROM nutrition_logs GROUP BY "userId", date HAVING count(*)>1) duplicates',
      )
    ).rows[0].count;
    if (Number(duplicates))
      throw new Error(
        `${duplicates} duplicate member/day groups exist. Back up and reconcile those legacy nutrition logs before migration; no schema changes were made.`,
      );
  }
  await ensureSchema();
  console.log('Health schema ready. Existing records were preserved.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Health migration failed.');
  process.exitCode = 1;
} finally {
  await closePool();
}
