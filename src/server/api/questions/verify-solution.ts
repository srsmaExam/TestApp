import { eq } from 'drizzle-orm';
import { apiTeacher } from '@/lib/auth';
import { HttpError, json, withApi } from '@/lib/http';
import { getDb } from '@/db/client';
import { questionImages, questions } from '@/db/schema';
import { extractImageTokens } from '@/lib/question-render';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Verifies or unverifies the worked solution of a question.
 *
 * Requirements for verification:
 * 1. question.solution must be non-empty.
 * 2. Any [[IMG:...]] placeholders referenced in the solution must be resolved in question_images.
 */
export const POST = withApi<Ctx>(async (req, { params }) => {
  const session = await apiTeacher();
  const { id } = await params;

  const db = await getDb();
  const [question] = await db.select().from(questions).where(eq(questions.id, id));
  if (!question) throw new HttpError(404, 'not_found', 'Question not found.');

  const body = await req.json().catch(() => ({}));
  if (body.action === 'unverify') {
    const [updated] = await db
      .update(questions)
      .set({ solutionVerifiedAt: null, solutionVerifiedBy: null })
      .where(eq(questions.id, id))
      .returning();
    return json(updated);
  }

  const reasons: string[] = [];

  if (!question.solution || !question.solution.trim()) {
    reasons.push('No worked solution is provided for this question.');
  } else {
    // Check if solution has unresolved image tokens
    const tokens = extractImageTokens(question.solution);
    if (tokens.length > 0) {
      const images = await db.select().from(questionImages).where(eq(questionImages.questionId, id));
      const resolved = new Set(images.map((i) => i.placeholderId));
      const unresolved = tokens.filter((t) => !resolved.has(t));
      if (unresolved.length > 0) {
        reasons.push(
          `${unresolved.length} solution image placeholder(s) unresolved: ${unresolved
            .map((u) => `[[IMG:${u}]]`)
            .join(', ')}`,
        );
      }
    }
  }

  if (reasons.length > 0) {
    throw new HttpError(422, 'verify_gate_failed', 'This solution cannot be verified yet.', { reasons });
  }

  const [updated] = await db
    .update(questions)
    .set({
      solutionVerifiedAt: new Date(),
      solutionVerifiedBy: session.userId,
    })
    .where(eq(questions.id, id))
    .returning();

  return json(updated);
});
