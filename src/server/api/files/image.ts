import { eq, and } from 'drizzle-orm';
import { apiSession } from '@/lib/auth';
import { HttpError, withApi } from '@/lib/http';
import { getDb } from '@/db/client';
import { attemptAnswers, attempts, questionImages } from '@/db/schema';
import { getFileMetadata, readFileRecord } from '@/lib/storage';

type Ctx = { params: Promise<{ questionId: string; placeholder: string }> };

export const GET = withApi<Ctx>(async (req, { params }) => {
  const session = await apiSession();
  const { questionId, placeholder } = await params;

  const db = await getDb();
  const [image] = await db
    .select({ storagePath: questionImages.storagePath })
    .from(questionImages)
    .where(and(eq(questionImages.questionId, questionId), eq(questionImages.placeholderId, placeholder)));
  if (!image) throw new HttpError(404, 'not_found', 'Image not found.');

  if (session.role !== 'teacher') {
    const [owned] = await db
      .select({ id: attemptAnswers.questionId })
      .from(attemptAnswers)
      .innerJoin(attempts, eq(attempts.id, attemptAnswers.attemptId))
      .where(and(eq(attemptAnswers.questionId, questionId), eq(attempts.studentId, session.userId)))
      .limit(1);
    if (!owned) throw new HttpError(403, 'forbidden', 'Not entitled to this image.');
  }

  // 1. Check metadata first without pulling down the large base64 payload from Supabase
  const meta = await getFileMetadata(image.storagePath);
  if (!meta) {
    throw new HttpError(410, 'file_missing', 'The image is registered but missing.');
  }

  const etag = `"${meta.sha256 || meta.size}"`;
  const cacheControl = 'private, max-age=86400, stale-while-revalidate=604800';

  // 2. Return 304 immediately with 0 bytes of DB egress if client has it cached
  if (req.headers.get('if-none-match') === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Cache-Control': cacheControl,
      },
    });
  }

  // 3. Only fetch full buffer when client genuinely needs it (or served from warm lambda memory cache)
  const file = await readFileRecord(image.storagePath);
  if (!file) {
    throw new HttpError(410, 'file_missing', 'The image is registered but missing.');
  }

  return new Response(new Uint8Array(file.buffer), {
    status: 200,
    headers: {
      'Content-Type': file.contentType || 'image/webp',
      'Content-Length': String(file.size),
      'Cache-Control': cacheControl,
      ETag: etag,
    },
  });
});

