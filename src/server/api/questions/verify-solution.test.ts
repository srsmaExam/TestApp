import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '@/db/schema';
import type { Db } from '@/db/client';

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

async function callVerifySolution(questionId: string, body: unknown = {}) {
  const { POST } = await import('./verify-solution');
  const req = new Request(`http://localhost/api/questions/${questionId}/verify-solution`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const res = await POST(req, { params: Promise.resolve({ id: questionId }) } as never);
  return { status: res.status, body: await res.json() };
}

describe('POST /api/questions/[id]/verify-solution', () => {
  const qWithoutSolution = '11111111-1111-4111-8111-111111111111';
  const qWithUnresolvedImg = '22222222-2222-4222-8222-222222222222';
  const qValidSolution = '33333333-3333-4333-8333-333333333333';

  beforeAll(async () => {
    pg = await PGlite.create();
    const files = fs
      .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.sql'))
      .map((e) => e.name)
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await pg.exec(sql);
    }

    db = drizzle(pg, { schema }) as Db;

    // Seed teacher profile
    await db.insert(schema.profiles).values({
      id: teacherId,
      username: 'teacher1',
      fullName: 'Teacher One',
      email: 'teacher1@srsma.edu',
      role: 'teacher',
      passwordHash: 'hash',
    });

    // Seed test questions
    await db.insert(schema.questions).values([
      {
        id: qWithoutSolution,
        subject: 'physics',
        type: 'mcq',
        body: 'Question with no solution',
        options: [{ key: 'A', body: 'Option A' }, { key: 'B', body: 'Option B' }],
        answer: { key: 'A' },
        solution: null,
      },
      {
        id: qWithUnresolvedImg,
        subject: 'physics',
        type: 'mcq',
        body: 'Question with unresolved solution image',
        options: [{ key: 'A', body: 'Option A' }, { key: 'B', body: 'Option B' }],
        answer: { key: 'A' },
        solution: 'Step 1: Refer to diagram [[IMG:sol_diag1]]',
      },
      {
        id: qValidSolution,
        subject: 'physics',
        type: 'mcq',
        body: 'Question with valid solution',
        options: [{ key: 'A', body: 'Option A' }, { key: 'B', body: 'Option B' }],
        answer: { key: 'A' },
        solution: 'Step 1: Calculate energy $E = mc^2$',
      },
    ]);
  });

  afterAll(async () => {
    await pg.close();
  });

  it('rejects verification if question has no solution (422)', async () => {
    const res = await callVerifySolution(qWithoutSolution);
    expect(res.status).toBe(422);
    expect(res.body.reasons).toContain('No worked solution is provided for this question.');
  });

  it('rejects verification if solution has unresolved images (422)', async () => {
    const res = await callVerifySolution(qWithUnresolvedImg);
    expect(res.status).toBe(422);
    expect(res.body.reasons.some((r: string) => r.includes('sol_diag1'))).toBe(true);
  });

  it('successfully verifies a question with a valid solution (200)', async () => {
    const res = await callVerifySolution(qValidSolution);
    expect(res.status).toBe(200);
    expect(res.body.solutionVerifiedAt).toBeTruthy();
    expect(res.body.solutionVerifiedBy).toBe(teacherId);
  });

  it('supports unverifying a solution (200)', async () => {
    const res = await callVerifySolution(qValidSolution, { action: 'unverify' });
    expect(res.status).toBe(200);
    expect(res.body.solutionVerifiedAt).toBeNull();
    expect(res.body.solutionVerifiedBy).toBeNull();
  });
});
