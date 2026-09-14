import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '@/db/schema';
import type { Db } from '@/db/client';

/**
 * FBR-05: phone numbers were never effectively unique (the pre-existing DB
 * index only catches an *exact* duplicate string — "+919876543210" and
 * "9876543210" are different strings for the same real number and could both
 * exist as separate rows from before every write path normalised). Login
 * resolved a collision with `.limit(1)` and no `ORDER BY` — an unordered
 * pick that could differ between requests. This test seeds that exact
 * historical-data shape directly (bypassing the now-normalising write paths,
 * the same way old data would have gotten here) and asserts the fix: no
 * guessing, ever.
 */

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const MIGRATIONS_DIR = path.join(ROOT, 'drizzle');

let pg: PGlite;
let db: Db;

const cookieStore = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => (cookieStore.has(name) ? { value: cookieStore.get(name) } : undefined),
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  })),
}));

vi.mock('@/db/client', () => ({
  getDb: vi.fn(async () => db),
}));

describe('loginWithPhone ambiguity resolution (FBR-05)', () => {
  const studentAId = '66666666-6666-4666-8666-666666666666';
  const studentBId = '77777777-7777-4777-8777-777777777777';

  beforeAll(async () => {
    process.env.SESSION_SECRET = 'b'.repeat(32);

    pg = await PGlite.create();
    const files = fs
      .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.sql'))
      .map((e) => e.name)
      .sort();
    for (const file of files) {
      await pg.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
    }
    db = drizzle(pg, { schema }) as Db;

    // Two rows for the SAME real phone number in two different historical
    // string shapes — exactly what the pre-existing unique index does not
    // catch, because it only rejects an identical string.
    await db.insert(schema.profiles).values([
      {
        id: studentAId,
        username: 'legacy_student_a',
        email: 'legacy.a@example.com',
        fullName: 'Legacy Student A',
        role: 'student',
        phone: '+919876500002',
        batch: 'General',
        isActive: true,
        canLogin: true,
      },
      {
        id: studentBId,
        username: 'legacy_student_b',
        email: 'legacy.b@example.com',
        fullName: 'Legacy Student B',
        role: 'student',
        phone: '9876500002', // same real number, different stored string
        batch: 'General',
        isActive: true,
        canLogin: true,
      },
    ]);
  });

  afterAll(async () => {
    await pg.close();
  });

  it('refuses to guess between two accounts sharing a phone number (409, not an arbitrary pick)', async () => {
    const { loginWithPhone } = await import('./auth');
    const { HttpError } = await import('./http');

    await expect(loginWithPhone('+91', '9876500002')).rejects.toMatchObject({
      status: 409,
      code: 'phone_ambiguous',
    } satisfies Partial<InstanceType<typeof HttpError>>);
  });

  it('the same lookup is refused identically on a second call — no plan-dependent flip-flopping', async () => {
    const { loginWithPhone } = await import('./auth');
    // The original bug was that an unordered `.limit(1)` could return a
    // DIFFERENT winner across requests as the query plan changed. The fix
    // must refuse deterministically every time, not "sometimes guess right".
    await expect(loginWithPhone('+91', '9876500002')).rejects.toMatchObject({ status: 409 });
    await expect(loginWithPhone('+91', '9876500002')).rejects.toMatchObject({ status: 409 });
  });
});
