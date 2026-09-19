import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
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

async function putMetadata(testId: string, payload: Record<string, unknown>) {
  const { PUT } = await import('./metadata');
  const req = new Request(`http://localhost/api/tests/${testId}/metadata`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const res = await PUT(req, { params: Promise.resolve({ id: testId }) });
  return { status: res.status, body: await res.json() };
}

describe('PUT /api/tests/:id/metadata', () => {
  const teacherId = '11111111-1111-4111-8111-111111111111';
  const testId = '33333333-3333-4333-8333-333333333333';
  const qId1 = '44444444-4444-4444-8444-444444444441';
  const qId2 = '44444444-4444-4444-8444-444444444442';

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

    await db.insert(schema.profiles).values({
      id: teacherId,
      username: 'teacher1',
      email: 'teacher1@example.com',
      fullName: 'Test Teacher',
      role: 'teacher',
      passwordHash: 'x',
      isActive: true,
      canLogin: true,
    });

    await db.insert(schema.tests).values({
      id: testId,
      title: 'Board Challenge Test',
      durationS: 3600,
      opensAt: new Date(Date.now() - 60000),
      closesAt: new Date(Date.now() + 86400000),
      maxAttempts: 1,
      resultsPolicy: 'immediate',
      createdBy: teacherId,
    });

    await db.insert(schema.questions).values([
      {
        id: qId1,
        humanCode: 'Q1',
        subject: 'maths',
        type: 'mcq',
        body: 'What is 2 + 2?',
        status: 'verified',
        options: [
          { key: 'A', body: '4' },
          { key: 'B', body: '5' },
        ],
        answer: { key: 'A' },
        difficulty: 1,
        expectedTimeS: 45,
        chapter: 'Arithmetic',
        topic: 'Addition',
        metadata: {
          primarySkill: 'Calculation',
          diagnosticWeight: 1,
        },
      },
      {
        id: qId2,
        humanCode: 'Q2',
        subject: 'physics',
        type: 'mcq',
        body: 'Speed of light?',
        status: 'verified',
        options: [
          { key: 'A', body: '3x10^8' },
          { key: 'B', body: '3x10^6' },
        ],
        answer: { key: 'A' },
        difficulty: 2,
        expectedTimeS: 60,
        chapter: 'Optics',
        topic: 'Light Speed',
        metadata: {
          primarySkill: 'Formula Recall',
          diagnosticWeight: 2,
        },
      },
    ]);

    await db.insert(schema.testQuestions).values([
      { testId, questionId: qId1, position: 1 },
      { testId, questionId: qId2, position: 2 },
    ]);
  });

  afterAll(async () => {
    await pg.close();
  });

  it('updates metadata, chapters, and profiling across test questions', async () => {
    const payload = {
      questions: [
        {
          questionId: qId1,
          chapter: 'Advanced Arithmetic',
          topic: 'Rapid Sums',
          difficulty: 2,
          expectedTimeS: 30,
          metadata: {
            primarySkill: 'Concept Application',
            cognitiveLevel: 'Application',
            conceptTested: 'Addition property',
            diagnosticWeight: 3,
          },
        },
      ],
    };

    const res = await putMetadata(testId, payload);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.count).toBe(1);

    const [updatedQ1] = await db.select().from(schema.questions).where(eq(schema.questions.id, qId1));
    expect(updatedQ1.chapter).toBe('Advanced Arithmetic');
    expect(updatedQ1.topic).toBe('Rapid Sums');
    expect(updatedQ1.difficulty).toBe(2);
    expect(updatedQ1.expectedTimeS).toBe(30);
    expect(updatedQ1.metadata?.primarySkill).toBe('Concept Application');
    expect(updatedQ1.metadata?.diagnosticWeight).toBe(3);
    expect(updatedQ1.lastEditedBy).toBe(teacherId);
  });

  it('rejects update if question is not in test', async () => {
    const foreignQid = '55555555-5555-5555-8555-555555555555';
    const payload = {
      questions: [{ questionId: foreignQid, metadata: { primarySkill: 'Test' } }],
    };

    const res = await putMetadata(testId, payload);
    expect(res.status).toBe(400);
  });
});
