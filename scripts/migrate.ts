/**
 * Standalone migration script.
 *
 * Runs all pending migrations from drizzle/ in sequence against whichever database
 * is currently configured (PostgreSQL if DATABASE_URL is set, or local PGlite).
 *
 * Usage:
 *   npm run migrate
 *   npx tsx scripts/migrate.ts
 */
import fs from 'node:fs';
import path from 'node:path';

// Load .env if present
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // Ignore if already loaded or invalid
  }
}

import { closeDb, getDbBundle, runMigrations } from '../src/db/client';

async function main() {
  console.log('[migrate] checking database connection and migrations...');
  const bundle = await getDbBundle();
  await runMigrations(bundle.client);
  console.log('[migrate] all migrations applied successfully.');
}

main()
  .catch((err) => {
    console.error('[migrate] migration failed:', err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
