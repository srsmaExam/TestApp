import { eq } from 'drizzle-orm';
import { apiSessionFast } from '@/lib/auth';
import { HttpError, json, withApi } from '@/lib/http';
import { getDb } from '@/db/client';
import { attempts } from '@/db/schema';
import { loadAttemptQuestions } from '@/lib/attempt-questions';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withApi<Ctx>(async (req, { params }) => {
  // apiSession, not requireSession — the latter redirects, which withApi turns
  // into a 500 rather than a 401.
  const session = await apiSessionFast();
  const { id: attemptId } = await params;
  const db = await getDb();

  const [attempt] = await db
    .select({
      id: attempts.id,
      testId: attempts.testId,
      studentId: attempts.studentId,
      questionOrder: attempts.questionOrder,
      optionOrders: attempts.optionOrders,
    })
    .from(attempts)
    .where(eq(attempts.id, attemptId));
  if (!attempt) {
    throw new HttpError(404, 'not_found', 'Attempt not found');
  }

  if (session.role === 'student' && attempt.studentId !== session.userId) {
    throw new HttpError(403, 'forbidden', 'You cannot view another student’s attempt.');
  }

  return json(await loadAttemptQuestions(db, attemptId, attempt));
});
