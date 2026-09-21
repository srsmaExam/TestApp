import { and, eq, sql } from 'drizzle-orm';
import { apiTeacher } from '@/lib/auth';
import { json, withApi } from '@/lib/http';
import { getDb } from '@/db/client';
import { profiles, tests } from '@/db/schema';

export const GET = withApi(async (req) => {
  await apiTeacher();
  const url = new URL(req.url);
  const db = await getDb();

  const enrollmentParam = url.searchParams.get('enrollment')?.trim();
  const enrollment: 'provisional' | 'enrolled' | 'all' =
    enrollmentParam === 'enrolled' || enrollmentParam === 'all'
      ? enrollmentParam
      : 'provisional';

  const profileCondition =
    enrollment === 'provisional'
      ? 'AND p.is_provisional = true'
      : enrollment === 'enrolled'
        ? 'AND p.is_provisional = false'
        : '';

  // Student count
  const studentConditions = [eq(profiles.role, 'student')];
  if (enrollment === 'provisional') {
    studentConditions.push(eq(profiles.isProvisional, true));
  } else if (enrollment === 'enrolled') {
    studentConditions.push(eq(profiles.isProvisional, false));
  }

  const [studentCount] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(profiles)
    .where(and(...studentConditions));

  // Published tests count
  const [testCount] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(tests)
    .where(eq(tests.isPublished, true));

  // Evaluated attempts submitted by this cohort
  const attemptCountRes = await db.$client.query<{ count: number; avg_score: number | null }>(
    `SELECT
       count(a.id)::int as count,
       round(avg(a.total_marks)::numeric, 1) as avg_score
     FROM attempts a
     JOIN profiles p ON p.id = a.student_id
     WHERE a.status <> 'in_progress' AND a.total_marks IS NOT NULL AND p.role = 'student' ${profileCondition}`,
  );
  const totalAttemptsSubmitted = Number(attemptCountRes.rows[0]?.count ?? 0);
  const cohortAvgScore =
    attemptCountRes.rows[0]?.avg_score !== null && attemptCountRes.rows[0]?.avg_score !== undefined
      ? Number(attemptCountRes.rows[0]?.avg_score)
      : null;

  // Class-wide weak chapters for this cohort
  const chapterStatsRes = await db.$client.query<{
    subject: string;
    chapter: string | null;
    total_answers: number;
    correct_answers: number;
    accuracy_pct: number;
  }>(
    `SELECT
       q.subject,
       COALESCE(q.chapter, 'General') as chapter,
       count(aa.question_id) as total_answers,
       count(aa.question_id) FILTER (WHERE aa.is_correct = true) as correct_answers,
       ROUND((count(aa.question_id) FILTER (WHERE aa.is_correct = true)::numeric / NULLIF(count(aa.question_id) FILTER (WHERE aa.response IS NOT NULL), 0)) * 100, 1) as accuracy_pct
     FROM attempt_answers aa
     JOIN attempts a ON a.id = aa.attempt_id
     JOIN questions q ON q.id = aa.question_id
     JOIN profiles p ON p.id = a.student_id
     WHERE a.status <> 'in_progress' AND aa.response IS NOT NULL AND p.role = 'student' ${profileCondition}
     GROUP BY q.subject, COALESCE(q.chapter, 'General')
     HAVING count(aa.question_id) >= 1
     ORDER BY accuracy_pct ASC, total_answers DESC
     LIMIT 10`,
  );

  const weakChapters = chapterStatsRes.rows.map((r) => ({
    subject: r.subject,
    chapter: r.chapter ?? 'General',
    totalAnswers: Number(r.total_answers),
    correctAnswers: Number(r.correct_answers),
    accuracyPct: r.accuracy_pct !== null ? Number(r.accuracy_pct) : 0,
  }));

  // Overall student rankings across all completed tests in this cohort
  // Compute dynamic attempt percentiles partitioned by test_id
  const studentRankingsRes = await db.$client.query<{
    student_id: string;
    full_name: string;
    username: string;
    email: string;
    phone: string | null;
    batch: string | null;
    class_level: string | null;
    city: string | null;
    school: string | null;
    board: string | null;
    is_provisional: boolean;
    tests_taken: number;
    avg_score: number | null;
    avg_percentile: number | null;
    last_attempt_at: string | null;
  }>(
    `WITH ranked_attempts AS (
       SELECT
         a.id AS attempt_id,
         a.test_id,
         a.student_id,
         a.attempt_no,
         a.total_marks,
         a.submitted_at,
         round(
           100 * percent_rank() OVER (
             PARTITION BY a.test_id
             ORDER BY a.total_marks ASC NULLS FIRST
           )::numeric,
           1
         ) AS attempt_percentile
       FROM attempts a
       JOIN profiles p ON p.id = a.student_id
       WHERE a.status <> 'in_progress'
         AND a.total_marks IS NOT NULL
         AND p.role = 'student'
         ${profileCondition}
     )
     SELECT
        p.id as student_id,
        p.full_name,
        p.username,
        p.email,
        p.phone,
        p.batch,
        p.class_level,
        p.city,
        p.school,
        p.board,
        p.is_provisional,
        count(ra.attempt_id)::int as tests_taken,
        ROUND(avg(ra.total_marks)::numeric, 1) as avg_score,
        ROUND(avg(ra.attempt_percentile)::numeric, 1) as avg_percentile,
        max(ra.submitted_at) as last_attempt_at
      FROM profiles p
      LEFT JOIN ranked_attempts ra ON ra.student_id = p.id
      WHERE p.role = 'student' ${profileCondition}
      GROUP BY p.id, p.full_name, p.username, p.email, p.phone, p.batch, p.class_level, p.city, p.school, p.board, p.is_provisional, p.created_at
      ORDER BY (CASE WHEN count(ra.attempt_id) > 0 THEN 0 ELSE 1 END), avg_score DESC NULLS LAST, p.created_at DESC
      LIMIT 100`,
  );

  const studentRankings = studentRankingsRes.rows.map((r) => ({
    studentId: r.student_id,
    fullName: r.full_name,
    username: r.username,
    email: r.email,
    phone: r.phone ?? null,
    batch: r.batch ?? 'General',
    classLevel: r.class_level ?? null,
    city: r.city ?? null,
    school: r.school ?? null,
    board: r.board ?? null,
    isProvisional: r.is_provisional,
    testsTaken: Number(r.tests_taken),
    avgScore: r.avg_score !== null ? Number(r.avg_score) : 0,
    avgPercentile: r.avg_percentile !== null ? Number(r.avg_percentile) : null,
    lastAttemptAt: r.last_attempt_at,
  }));

  // Batch-level performance overview
  const batchStatsRes = await db.$client.query<{
    batch: string | null;
    student_count: number;
    attempt_count: number;
    avg_score: number | null;
    avg_percentile: number | null;
  }>(
    `WITH ranked_attempts AS (
       SELECT
         a.id AS attempt_id,
         a.test_id,
         a.student_id,
         a.attempt_no,
         a.total_marks,
         round(
           100 * percent_rank() OVER (
             PARTITION BY a.test_id
             ORDER BY a.total_marks ASC NULLS FIRST
           )::numeric,
           1
         ) AS attempt_percentile
       FROM attempts a
       JOIN profiles p ON p.id = a.student_id
       WHERE a.status <> 'in_progress'
         AND a.total_marks IS NOT NULL
         AND p.role = 'student'
         ${profileCondition}
     )
     SELECT
        p.batch,
        count(DISTINCT p.id)::int as student_count,
        count(ra.attempt_id)::int as attempt_count,
        ROUND(avg(ra.total_marks)::numeric, 1) as avg_score,
        ROUND(avg(ra.attempt_percentile)::numeric, 1) as avg_percentile
      FROM profiles p
      LEFT JOIN ranked_attempts ra ON ra.student_id = p.id
      WHERE p.role = 'student' ${profileCondition}
      GROUP BY p.batch
      ORDER BY avg_score DESC NULLS LAST, student_count DESC`,
  );

  const batchSummaries = batchStatsRes.rows.map((b) => ({
    batch: b.batch ?? 'General',
    studentCount: Number(b.student_count),
    attemptCount: Number(b.attempt_count),
    avgScore: b.avg_score !== null ? Number(b.avg_score) : 0,
    avgPercentile: b.avg_percentile !== null ? Number(b.avg_percentile) : null,
  }));

  return json({
    metrics: {
      totalStudents: studentCount?.count ?? 0,
      totalPublishedTests: testCount?.count ?? 0,
      totalAttemptsSubmitted,
      avgScore: cohortAvgScore,
    },
    enrollment,
    batchSummaries,
    weakChapters,
    studentRankings,
  });
});
