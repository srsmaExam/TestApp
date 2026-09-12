import { eq } from 'drizzle-orm';
import { apiTeacher } from '@/lib/auth';
import { HttpError, withApi } from '@/lib/http';
import { getDb } from '@/db/client';
import { papers } from '@/db/schema';
import { readFileRecord } from '@/lib/storage';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withApi<Ctx>(async (_req, { params }) => {
  await apiTeacher();
  const { id } = await params;

  const db = await getDb();
  const [paper] = await db.select().from(papers).where(eq(papers.id, id));
  if (!paper) throw new HttpError(404, 'not_found', 'Paper not found.');

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
      'Cache-Control': 'private, max-age=3600',
    },
  });
});
