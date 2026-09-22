import 'dotenv/config';
import { ensureSchema, closePool, getPool } from './postgres.js';

try {
  await ensureSchema();
  const duplicates = (
    await getPool().query(
      'SELECT count(*) AS count FROM (SELECT lower(btrim(email)) FROM users GROUP BY lower(btrim(email)) HAVING count(*)>1) duplicates',
    )
  ).rows[0].count;
  console.log('Validation constraints installed. Existing records were preserved.');
  if (Number(duplicates))
    console.log(
      `${duplicates} existing duplicate email groups need manual review. New duplicates are blocked; existing accounts were not changed.`,
    );
} catch {
  console.error(
    'Validation migration failed. No credentials or record values were logged. Review the database connection and migration permissions.',
  );
  process.exitCode = 1;
} finally {
  await closePool();
}
