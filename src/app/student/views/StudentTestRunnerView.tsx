import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { requireStudent } from '@/lib/auth';
import { getDb } from '@/db/client';
import { attempts, profiles, tests } from '@/db/schema';
import { TestRunnerClient } from '../attempts/[id]/TestRunnerClient';

export async function StudentTestRunnerView({ attemptId }: { attemptId: string }) {
  const session = await requireStudent();
  const db = await getDb();

  // Check if report has been unlocked by this student
  let isReportUnlocked = false;
  try {
    const [profile] = await db
      .select({
        whatsappConsent: profiles.whatsappConsent,
        city: profiles.city,
      })
      .from(profiles)
      .where(eq(profiles.id, session.userId));

    isReportUnlocked = Boolean(
      session.role === 'teacher' || (profile && profile.whatsappConsent && profile.city),
    );
  } catch {
    isReportUnlocked = false;
  }

  const [attempt] = await db
    .select({
      id: attempts.id,
      testId: attempts.testId,
      studentId: attempts.studentId,
      status: attempts.status,
      startedAt: attempts.startedAt,
      deadlineAt: attempts.deadlineAt,
      timeExtensionsCount: attempts.timeExtensionsCount,
      questionOrder: attempts.questionOrder,
      totalMarks: attempts.totalMarks,
      testTitle: tests.title,
      durationS: tests.durationS,
      resultsPolicy: tests.resultsPolicy,
      releasedAt: tests.releasedAt,
    })
    .from(attempts)
    .innerJoin(tests, eq(tests.id, attempts.testId))
    .where(eq(attempts.id, attemptId));

  if (!attempt) notFound();

  if (attempt.studentId !== session.userId) {
    notFound();
  }

  if (attempt.status !== 'in_progress') {
    redirect(`/student/attempts/${attemptId}/result`);
  }

  const displayTitle =
    !isReportUnlocked && attempt.testTitle.toLowerCase().includes('set a')
      ? 'Board Readiness Challenge'
      : attempt.testTitle;

  return (
    <TestRunnerClient
      attemptId={attempt.id}
      testTitle={displayTitle}
      deadlineAt={attempt.deadlineAt.toISOString()}
      studentName={session.fullName}
      serverTime={new Date().toISOString()}
      initialExtensionsCount={attempt.timeExtensionsCount ?? 0}
    />
  );
}
