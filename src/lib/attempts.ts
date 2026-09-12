import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { attemptAnswers, attempts, questions, testQuestions, tests, type QuestionAnswer } from '@/db/schema';
import { gradeAttempt, type GradingItem } from './grading';
import { withDbLock } from './db-lock';

export type CloseStatus = 'submitted' | 'auto_submitted';

export type CloseAttemptResult = {
  status: CloseStatus;
  totalMarks: number;
  maxMarks: number;
  totalTimeS: number;
  /** false when the attempt was already graded and this call was a no-op. */
  graded: boolean;
};

/**
 * Grades an attempt and closes it, in one transaction.
 *
 * This is the ONLY place an attempt transitions out of `in_progress`. It used
 * to live inline in POST /api/attempts/:id/submit, and the three other paths
 * that close an attempt — the 60s sweep, the sweep invoked opportunistically on
 * every attempt read, and the past-deadline branch of PATCH .../answers — each
 * flipped `status` to 'auto_submitted' WITHOUT scoring. Because submit then
 * short-circuits on an already-closed attempt, whichever path won the race
 * decided whether the student got a score at all: lose it, and the attempt was
 * stuck at 0/0 with every answer discarded and no way to re-grade.
 *
 * Idempotent by `total_marks IS NULL`, so it is safe for the sweep and a
 * student's own submit to both fire — the loser reads back the winner's result
 * instead of overwriting it.
 */
export async function gradeAndCloseAttempt(
  db: Db,
  attemptId: string,
  status: CloseStatus,
  finalAnswers?: AnswerUpdateItem[],
): Promise<CloseAttemptResult> {
  return withDbLock(async () => {
    const [attempt] = await db.select().from(attempts).where(eq(attempts.id, attemptId));
    if (!attempt) throw new Error(`attempt_not_found: ${attemptId}`);

    // Already graded — report what is stored rather than re-scoring.
    if (attempt.totalMarks !== null && attempt.status !== 'in_progress') {
      return {
        status: attempt.status as CloseStatus,
        totalMarks: Number(attempt.totalMarks),
        maxMarks: Number(attempt.maxMarks ?? 0),
        totalTimeS: attempt.totalTimeS ?? 0,
        graded: false,
      };
    }

    // If final answers are provided (from direct submit), persist them in batch before grading
    if (finalAnswers && finalAnswers.length > 0 && attempt.status === 'in_progress') {
      const inAttempt = new Set(attempt.questionOrder);
      const accepted = finalAnswers.filter((a) => inAttempt.has(a.questionId));
      if (accepted.length > 0) {
        await saveAttemptAnswersBatch(db, attemptId, accepted);
      }
    }

    const [test] = await db.select().from(tests).where(eq(tests.id, attempt.testId));
    if (!test) throw new Error(`test_not_found: ${attempt.testId}`);

    const userAnswers = await db.select().from(attemptAnswers).where(eq(attemptAnswers.attemptId, attemptId));

    const qIds = userAnswers.map((ua) => ua.questionId);
    const questionRows =
      qIds.length > 0
        ? await db
            .select({
              id: questions.id,
              type: questions.type,
              answer: questions.answer,
              marksCorrect: testQuestions.marksCorrect,
              marksWrong: testQuestions.marksWrong,
              marksUnattempted: testQuestions.marksUnattempted,
            })
            .from(questions)
            .innerJoin(
              testQuestions,
              and(eq(testQuestions.questionId, questions.id), eq(testQuestions.testId, attempt.testId)),
            )
            .where(inArray(questions.id, qIds))
        : [];

    const qMap = new Map(questionRows.map((q) => [q.id, q]));

    let totalSpentMs = 0;
    const gradingItems: GradingItem[] = [];

    for (const ans of userAnswers) {
      const q = qMap.get(ans.questionId);
      if (!q) continue;

      totalSpentMs += ans.timeSpentMs ?? 0;

      gradingItems.push({
        questionId: ans.questionId,
        type: q.type,
        answerKey: q.answer as QuestionAnswer | null,
        response: ans.response as { key?: string; value?: number | string } | null,
        marksCorrect: Number(q.marksCorrect ?? 4),
        marksWrong: Number(q.marksWrong ?? -1),
        marksUnattempted: Number(q.marksUnattempted ?? 0),
      });
    }

    const gradeResult = gradeAttempt(gradingItems);

    // An auto-submit can land well after the deadline (the sweep runs on a 60s
    // tick), so elapsed time is measured to the deadline, not to now — a
    // student whose tab died at minute 3 of a 180-minute paper should not be
    // recorded as having spent 180 minutes on it.
    const now = new Date();
    const closedAt = status === 'auto_submitted' ? new Date(attempt.deadlineAt) : now;
    const effectiveEnd = Math.min(closedAt.getTime(), now.getTime());
    const elapsedSec = Math.max(0, Math.round((effectiveEnd - new Date(attempt.startedAt).getTime()) / 1000));
    const totalTimeS = Math.min(test.durationS, Math.max(Math.round(totalSpentMs / 1000), elapsedSec));

    await db.transaction(async (tx) => {
      if (gradeResult.items.length > 0) {
        const qIds = gradeResult.items.map((it) => it.questionId);
        await tx
          .update(attemptAnswers)
          .set({
            isCorrect: sql`CASE ${attemptAnswers.questionId}
              ${sql.join(
                gradeResult.items.map((it) =>
                  it.isCorrect === null
                    ? sql`WHEN ${it.questionId} THEN NULL`
                    : it.isCorrect
                      ? sql`WHEN ${it.questionId} THEN TRUE`
                      : sql`WHEN ${it.questionId} THEN FALSE`,
                ),
                sql` `,
              )}
            END`,
            marksAwarded: sql`CASE ${attemptAnswers.questionId}
              ${sql.join(
                gradeResult.items.map((it) => sql`WHEN ${it.questionId} THEN ${String(it.marksAwarded)}::numeric`),
                sql` `,
              )}
            END`,
            updatedAt: now,
          })
          .where(and(eq(attemptAnswers.attemptId, attemptId), inArray(attemptAnswers.questionId, qIds)));
      }

      await tx
        .update(attempts)
        .set({
          status,
          submittedAt: attempt.submittedAt ?? closedAt,
          totalMarks: String(gradeResult.totalMarks),
          maxMarks: String(gradeResult.maxMarks),
          totalTimeS,
        })
        .where(eq(attempts.id, attemptId));
    });

    return {
      status,
      totalMarks: gradeResult.totalMarks,
      maxMarks: gradeResult.maxMarks,
      totalTimeS,
      graded: true,
    };
  });
}

