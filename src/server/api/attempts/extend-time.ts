import { eq } from 'drizzle-orm';
import { apiSession } from '@/lib/auth';
import { HttpError, json, withApi } from '@/lib/http';
import { getDb } from '@/db/client';
import { attemptEvents, attempts } from '@/db/schema';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withApi<Ctx>(async (_req, { params }) => {
  const session = await apiSession();
  if (!session) {
    throw new HttpError(401, 'unauthorized', 'Please sign in to extend exam time.');
  }

  const { id: attemptId } = await params;
  const db = await getDb();

  const [attempt] = await db.select().from(attempts).where(eq(attempts.id, attemptId));
  if (!attempt) {
    throw new HttpError(404, 'not_found', 'Attempt not found');
  }

  if (session.role === 'student' && attempt.studentId !== session.userId) {
    throw new HttpError(403, 'forbidden', 'You cannot extend another student’s attempt.');
  }

  const currentCount = attempt.timeExtensionsCount ?? 0;
  if (currentCount >= 2) {
    throw new HttpError(
      400,
      'max_extensions_reached',
      'Maximum 2 time extensions (10 minutes each) have already been granted for this test.',
    );
  }

  const currentDeadlineMs = new Date(attempt.deadlineAt).getTime();
  const isRecentlyAutoSubmitted =
    attempt.status === 'auto_submitted' && Date.now() - currentDeadlineMs < 180_000;

  if (attempt.status !== 'in_progress' && !isRecentlyAutoSubmitted) {
    throw new HttpError(400, 'attempt_closed', 'This attempt is no longer in progress.');
  }

  // Extend by 10 minutes (600,000 ms) from current deadline or now, whichever is greater
  const baseMs = Math.max(Date.now(), currentDeadlineMs);
  const newDeadline = new Date(baseMs + 10 * 60 * 1000);
  const nextCount = currentCount + 1;

  await db
    .update(attempts)
    .set({
      status: 'in_progress',
      submittedAt: null,
      deadlineAt: newDeadline,
      timeExtensionsCount: nextCount,
    })
    .where(eq(attempts.id, attemptId));

  // Log audit event
  await db
    .insert(attemptEvents)
    .values({
      attemptId,
      eventType: 'time_extended',
      meta: {
        extensionNumber: nextCount,
        addedMinutes: 10,
        newDeadline: newDeadline.toISOString(),
      },
    })
    .catch(() => {});

  return json({
    ok: true,
    deadlineAt: newDeadline.toISOString(),
    timeExtensionsCount: nextCount,
    remainingExtensions: 2 - nextCount,
  });
});
