import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import type { Db } from '@/db/client';

/**
 * FBR-02 regression: standalone solution ingest (paperId omitted) previously
 * matched on `sourceQno` alone, which is not unique across subjects/batches
 * for standalone questions — uploading Chemistry solutions could silently
 * overwrite Physics solutions sharing "question 1". The fix requires a
 * `humanCode` to target a standalone row, and refuses ambiguous updates
 * instead of guessing.
 */

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const MIGRATIONS_DIR = path.join(ROOT, 'drizzle');

const teacherId = '99999999-9999-4999-8999-999999999999';

let pg: PGlite;
let db: Db;

vi.mock('@/lib/auth', () => ({
  apiTeacher: vi.fn(async () => ({
    userId: teacherId,
    username: 'teacher1',
    fullName: 'Teacher One',
    role: 'teacher',
  })),
}));

vi.mock('@/db/client', () => ({
  getDb: vi.fn(async () => db),
}));

async function callIngest(body: unknown) {
  const { POST } = await import('./ingest');
  const req = new Request('http://localhost/api/questions/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const res = await POST(req, {} as never);
  return { status: res.status, body: await res.json() };
}

describe('POST /api/questions/ingest — standalone solution targeting (FBR-02)', () => {
  const physicsId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const chemistryId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  beforeAll(async () => {
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

    await db.insert(schema.profiles).values({
      id: teacherId,
      username: 'teacher1',
      email: 'teacher1@example.com',
      fullName: 'Teacher One',
      role: 'teacher',
      passwordHash: 'x',
      isActive: true,
      canLogin: true,
    });

    // Two standalone questions sharing sourceQno: 1 across different
    // subjects/batches — exactly the collision FBR-02 describes.
    await db.insert(schema.questions).values([
      {
        id: physicsId,
        humanCode: 'Q-260101-PHY-001-AAA111',
        paperId: null,
        sourceQno: 1,
        sourcePage: 3,
        subject: 'physics',
        type: 'mcq',
        status: 'draft',
        body: 'A physics question numbered 1.',
        options: [
          { key: 'A', body: 'a' },
          { key: 'B', body: 'b' },
        ],
        solution: 'original physics solution',
        createdBy: teacherId,
        lastEditedBy: teacherId,
      },
      {
        id: chemistryId,
        humanCode: 'Q-260101-CHE-001-BBB222',
        paperId: null,
        sourceQno: 1,
        sourcePage: 7,
        subject: 'chemistry',
        type: 'mcq',
        status: 'draft',
        body: 'A chemistry question numbered 1.',
        options: [
          { key: 'A', body: 'a' },
          { key: 'B', body: 'b' },
        ],
        solution: 'original chemistry solution',
        createdBy: teacherId,
        lastEditedBy: teacherId,
      },
    ]);
  });

  afterAll(async () => {
    await pg.close();
  });

  it('refuses a standalone solution with neither paperId nor humanCode (422)', async () => {
    const { status, body } = await callIngest({
      solutions: [{ sourceQno: 1, solution: 'new solution text', imagePlaceholders: [] }],
    });
    expect(status).toBe(422);
    expect(body.error).toBe('ambiguous_solution_target');

    // Confirm neither row was touched.
    const [physics] = await db.select().from(schema.questions).where(eq(schema.questions.id, physicsId));
    const [chemistry] = await db.select().from(schema.questions).where(eq(schema.questions.id, chemistryId));
    expect(physics.solution).toBe('original physics solution');
    expect(chemistry.solution).toBe('original chemistry solution');
  });

  it('updates exactly the targeted row by humanCode and leaves the other subject byte-identical', async () => {
    const { status, body } = await callIngest({
      solutions: [
        {
          sourceQno: 1,
          humanCode: 'Q-260101-CHE-001-BBB222',
          solution: 'updated chemistry solution',
          sourcePage: 9,
          imagePlaceholders: [],
        },
      ],
    });
    expect(status).toBe(200);
    expect(body.updated).toBe(1);

    const [chemistry] = await db.select().from(schema.questions).where(eq(schema.questions.id, chemistryId));
    expect(chemistry.solution).toBe('updated chemistry solution');
    expect(chemistry.sourcePage).toBe(9);

    // The Physics row sharing sourceQno: 1 must be completely untouched —
    // this is the exact corruption FBR-02 reports.
    const [physics] = await db.select().from(schema.questions).where(eq(schema.questions.id, physicsId));
    expect(physics.solution).toBe('original physics solution');
    expect(physics.sourcePage).toBe(3);
  });

  it('still matches correctly by (paperId, sourceQno) when a paper is targeted', async () => {
    const [paper] = await db
      .insert(schema.papers)
      .values({
        code: 'TEST-PAPER-1',
        title: 'Test Paper',
        registeredBy: teacherId,
        filePath: 'papers/test-paper-1.pdf',
        originalFilename: 'test-paper-1.pdf',
        fileSizeBytes: 1024,
        sha256: 'a'.repeat(64),
      })
      .returning({ id: schema.papers.id });

    const paperQId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    await db.insert(schema.questions).values({
      id: paperQId,
      humanCode: 'Q-260101-PHY-002-CCC333',
      paperId: paper.id,
      sourceQno: 1,
      subject: 'physics',
      type: 'mcq',
      status: 'draft',
      body: 'Paper-scoped question 1.',
      options: [
        { key: 'A', body: 'a' },
        { key: 'B', body: 'b' },
      ],
      createdBy: teacherId,
      lastEditedBy: teacherId,
    });

    const { status, body } = await callIngest({
      paperId: paper.id,
      solutions: [{ sourceQno: 1, solution: 'paper-scoped solution', imagePlaceholders: [] }],
    });
    expect(status).toBe(200);
    expect(body.updated).toBe(1);

    const [row] = await db.select().from(schema.questions).where(eq(schema.questions.id, paperQId));
    expect(row.solution).toBe('paper-scoped solution');
  });
});
