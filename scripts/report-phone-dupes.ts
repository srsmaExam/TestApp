/**
 * FBR-05: phone numbers were never unique, and login resolved a collision
 * arbitrarily (`.limit(1)`, no ORDER BY) — Student A could be handed Student
 * B's session on one request and their own on the next.
 *
 * This is a REQUIRED precondition, run BEFORE the 0007_phone_unique.sql
 * migration. `CREATE UNIQUE INDEX` fails outright if collisions already
 * exist, and a failing migration aborts app boot entirely (runMigrations()
 * in src/db/client.ts) — turning a data-hygiene issue into a total outage.
 *
 * Run against production BEFORE deploying the migration:
 *   npm run report:phone-dupes
 *
 * This only reports. Resolving collisions (merging accounts, clearing a
 * phone, asking a family to share a login) is an institutional decision, not
 * one this script makes for you.
 */
import { closeDb, getDb } from '../src/db/client';
import { normalizePhone } from '../src/lib/auth';

async function main() {
  const db = await getDb();

  const rows = await db.$client.query<{
    id: string;
    username: string;
    full_name: string;
    phone: string;
  }>(`SELECT id, username, full_name, phone FROM profiles WHERE phone IS NOT NULL AND phone <> ''`);

  // Group by the E.164 form the 0007 migration will normalise every phone
  // to — two rows that only collide *after* normalisation (e.g. "9876543210"
  // vs "+919876543210") are exactly the case a raw SQL GROUP BY on the
  // as-stored column would miss.
  const groups = new Map<string, { id: string; username: string; fullName: string; rawPhone: string }[]>();
  for (const row of rows.rows) {
    const { fullPhone } = normalizePhone('+91', row.phone);
    const list = groups.get(fullPhone) ?? [];
    list.push({ id: row.id, username: row.username, fullName: row.full_name, rawPhone: row.phone });
    groups.set(fullPhone, list);
  }

  const collisions = [...groups.entries()].filter(([, holders]) => holders.length > 1);

  if (collisions.length === 0) {
    console.log('[report:phone-dupes] no collisions found — safe to apply 0007_phone_unique.sql.');
  } else {
    console.log(
      `[report:phone-dupes] found ${collisions.length} phone number(s) shared by more than one account. ` +
        `DO NOT apply 0007_phone_unique.sql until these are resolved:\n`,
    );
    for (const [normalized, holders] of collisions) {
      console.log(`  ${normalized}:`);
      for (const h of holders) {
        console.log(`    - ${h.username} (${h.fullName}) — id=${h.id}, stored as "${h.rawPhone}"`);
      }
    }
    console.log(
      `\n[report:phone-dupes] resolve each of these (merge, clear one account's phone, or confirm a ` +
        `shared family number should route to a single login) before running the migration.`,
    );
  }

  await closeDb();
  process.exitCode = collisions.length > 0 ? 1 : 0;
}

main().catch(async (err) => {
  console.error('[report:phone-dupes] failed', err);
  await closeDb().catch(() => {});
  process.exit(1);
});
