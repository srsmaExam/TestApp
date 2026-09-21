import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '@/db/schema';
import type { Db } from '@/db/client';
import type { Session } from '@/lib/session';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const MIGRATIONS_DIR = path.join(ROOT, 'drizzle');

let pg: PGlite;
let db: Db;
let currentSession: Session;

vi.mock('@/lib/auth', () => ({
  apiStudent: vi.fn(async () => currentSession),
  apiSession: vi.fn(async () => currentSession),
}));

vi.mock('@/db/client', () => ({
  getDb: vi.fn(async () => db),
}));

async function startAttempt(testId: string) {
  const { POST } = await import('./attempts');
  const req = new Request(`http://localhost/api/tests/${testId}/attempts`, { method: 'POST' });
  const res = await POST(req, { params: Promise.resolve({ id: testId }) });
  return { status: res.status, body: await res.json() };
}

describe('Test attempt question ordering and sectional shuffle (Maths -> Physics -> Chemistry -> Biology)', () => {
  const teacherId = '11111111-1111-4111-8111-111111111111';
  const studentId = '22222222-2222-4222-8222-222222222222';

  const shuffledTestId = '33333333-3333-4333-8333-333333333333';
  const nonShuffledTestId = '44444444-4444-4444-8444-444444444444';

  const m1 = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa';
  const m2 = 'aaaaaaaa-2222-4aaa-8aaa-aaaaaaaaaaaa';
  const m3 = 'aaaaaaaa-3333-4aaa-8aaa-aaaaaaaaaaaa';

  const p1 = 'bbbbbbbb-1111-4bbb-8bbb-bbbbbbbbbbbb';
  const p2 = 'bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb';
  const p3 = 'bbbbbbbb-3333-4bbb-8bbb-bbbbbbbbbbbb';

  const c1 = 'cccccccc-1111-4ccc-8ccc-cccccccccccc';
  const c2 = 'cccccccc-2222-4ccc-8ccc-cccccccccccc';
  const c3 = 'cccccccc-3333-4ccc-8ccc-cccccccccccc';

  const b1 = 'dddddddd-1111-4ddd-8ddd-dddddddddddd';
  const b2 = 'dddddddd-2222-4ddd-8ddd-dddddddddddd';
  const b3 = 'dddddddd-3333-4ddd-8ddd-dddddddddddd';

  const mathsIds = new Set([m1, m2, m3]);
  const physicsIds = new Set([p1, p2, p3]);
  const chemistryIds = new Set([c1, c2, c3]);
  const biologyIds = new Set([b1, b2, b3]);

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
    db = drizzle(pg, { schema }) as unknown as Db;

    await db.insert(schema.profiles).values([
      {
        id: teacherId,
        username: 'teacher_shuf',
        email: 'teacher_shuf@example.com',
        fullName: 'Teacher Shuf',
        role: 'teacher',
        passwordHash: 'x',
        isActive: true,
        canLogin: true,
      },
      {
        id: studentId,
        username: 'student_shuf',
        email: 'student_shuf@example.com',
        fullName: 'Student Shuf',
        role: 'student',
        passwordHash: 'x',
        isActive: true,
        canLogin: true,
      },
    ]);

    currentSession = {
      userId: studentId,
      username: 'student_shuf',
      fullName: 'Student Shuf',
      role: 'student',
    };

    const dummyOptions = [
      { key: 'A', body: 'Option A' },
      { key: 'B', body: 'Option B' },
    ];
    const dummyAnswer = { key: 'A' };

    // Insert 3 questions for each of the 4 subjects
    await db.insert(schema.questions).values([
      { id: m1, subject: 'maths', body: 'M1', type: 'mcq', options: dummyOptions, answer: dummyAnswer, status: 'verified' },
      { id: m2, subject: 'maths', body: 'M2', type: 'mcq', options: dummyOptions, answer: dummyAnswer, status: 'verified' },
      { id: m3, subject: 'maths', body: 'M3', type: 'mcq', options: dummyOptions, answer: dummyAnswer, status: 'verified' },

      { id: p1, subject: 'physics', body: 'P1', type: 'mcq', options: dummyOptions, answer: dummyAnswer, status: 'verified' },
      { id: p2, subject: 'physics', body: 'P2', type: 'mcq', options: dummyOptions, answer: dummyAnswer, status: 'verified' },
      { id: p3, subject: 'physics', body: 'P3', type: 'mcq', options: dummyOptions, answer: dummyAnswer, status: 'verified' },

      { id: c1, subject: 'chemistry', body: 'C1', type: 'mcq', options: dummyOptions, answer: dummyAnswer, status: 'verified' },
      { id: c2, subject: 'chemistry', body: 'C2', type: 'mcq', options: dummyOptions, answer: dummyAnswer, status: 'verified' },
      { id: c3, subject: 'chemistry', body: 'C3', type: 'mcq', options: dummyOptions, answer: dummyAnswer, status: 'verified' },

      { id: b1, subject: 'biology', body: 'B1', type: 'mcq', options: dummyOptions, answer: dummyAnswer, status: 'verified' },
      { id: b2, subject: 'biology', body: 'B2', type: 'mcq', options: dummyOptions, answer: dummyAnswer, status: 'verified' },
      { id: b3, subject: 'biology', body: 'B3', type: 'mcq', options: dummyOptions, answer: dummyAnswer, status: 'verified' },
    ]);

    // Test 1: shuffleQuestions = true
    await db.insert(schema.tests).values({
      id: shuffledTestId,
      title: 'Shuffled Test',
      durationS: 3600,
      maxAttempts: 0,
      isPublished: true,
      shuffleQuestions: true,
      createdBy: teacherId,
    });

    // Test 2: shuffleQuestions = false
    await db.insert(schema.tests).values({
      id: nonShuffledTestId,
      title: 'Non-Shuffled Test',
      durationS: 3600,
      maxAttempts: 0,
      isPublished: true,
      shuffleQuestions: false,
      createdBy: teacherId,
    });

    // Assign questions in completely interleaved order
    const interleavedQuestions = [
      { questionId: p1, position: 1 },
      { questionId: b1, position: 2 },
      { questionId: m1, position: 3 },
      { questionId: c1, position: 4 },
      { questionId: p2, position: 5 },
      { questionId: m2, position: 6 },
      { questionId: b2, position: 7 },
      { questionId: c2, position: 8 },
      { questionId: m3, position: 9 },
      { questionId: p3, position: 10 },
      { questionId: c3, position: 11 },
      { questionId: b3, position: 12 },
    ];

    await db.insert(schema.testQuestions).values(
      interleavedQuestions.map((q) => ({
        testId: shuffledTestId,
        questionId: q.questionId,
        position: q.position,
        marksCorrect: '4',
        marksWrong: '-1',
        marksUnattempted: '0',
      })),
    );

    await db.insert(schema.testQuestions).values(
      interleavedQuestions.map((q) => ({
        testId: nonShuffledTestId,
        questionId: q.questionId,
        position: q.position,
        marksCorrect: '4',
        marksWrong: '-1',
        marksUnattempted: '0',
      })),
    );
  });

  afterAll(async () => {
    await pg?.close();
  });

  it('orders questions strictly as Maths -> Physics -> Chemistry -> Biology when shuffleQuestions is true', async () => {
    const res = await startAttempt(shuffledTestId);
    expect(res.status).toBe(201);
    const order: string[] = res.body.questionOrder;
    expect(order).toHaveLength(12);

    // Indices 0..2 must be Maths
    const first3 = order.slice(0, 3);
    expect(first3.every((id) => mathsIds.has(id))).toBe(true);
    expect(new Set(first3).size).toBe(3);

    // Indices 3..5 must be Physics
    const second3 = order.slice(3, 6);
    expect(second3.every((id) => physicsIds.has(id))).toBe(true);
    expect(new Set(second3).size).toBe(3);

    // Indices 6..8 must be Chemistry
    const third3 = order.slice(6, 9);
    expect(third3.every((id) => chemistryIds.has(id))).toBe(true);
    expect(new Set(third3).size).toBe(3);

    // Indices 9..11 must be Biology
    const last3 = order.slice(9, 12);
    expect(last3.every((id) => biologyIds.has(id))).toBe(true);
    expect(new Set(last3).size).toBe(3);
  });

  it('orders questions strictly as Maths -> Physics -> Chemistry -> Biology when shuffleQuestions is false', async () => {
    const res = await startAttempt(nonShuffledTestId);
    expect(res.status).toBe(201);
    const order: string[] = res.body.questionOrder;
    expect(order).toHaveLength(12);

    // Non-shuffled preserves position within each subject:
    // Maths positions were: m1 (3), m2 (6), m3 (9) -> [m1, m2, m3]
    expect(order.slice(0, 3)).toEqual([m1, m2, m3]);

    // Physics positions were: p1 (1), p2 (5), p3 (10) -> [p1, p2, p3]
    expect(order.slice(3, 6)).toEqual([p1, p2, p3]);

    // Chemistry positions were: c1 (4), c2 (8), c3 (11) -> [c1, c2, c3]
    expect(order.slice(6, 9)).toEqual([c1, c2, c3]);

    // Biology positions were: b1 (2), b2 (7), b3 (12) -> [b1, b2, b3]
    expect(order.slice(9, 12)).toEqual([b1, b2, b3]);
  });
});
