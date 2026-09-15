import { z } from 'zod';
import { eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { attempts, profiles, questions } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { HttpError, json, withApi } from '@/lib/http';

const ReportDetailsSchema = z.object({
  city: z.string().trim().min(1, 'City is required'),
  board: z.string().trim().min(1, 'Board is required'),
  otherBoard: z.string().trim().optional(),
  gender: z.enum(['Male', 'Female'], {
    errorMap: () => ({ message: 'Please select your gender (Male or Female).' }),
  }),
  school: z.string().trim().min(1, 'School name is required'),
  whatsappConsent: z.boolean().refine((val) => val === true, {
    message:
      'I give permission to Shri Ram Smart Minds Academy to contact me on my WhatsApp number for sending the detailed report is mandatory.',
  }),
  attemptId: z.string().uuid().optional(),
});

export const POST = withApi(async (req) => {
  const session = await getSession();
  if (!session || session.role !== 'student') {
    throw new HttpError(401, 'unauthorized', 'Please sign in to submit report details.');
  }

  const body = await req.json().catch(() => ({}));
  const parsed = ReportDetailsSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? 'Invalid report details submitted.';
    throw new HttpError(400, 'invalid_request', issue);
  }

  const { city, board, otherBoard, gender, school, whatsappConsent, attemptId } = parsed.data;
  const effectiveBoard = board === 'Other' ? (otherBoard?.trim() || 'Other') : board;

  const db = await getDb();
  await db
    .update(profiles)
    .set({
      city,
      board: effectiveBoard,
      gender,
      school,
      whatsappConsent,
    })
    .where(eq(profiles.id, session.userId));

  const solutions: Record<string, string | null> = {};

  if (attemptId) {
    const [attempt] = await db
      .select({ questionOrder: attempts.questionOrder })
      .from(attempts)
      .where(eq(attempts.id, attemptId));

    if (attempt && Array.isArray(attempt.questionOrder) && attempt.questionOrder.length > 0) {
      const qRows = await db
        .select({
          id: questions.id,
          solution: questions.solution,
        })
        .from(questions)
        .where(inArray(questions.id, attempt.questionOrder));

      for (const q of qRows) {
        solutions[q.id] = q.solution;
      }
    }
  }

  return json({
    ok: true,
    unlocked: true,
    solutions,
    message: 'Detailed report unlocked! View now or check your WhatsApp.',
  });
});
