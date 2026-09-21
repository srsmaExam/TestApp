import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { studentFeedback } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { HttpError, json, withApi } from '@/lib/http';

const FeedbackSchema = z.object({
  attemptId: z.string().uuid().optional().nullable(),
  testId: z.string().uuid().optional().nullable(),
  testRating: z.number().int().min(1).max(5).optional().nullable(),
  reportRating: z.number().int().min(1).max(5).optional().nullable(),
  feedbackText: z.string().max(2000).optional().nullable(),
  sourceTab: z.enum(['report', 'solutions']).optional().nullable(),
});

export const POST = withApi(async (req) => {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new HttpError(401, 'unauthorized', 'Please sign in to submit feedback.');
  }

  const body = await req.json().catch(() => ({}));
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? 'Invalid feedback payload.';
    throw new HttpError(400, 'invalid_request', issue);
  }

  const {
    attemptId,
    testId,
    testRating,
    reportRating,
    feedbackText,
    sourceTab = 'report',
  } = parsed.data;

  if (!testRating && !reportRating && (!feedbackText || !feedbackText.trim())) {
    throw new HttpError(400, 'invalid_request', 'Please provide a rating or feedback comments.');
  }

  const db = await getDb();

  // Check if an existing feedback row exists for this student and attempt
  if (attemptId) {
    const [existing] = await db
      .select()
      .from(studentFeedback)
      .where(
        and(
          eq(studentFeedback.studentId, session.userId),
          eq(studentFeedback.attemptId, attemptId),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(studentFeedback)
        .set({
          testRating: testRating !== undefined ? testRating : existing.testRating,
          reportRating: reportRating !== undefined ? reportRating : existing.reportRating,
          feedbackText: feedbackText !== undefined ? feedbackText : existing.feedbackText,
          sourceTab: sourceTab ?? existing.sourceTab,
          updatedAt: new Date(),
        })
        .where(eq(studentFeedback.id, existing.id));

      return json({
        ok: true,
        id: existing.id,
        updated: true,
        message: 'Feedback updated successfully. Thank you!',
      });
    }
  }

  const [inserted] = await db
    .insert(studentFeedback)
    .values({
      studentId: session.userId,
      attemptId: attemptId || null,
      testId: testId || null,
      testRating: testRating || null,
      reportRating: reportRating || null,
      feedbackText: feedbackText?.trim() || null,
      sourceTab: sourceTab || 'report',
    })
    .returning({ id: studentFeedback.id });

  return json({
    ok: true,
    id: inserted?.id,
    created: true,
    message: 'Feedback received! Thank you for helping us improve.',
  });
});

export const GET = withApi(async (req) => {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new HttpError(401, 'unauthorized', 'Please sign in.');
  }

  const url = new URL(req.url);
  const attemptId = url.searchParams.get('attemptId');

  const db = await getDb();

  const conditions = [eq(studentFeedback.studentId, session.userId)];
  if (attemptId) {
    conditions.push(eq(studentFeedback.attemptId, attemptId));
  }

  const [feedback] = await db
    .select({
      id: studentFeedback.id,
      testRating: studentFeedback.testRating,
      reportRating: studentFeedback.reportRating,
      feedbackText: studentFeedback.feedbackText,
      sourceTab: studentFeedback.sourceTab,
      updatedAt: studentFeedback.updatedAt,
    })
    .from(studentFeedback)
    .where(and(...conditions))
    .orderBy(desc(studentFeedback.updatedAt))
    .limit(1);

  return json({
    ok: true,
    feedback: feedback || null,
  });
});
