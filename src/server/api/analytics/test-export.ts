import { eq } from 'drizzle-orm';
import { apiTeacher } from '@/lib/auth';
import { HttpError, withApi } from '@/lib/http';
import { getDb } from '@/db/client';
import { tests } from '@/db/schema';

type Ctx = { params: Promise<{ id: string }> };

// withApi, like every other route. Without it, apiTeacher()'s 403 and the
// not_found throw escaped uncaught and Next answered a generic 500 (with a
// stack trace in dev) instead of the intended status and JSON body.
export const GET = withApi<Ctx>(async (req, { params }) => {
  await apiTeacher();
  const { id: testId } = await params;
  const db = await getDb();

  const [test] = await db.select().from(tests).where(eq(tests.id, testId));
  if (!test) throw new HttpError(404, 'not_found', 'Test not found');

  const rowsRes = await db.$client.query<{
    rank: number;
    full_name: string;
    username: string;
    batch: string | null;
    total_marks: string | number;
    percentile: number;
    total_time_s: number | null;
    submitted_at: string;
  }>(
    `SELECT
       rank() OVER (PARTITION BY a.test_id ORDER BY a.total_marks DESC NULLS LAST) AS rank,
       p.full_name,
       p.username,
       p.batch,
       a.total_marks,
       round(100 * percent_rank() OVER (PARTITION BY a.test_id ORDER BY a.total_marks ASC NULLS FIRST)::numeric, 1) AS percentile,
       a.total_time_s,
       a.submitted_at
     FROM attempts a
     JOIN profiles p ON p.id = a.student_id
     WHERE a.test_id = $1 AND a.status IN ('submitted', 'auto_submitted') AND a.total_marks IS NOT NULL
     ORDER BY rank ASC, a.submitted_at ASC`,
    [testId],
  );

  /**
   * Quote-and-double for CSV, plus a leading apostrophe on anything Excel and
   * Sheets would evaluate as a formula. A student named `=cmd|'/c calc'!A1`
   * otherwise executes when the teacher opens the export — quoting alone does
   * not prevent it, because the spreadsheet strips the quotes before parsing.
   */
  const escapeCsv = (str: string | number | null | undefined): string => {
    if (str === null || str === undefined) return '""';
    let s = String(str);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };

  const headers = ['Rank', 'Student Name', 'Username', 'Batch', 'Total Marks', 'Percentile', 'Total Time (min)', 'Submitted At'];
  const lines = [headers.join(',')];

  for (const row of rowsRes.rows) {
    const line = [
      row.rank,
      escapeCsv(row.full_name),
      escapeCsv(row.username),
      escapeCsv(row.batch ?? 'General'),
      Number(row.total_marks),
      Number(row.percentile),
      Math.round((row.total_time_s ?? 0) / 60),
      escapeCsv(row.submitted_at),
    ].join(',');
    lines.push(line);
  }

  const csvContent = lines.join('\r\n');
  const safeTitle = test.title.replace(/[^a-zA-Z0-9_-]/g, '_');

  // BOM so Excel reads the file as UTF-8 rather than the system codepage,
  // which otherwise mangles non-ASCII student names.
  return new Response('﻿' + csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeTitle}-results.csv"`,
      'Cache-Control': 'no-store',
    },
  });
});
