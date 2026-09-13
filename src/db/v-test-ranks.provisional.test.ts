import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '@/db/schema';
import type { Db } from '@/db/client';

/**
 * FBR-03: v_test_ranks feeds every cohort statistic (analytics/cohort.ts,
 * analytics/test-by-id.ts, the student-facing rank/percentile on the result
 * page). A provisional (self-service phone-login) attempt must never appear
 * in it — one fake profile would skew every real student's rank and
 * percentile in the same cohort.
 */

const ROOT = path.resolve(import.meta.dirname, '../..');
const MIGRATIONS_DIR = path.join(ROOT, 'drizzle');

describe('v_test_ranks excludes provisional accounts (0006_provisional_accounts)', () => {
  let pg: PGlite;
  let db: Db;

  const teacherId = '11111111-1111-4111-8111-111111111111';
  const realStudentId = '22222222-2222-4222-8222-222222222222';
  const provisionalStudentId = '33333333-3333-4333-8333-333333333333';
  const testId = '44444444-4444-4444-8444-444444444444';

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

    await db.insert(schema.profiles).values([
      {
        id: teacherId,
        username: 'teacher1',
        email: 'teacher1@example.com',
        fullName: 'Teacher One',
        role: 'teacher',
        passwordHash: 'x',
        isActive: true,
        canLogin: true,
      },
      {
        id: realStudentId,
        username: 'real_student',
        email: 'real@example.com',
        fullName: 'Real Student',
        role: 'student',
        isActive: true,
        canLogin: true,
        isProvisional: false,
      },
      {
        id: provisionalStudentId,
        username: 'student_9990001',
        email: 'student_9990001@student.srsma.local',
        fullName: 'Student 0001',
        role: 'student',
        isActive: true,
        canLogin: true,
        isProvisional: true,
      },
    ]);

    await db.insert(schema.tests).values({
      id: testId,
      title: 'Test',
      durationS: 3600,
      maxAttempts: 1,
      isPublished: true,
      createdBy: teacherId,
    });

    await db.insert(schema.attempts).values([
      {
        testId,
        studentId: realStudentId,
        attemptNo: 1,
        deadlineAt: new Date(),
        submittedAt: new Date(),
        status: 'submitted',
        questionOrder: [],
        totalMarks: '50',
      },
      {
        testId,
        studentId: provisionalStudentId,
        attemptNo: 1,
        deadlineAt: new Date(),
        submittedAt: new Date(),
        status: 'submitted',
        questionOrder: [],
        // A very high score — if this leaked into the view it would visibly
        // distort the real student's rank/percentile.
        totalMarks: '999',
      },
    ]);
  });

  afterAll(async () => {
    await pg.close();
  });

  it('only the non-provisional attempt appears in v_test_ranks', async () => {
    const res = await pg.query<{ student_id: string; rank: number; percentile: string }>(
      'SELECT student_id, rank, percentile FROM v_test_ranks WHERE test_id = $1',
      [testId],
    );
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].student_id).toBe(realStudentId);
    // Sole (non-provisional) entrant: rank 1. (percent_rank() is 0 for a
    // single-row partition by definition — (rank-1)/(rows-1) with rows=1 —
    // this is just confirming the provisional row never entered the window.)
    expect(Number(res.rows[0].rank)).toBe(1);
  });
});
