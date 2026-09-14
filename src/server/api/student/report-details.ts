import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { profiles } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { HttpError, json, withApi } from '@/lib/http';

const ReportDetailsSchema = z.object({
  city: z.string().trim().min(1, 'City is required'),
  board: z.string().trim().min(1, 'Board is required'),
  otherBoard: z.string().trim().optional(),
  whatsappConsent: z.boolean().default(true),
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

  const { city, board, otherBoard, whatsappConsent } = parsed.data;
  const effectiveBoard = board === 'Other' ? (otherBoard?.trim() || 'Other') : board;

  const db = await getDb();
  await db
    .update(profiles)
    .set({
      city,
      board: effectiveBoard,
      whatsappConsent,
    })
    .where(eq(profiles.id, session.userId));

  return json({
    ok: true,
    message: 'Detailed report request received! Your report will be sent to your WhatsApp.',
  });
});
