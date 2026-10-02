import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { profiles, studentFeedback, tests } from '@/db/schema';
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
  const db = await getDb();

  // If teacher, return all student feedback with profile and test info
  if (session.role === 'teacher') {
    const targetStudentId = url.searchParams.get('studentId');
    const conditions = [];
    if (targetStudentId) {
      conditions.push(eq(studentFeedback.studentId, targetStudentId));
    }

    const rows = await db
      .select({
        id: studentFeedback.id,
        studentId: studentFeedback.studentId,
        studentName: profiles.fullName,
        studentPhone: profiles.phone,
        studentBatch: profiles.batch,
        studentClassLevel: profiles.classLevel,
        testId: studentFeedback.testId,
        testTitle: tests.title,
        attemptId: studentFeedback.attemptId,
        testRating: studentFeedback.testRating,
        reportRating: studentFeedback.reportRating,
        feedbackText: studentFeedback.feedbackText,
        sourceTab: studentFeedback.sourceTab,
        createdAt: studentFeedback.createdAt,
        updatedAt: studentFeedback.updatedAt,
      })
      .from(studentFeedback)
      .leftJoin(profiles, eq(studentFeedback.studentId, profiles.id))
      .leftJoin(tests, eq(studentFeedback.testId, tests.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(studentFeedback.updatedAt))
      .limit(300);

    return json({
      ok: true,
      feedback: rows,
    });
  }

  // Student flow: retrieve own feedback for an attempt
  const attemptId = url.searchParams.get('attemptId');
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

export const DELETE = withApi(async (req) => {
  const session = await getSession();
  if (!session || !session.userId || session.role !== 'teacher') {
    throw new HttpError(403, 'forbidden', 'Only teachers can delete student feedback.');
  }

  const url = new URL(req.url);
  let id = url.searchParams.get('id');
  if (!id) {
    const body = await req.json().catch(() => ({}));
    id = body.id;
  }

  if (!id) {
    throw new HttpError(400, 'invalid_request', 'Feedback ID is required.');
  }

  const db = await getDb();
  await db.delete(studentFeedback).where(eq(studentFeedback.id, id));

  return json({
    ok: true,
    deleted: true,
    message: 'Feedback deleted successfully.',
  });
});
