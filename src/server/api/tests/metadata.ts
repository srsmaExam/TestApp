import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { apiTeacher } from '@/lib/auth';
import { HttpError, json, withApi } from '@/lib/http';
import { getDb } from '@/db/client';
import { questions, testQuestions, tests, type QuestionMetadata } from '@/db/schema';
import { withDbLock } from '@/lib/db-lock';

type Ctx = { params: Promise<{ id: string }> };

const putMetadataSchema = z.object({
  questions: z.array(
    z.object({
      questionId: z.string().uuid(),
      chapter: z.string().trim().max(200).nullable().optional(),
      topic: z.string().trim().max(200).nullable().optional(),
      difficulty: z.number().int().min(1).max(10).nullable().optional(),
      expectedTimeS: z.number().int().positive().nullable().optional(),
      metadata: z.record(z.unknown()).nullable().optional(),
    }),
  ),
});

/**
 * PUT /api/tests/:id/metadata
 * Bulk updates profiling metadata, chapters, topics, difficulty, and expected time
 * across questions in a test.
 */
export const PUT = withApi<Ctx>(async (req, { params }) => {
  const session = await apiTeacher();
  const { id: testId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = putMetadataSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(422, 'validation_failed', 'Invalid metadata payload', {
      issues: parsed.error.issues,
    });
  }

  const db = await getDb();
  const [test] = await db.select().from(tests).where(eq(tests.id, testId));
  if (!test) throw new HttpError(404, 'not_found', 'Test not found');

  const list = parsed.data.questions;
  if (list.length === 0) {
    return json({ ok: true, count: 0 });
  }

  const qIds = list.map((q) => q.questionId);

  // Verify all questions belong to this test
  const assigned = await db
    .select({ questionId: testQuestions.questionId })
    .from(testQuestions)
    .where(eq(testQuestions.testId, testId));

  const assignedSet = new Set(assigned.map((a) => a.questionId));
  const unassigned = qIds.filter((qid) => !assignedSet.has(qid));
  if (unassigned.length > 0) {
    throw new HttpError(400, 'unassigned_questions', 'Some questions do not belong to this test.', {
      unassigned,
    });
  }

  // Fetch current question records to merge metadata gracefully
  const currentQuestions = await db
    .select({
      id: questions.id,
      metadata: questions.metadata,
      chapter: questions.chapter,
      topic: questions.topic,
      difficulty: questions.difficulty,
      expectedTimeS: questions.expectedTimeS,
    })
    .from(questions)
    .where(inArray(questions.id, qIds));

  const currentMap = new Map(currentQuestions.map((q) => [q.id, q]));

  await withDbLock(async () => {
    await db.transaction(async (tx) => {
      for (const item of list) {
        const current = currentMap.get(item.questionId);
        if (!current) continue;

        const mergedMeta: QuestionMetadata = {
          ...(current.metadata || {}),
          ...(item.metadata || {}),
        };

        await tx
          .update(questions)
          .set({
            chapter: item.chapter !== undefined ? item.chapter : current.chapter,
            topic: item.topic !== undefined ? item.topic : current.topic,
            difficulty: item.difficulty !== undefined ? item.difficulty : current.difficulty,
            expectedTimeS: item.expectedTimeS !== undefined ? item.expectedTimeS : current.expectedTimeS,
            metadata: mergedMeta,
            updatedAt: new Date(),
            lastEditedBy: session.userId,
          })
          .where(eq(questions.id, item.questionId));
      }
    });
  });

  return json({ ok: true, count: list.length });
});
