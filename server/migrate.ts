// Standalone, explicit entry point for the JSON -> SQLite migration.
// Safe to run more than once: if data/ironcore.db already has users, it
// refuses to touch anything and just reports the existing counts. It never
// modifies or deletes data/ironcore_db.json.
//
// Usage: npm run migrate
import { migrateFromJsonIfNeeded, SQLITE_DB_PATH, JSON_DB_PATH } from './sqlite.js';
import { generateSeedData } from './db.js';

const result = migrateFromJsonIfNeeded(generateSeedData);

console.log('IronCore SQLite migration');
console.log('  SQLite database :', SQLITE_DB_PATH);
console.log('  JSON source     :', JSON_DB_PATH);
console.log();

if (!result.ranMigration) {
  console.log('Already migrated — SQLite already contains data. Nothing was changed.');
} else if (result.source === 'json') {
  console.log('Imported data/ironcore_db.json into SQLite for the first time.');
} else {
  console.log('No data/ironcore_db.json found — seeded SQLite with the built-in demo data instead.');
}

console.log();
console.log('Record counts per table:');
for (const [table, count] of Object.entries(result.counts)) {
  console.log(`  ${table.padEnd(22)} ${count}`);
}
