import { eq } from 'drizzle-orm';
import { apiTeacher } from '@/lib/auth';
import { HttpError, withApi } from '@/lib/http';
import { getDb } from '@/db/client';
import { papers } from '@/db/schema';
import { readFileRecord } from '@/lib/storage';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withApi<Ctx>(async (req, { params }) => {
  await apiTeacher();
  const { id } = await params;

  const db = await getDb();
  const [paper] = await db
    .select({
      filePath: papers.filePath,
      originalFilename: papers.originalFilename,
      sha256: papers.sha256,
      fileSizeBytes: papers.fileSizeBytes,
    })
    .from(papers)
    .where(eq(papers.id, id));
  if (!paper) throw new HttpError(404, 'not_found', 'Paper not found.');

  const etag = `"${paper.sha256 || paper.fileSizeBytes}"`;
  const cacheControl = 'private, max-age=86400, stale-while-revalidate=604800';

  if (req.headers.get('if-none-match') === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Cache-Control': cacheControl,
      },
    });
  }

  const file = await readFileRecord(paper.filePath);
  if (!file) {
    throw new HttpError(410, 'file_missing', 'The source PDF is registered but missing.');
  }

  return new Response(new Uint8Array(file.buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(file.size),
      'Content-Disposition': `inline; filename="${encodeURIComponent(paper.originalFilename)}"`,
      'Cache-Control': cacheControl,
      ETag: etag,
    },
  });
});

