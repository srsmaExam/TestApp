import { eq } from 'drizzle-orm';
import { apiSession } from '@/lib/auth';
import { HttpError, json, withApi } from '@/lib/http';
import { getDb } from '@/db/client';
import { attemptAnswers, attemptEvents, attempts, tests } from '@/db/schema';
import { gradeAndCloseAttempt } from '@/lib/attempts';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withApi<Ctx>(async (req, { params }) => {
  // apiSession, not requireSession: the page guard calls redirect(), which
  // throws NEXT_REDIRECT — withApi would catch it and answer 500 internal_error
  // instead of 401, leaving the client unable to tell an expired session from a
  // broken server mid-exam.
  const session = await apiSession();
  const { id: attemptId } = await params;
  const db = await getDb();

  const [attempt] = await db.select().from(attempts).where(eq(attempts.id, attemptId));
  if (!attempt) throw new HttpError(404, 'not_found', 'Attempt not found');

  if (session.role === 'student' && attempt.studentId !== session.userId) {
    throw new HttpError(403, 'forbidden', 'You cannot submit another student’s attempt.');
  }

  const [test] = await db.select().from(tests).where(eq(tests.id, attempt.testId));
  if (!test) throw new HttpError(404, 'not_found', 'Test not found');

  const resultsAvailable = test.resultsPolicy === 'immediate' || Boolean(test.releasedAt);

  // An attempt with no pre-seeded answer rows can never be graded meaningfully.
  const seeded = await db
    .select({ questionId: attemptAnswers.questionId })
    .from(attemptAnswers)
    .where(eq(attemptAnswers.attemptId, attemptId))
    .limit(1);

  if (seeded.length === 0) {
    throw new HttpError(422, 'empty_attempt', 'No questions found in this attempt.');
  }

  // A submit landing after the deadline or triggered by the 60s popup auto-submit
  // is recorded as an auto-submit.
  const pastDeadline = Date.now() > new Date(attempt.deadlineAt).getTime();
  const wasAlreadyClosed = attempt.status !== 'in_progress';

  // Read optional final answers from JSON body (enables 1-shot submit)
  const rawBody = await req.text().catch(() => '');
  let body: Record<string, unknown> | null = null;
  try {
    body = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    // Ignore non-JSON or empty bodies
  }

  const finalAnswers = body && Array.isArray(body.answers) ? body.answers : undefined;
  const isAutoSubmitted = Boolean(body?.autoSubmitted) || pastDeadline;

  if (isAutoSubmitted && !wasAlreadyClosed) {
    await db
      .insert(attemptEvents)
      .values({
        attemptId,
        eventType: 'auto_submitted',
        meta: {
          reason: body?.autoSubmitReason || (pastDeadline ? 'deadline_expired' : 'popup_timeout_60s'),
        },
      })
      .catch(() => {});
  }

  // gradeAndCloseAttempt is idempotent on total_marks, so a submit racing the
  // background sweep reads back whichever landed first instead of clobbering it
  // or (as before) returning a hardcoded zero.
  const result = await gradeAndCloseAttempt(
    db,
    attemptId,
    wasAlreadyClosed
      ? (attempt.status as 'submitted' | 'auto_submitted')
      : isAutoSubmitted
        ? 'auto_submitted'
        : 'submitted',
    finalAnswers,
  );

  return json({
    ok: true,
    alreadySubmitted: !result.graded,
    status: result.status,
    totalMarks: result.totalMarks,
    maxMarks: result.maxMarks,
    totalTimeS: result.totalTimeS,
    resultsPolicy: test.resultsPolicy,
    resultsAvailable,
  });
});
