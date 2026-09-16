import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import type { Db } from '@/db/client';
import type { Session } from '@/lib/session';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const MIGRATIONS_DIR = path.join(ROOT, 'drizzle');

let pg: PGlite;
let db: Db;
let teacherSession: Session;

vi.mock('@/lib/auth', () => ({
  apiTeacher: vi.fn(async () => teacherSession),
  apiSession: vi.fn(async () => teacherSession),
}));

vi.mock('@/db/client', () => ({
  getDb: vi.fn(async () => db),
}));

async function patchTest(testId: string, payload: Record<string, unknown>) {
  const { PATCH } = await import('./by-id');
  const req = new Request(`http://localhost/api/tests/${testId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const res = await PATCH(req, { params: Promise.resolve({ id: testId }) });
  return { status: res.status, body: await res.json() };
}

describe('PATCH /api/tests/:id maxAttempts editable after attempts exist', () => {
  const teacherId = '11111111-1111-4111-8111-111111111111';
  const studentId = '22222222-2222-4222-8222-222222222222';
  const testId = '33333333-3333-4333-8333-333333333333';
  const attemptId = '44444444-4444-4444-8444-444444444444';

  beforeAll(async () => {
    pg = await PGlite.create();
    db = drizzle(pg, { schema }) as unknown as Db;

    const migrationFiles = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await pg.exec(sql);
    }

    teacherSession = {
      sub: teacherId,
      userId: teacherId,
      role: 'teacher',
      username: 'teacher1',
      fullName: 'Teacher',
      tokenVersion: 1,
    } as Session;

    await db.insert(schema.profiles).values([
      {
        id: teacherId,
        username: 'teacher1',
        email: 'teacher1@example.com',
        fullName: 'Teacher',
        role: 'teacher',
        passwordHash: 'x',
        isActive: true,
        canLogin: true,
      },
      {
        id: studentId,
        username: 'student1',
        email: 'student1@example.com',
        fullName: 'Student',
        role: 'student',
        passwordHash: 'x',
        isActive: true,
        canLogin: true,
      },
    ]);

    await db.insert(schema.tests).values({
      id: testId,
      title: 'Practice Test',
      createdBy: teacherId,
      durationS: 3600,
      maxAttempts: 1,
      isPublished: true,
      resultsPolicy: 'immediate',
    });

    // Create an existing student attempt
    await db.insert(schema.attempts).values({
      id: attemptId,
      testId,
      studentId,
      attemptNo: 1,
      deadlineAt: new Date(Date.now() + 3600 * 1000),
      questionOrder: [],
      status: 'submitted',
      submittedAt: new Date(),
    });
  });

  afterAll(async () => {
    await pg?.close();
  });

  it('allows changing maxAttempts to 2 when student attempts exist', async () => {
    const res = await patchTest(testId, { maxAttempts: 2 });
    expect(res.status).toBe(200);
    expect(res.body.maxAttempts).toBe(2);

    const [testInDb] = await db.select().from(schema.tests).where(eq(schema.tests.id, testId));
    expect(testInDb.maxAttempts).toBe(2);
  });

  it('allows changing maxAttempts to 0 (unlimited retakes) when student attempts exist', async () => {
    const res = await patchTest(testId, { maxAttempts: 0 });
    expect(res.status).toBe(200);
    expect(res.body.maxAttempts).toBe(0);

    const [testInDb] = await db.select().from(schema.tests).where(eq(schema.tests.id, testId));
    expect(testInDb.maxAttempts).toBe(0);
  });

  it('allows changing durationS when student attempts exist', async () => {
    const res = await patchTest(testId, { durationS: 1800 });
    expect(res.status).toBe(200);
    expect(res.body.durationS).toBe(1800);

    const [testInDb] = await db.select().from(schema.tests).where(eq(schema.tests.id, testId));
    expect(testInDb.durationS).toBe(1800);
  });

  it('allows changing shuffleQuestions and shuffleOptions when student attempts exist', async () => {
    const res = await patchTest(testId, { shuffleQuestions: true, shuffleOptions: true });
    expect(res.status).toBe(200);
    expect(res.body.shuffleQuestions).toBe(true);
    expect(res.body.shuffleOptions).toBe(true);

    const [testInDb] = await db.select().from(schema.tests).where(eq(schema.tests.id, testId));
    expect(testInDb.shuffleQuestions).toBe(true);
    expect(testInDb.shuffleOptions).toBe(true);
  });
});