export type AnswerUpdateItem = {
  questionId: string;
  response?: {
    key?: string;
    value?: number | string;
  } | null;
  state?: 'not_seen' | 'seen_unanswered' | 'answered' | 'answered_flagged' | 'flagged_unanswered';
  timeSpentMs?: number;
  visitCount?: number;
};

function normalizeResponse(resp: AnswerUpdateItem['response']): Record<string, unknown> | null {
  if (!resp) return null;
  if (resp.value !== undefined && resp.value !== null && resp.value !== '') {
    const num = Number(resp.value);
    return {
      key: resp.key,
      value: Number.isNaN(num) ? resp.value : num,
    };
  }
  if (resp.key) {
    return { key: resp.key };
  }
  return null;
}

export async function saveAttemptAnswersBatch(
  db: Db,
  attemptId: string,
  items: AnswerUpdateItem[],
  now: Date = new Date(),
): Promise<number> {
  if (items.length === 0) return 0;

  const qIds = items.map((it) => it.questionId);

  // Single item: direct update without CASE overhead
  if (items.length === 1) {
    const it = items[0];
    const updateFields: Record<string, unknown> = { updatedAt: now };

    if (it.response !== undefined) {
      updateFields.response = normalizeResponse(it.response);
    }
    if (it.state !== undefined) {
      updateFields.state = it.state;
    }
    if (it.timeSpentMs !== undefined) {
      updateFields.timeSpentMs = sql`greatest(${attemptAnswers.timeSpentMs}, ${it.timeSpentMs})`;
    }
    if (it.visitCount !== undefined) {
      updateFields.visitCount = sql`greatest(${attemptAnswers.visitCount}, ${it.visitCount})`;
    }

    await db
      .update(attemptAnswers)
      .set(updateFields)
      .where(and(eq(attemptAnswers.attemptId, attemptId), eq(attemptAnswers.questionId, it.questionId)));
    return 1;
  }

  // Multiple items: single atomic batch update using CASE statements
  const responseItems = items.filter((it) => it.response !== undefined);
  const stateItems = items.filter((it) => it.state !== undefined);
  const timeItems = items.filter((it) => it.timeSpentMs !== undefined);
  const visitItems = items.filter((it) => it.visitCount !== undefined);

  const updateFields: Record<string, unknown> = { updatedAt: now };

  if (responseItems.length > 0) {
    updateFields.response = sql`CASE ${attemptAnswers.questionId}
      ${sql.join(
        responseItems.map((it) => {
          const norm = normalizeResponse(it.response);
          return norm === null
            ? sql`WHEN ${it.questionId} THEN NULL::jsonb`
            : sql`WHEN ${it.questionId} THEN ${JSON.stringify(norm)}::jsonb`;
        }),
        sql` `,
      )}
      ELSE ${attemptAnswers.response}
    END`;
  }

  if (stateItems.length > 0) {
    updateFields.state = sql`CASE ${attemptAnswers.questionId}
      ${sql.join(
        stateItems.map((it) => sql`WHEN ${it.questionId} THEN ${it.state}::answer_state`),
        sql` `,
      )}
      ELSE ${attemptAnswers.state}
    END`;
  }

  if (timeItems.length > 0) {
    updateFields.timeSpentMs = sql`CASE ${attemptAnswers.questionId}
      ${sql.join(
        timeItems.map((it) => sql`WHEN ${it.questionId} THEN greatest(${attemptAnswers.timeSpentMs}, ${it.timeSpentMs})`),
        sql` `,
      )}
      ELSE ${attemptAnswers.timeSpentMs}
    END`;
  }

  if (visitItems.length > 0) {
    updateFields.visitCount = sql`CASE ${attemptAnswers.questionId}
      ${sql.join(
        visitItems.map((it) => sql`WHEN ${it.questionId} THEN greatest(${attemptAnswers.visitCount}, ${it.visitCount})`),
        sql` `,
      )}
      ELSE ${attemptAnswers.visitCount}
    END`;
  }

  await db
    .update(attemptAnswers)
    .set(updateFields)
    .where(and(eq(attemptAnswers.attemptId, attemptId), inArray(attemptAnswers.questionId, qIds)));

  return items.length;
}

