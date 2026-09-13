/**
 * FBR-05: normalises every stored `profiles.phone` to E.164 using the exact
 * same `normalizePhone` function the login route calls at runtime — not a
 * hand-rolled SQL regex that could subtly disagree with it. Run this BEFORE
 * applying drizzle/0007_phone_unique.sql, and after `npm run report:phone-dupes`
 * reports zero collisions (normalisation itself can create new collisions,
 * e.g. "+919876543210" and "9876543210" becoming equal — re-run the report
 * after this script, not just before it).
 *
 * Idempotent: a phone already in E.164 form is left untouched (no-op update
 * skipped), so this is safe to run more than once.
 *
 * Usage:
 *   npm run backfill:phone-e164          -- dry run, prints planned changes
 *   npm run backfill:phone-e164 -- --apply   -- actually writes
 */
import { sql } from 'drizzle-orm';
import { closeDb, getDb } from '../src/db/client';
import { normalizePhone } from '../src/lib/auth';
import { profiles } from '../src/db/schema';

async function main() {
  const apply = process.argv.includes('--apply');
  const db = await getDb();

  const rows = await db
    .select({ id: profiles.id, username: profiles.username, phone: profiles.phone })
    .from(profiles)
    .where(sql`${profiles.phone} IS NOT NULL AND ${profiles.phone} <> ''`);

  const changes: { id: string; username: string; from: string; to: string }[] = [];
  for (const row of rows) {
    if (!row.phone) continue;
    const { fullPhone } = normalizePhone('+91', row.phone);
    if (fullPhone !== row.phone) {
      changes.push({ id: row.id, username: row.username, from: row.phone, to: fullPhone });
    }
  }

  if (changes.length === 0) {
    console.log('[backfill:phone-e164] every stored phone is already E.164 — nothing to do.');
  } else {
    console.log(`[backfill:phone-e164] ${apply ? 'applying' : 'would apply'} ${changes.length} change(s):`);
    for (const c of changes) {
      console.log(`  ${c.username}: "${c.from}" -> "${c.to}"`);
    }
  }

  if (apply) {
    for (const c of changes) {
      await db.update(profiles).set({ phone: c.to }).where(sql`${profiles.id} = ${c.id}`);
    }
    console.log(`[backfill:phone-e164] applied ${changes.length} update(s).`);
  } else if (changes.length > 0) {
    console.log('\n[backfill:phone-e164] dry run only — re-run with -- --apply to write these changes.');
    console.log('[backfill:phone-e164] run `npm run report:phone-dupes` again afterwards: normalising can');
    console.log('[backfill:phone-e164] itself create new collisions (e.g. "9876543210" and "+919876543210").');
  }

  await closeDb();
}

main().catch(async (err) => {
  console.error('[backfill:phone-e164] failed', err);
  await closeDb().catch(() => {});
  process.exit(1);
});