/**
 * Regrades all completed/submitted attempts for a test.
 * Used when a teacher modifies the marking scheme for a test that already has student attempts,
 * ensuring all students immediately see their scores recalculated according to the new scheme.
 */
export async function regradeTestAttempts(db: Db, testId: string): Promise<number> {
  return withDbLock(async () => {
    const attemptRows = await db
      .select({ id: attempts.id })
      .from(attempts)
      .where(and(eq(attempts.testId, testId), sql`${attempts.status} <> 'in_progress'`));

    if (attemptRows.length === 0) return 0;

    const questionRows = await db
      .select({
        id: questions.id,
        type: questions.type,
        answer: questions.answer,
        marksCorrect: testQuestions.marksCorrect,
        marksWrong: testQuestions.marksWrong,
        marksUnattempted: testQuestions.marksUnattempted,
      })
      .from(questions)
      .innerJoin(
        testQuestions,
        and(eq(testQuestions.questionId, questions.id), eq(testQuestions.testId, testId)),
      );

    const qMap = new Map(questionRows.map((q) => [q.id, q]));

    for (const att of attemptRows) {
      const userAnswers = await db
        .select()
        .from(attemptAnswers)
        .where(eq(attemptAnswers.attemptId, att.id));

      const gradingItems: GradingItem[] = [];
      for (const ans of userAnswers) {
        const q = qMap.get(ans.questionId);
        if (!q) continue;

        gradingItems.push({
          questionId: ans.questionId,
          type: q.type,
          answerKey: q.answer as QuestionAnswer | null,
          response: ans.response as { key?: string; value?: number | string } | null,
          marksCorrect: Number(q.marksCorrect ?? 4),
          marksWrong: Number(q.marksWrong ?? -1),
          marksUnattempted: Number(q.marksUnattempted ?? 0),
        });
      }

      const gradeResult = gradeAttempt(gradingItems);
      const now = new Date();

      await db.transaction(async (tx) => {
        if (gradeResult.items.length > 0) {
          const qIds = gradeResult.items.map((it) => it.questionId);
          await tx
            .update(attemptAnswers)
            .set({
              isCorrect: sql`CASE ${attemptAnswers.questionId}
                ${sql.join(
                  gradeResult.items.map((it) =>
                    it.isCorrect === null
                      ? sql`WHEN ${it.questionId} THEN NULL`
                      : it.isCorrect
                        ? sql`WHEN ${it.questionId} THEN TRUE`
                        : sql`WHEN ${it.questionId} THEN FALSE`,
                  ),
                  sql` `,
                )}
              END`,
              marksAwarded: sql`CASE ${attemptAnswers.questionId}
                ${sql.join(
                  gradeResult.items.map((it) => sql`WHEN ${it.questionId} THEN ${String(it.marksAwarded)}::numeric`),
                  sql` `,
                )}
              END`,
              updatedAt: now,
            })
            .where(and(eq(attemptAnswers.attemptId, att.id), inArray(attemptAnswers.questionId, qIds)));
        }

        await tx
          .update(attempts)
          .set({
            totalMarks: String(gradeResult.totalMarks),
            maxMarks: String(gradeResult.maxMarks),
          })
          .where(eq(attempts.id, att.id));
      });
    }

    return attemptRows.length;
  });
}


