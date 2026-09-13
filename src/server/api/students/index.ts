import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { apiTeacher, normalizePhone } from '@/lib/auth';
import { HttpError, isUniqueViolation, json, withApi } from '@/lib/http';
import { hashPassword } from '@/lib/password';
import { getDb } from '@/db/client';
import { profiles } from '@/db/schema';

/**
 * Builds the WHERE clause and its positional-parameter array from a single
 * source of truth, so the placeholder index emitted in the SQL text can never
 * drift from the array slot it is meant to bind to.
 *
 * FBR-01: the previous version derived `$4` for `batch` independently of
 * whether `search` had already claimed `$3`, so "batch without search" sent 3
 * parameters for a statement requiring 4 ("bind message supplies 3
 * parameters, but prepared statement "" requires 4"). Building both from the
 * same `params` array makes that class of bug structurally impossible.
 */
export function buildStudentListFilter(
  search: string,
  batch: string,
  status: string,
  pageSize: number,
  offset: number,
  // FBR-03: 'enrolled' (default) hides self-service phone-login accounts not
  // yet converted by a teacher — they are not real students and must not
  // dilute the roster. 'provisional' is the dedicated "Prospective leads"
  // tab; 'all' is only for the rare case a teacher wants both together.
  enrollment: 'enrolled' | 'provisional' | 'all' = 'enrolled',
): { sqlFragment: string; params: unknown[] } {
  const params: unknown[] = [pageSize, offset];
  const clauses: string[] = [];

  if (search) {
    params.push(`%${search}%`);
    const i = params.length;
    clauses.push(
      `AND (p.full_name ILIKE $${i} OR p.username ILIKE $${i} OR p.email ILIKE $${i} OR p.phone ILIKE $${i})`,
    );
  }

  if (batch === 'General') {
    clauses.push(`AND (p.batch IS NULL OR p.batch = 'General')`);
  } else if (batch) {
    params.push(batch);
    clauses.push(`AND p.batch = $${params.length}`);
  }

  if (status === 'active') clauses.push(`AND p.is_active = true`);
  else if (status === 'inactive') clauses.push(`AND p.is_active = false`);

  if (enrollment === 'enrolled') clauses.push(`AND p.is_provisional = false`);
  else if (enrollment === 'provisional') clauses.push(`AND p.is_provisional = true`);

  return { sqlFragment: clauses.join('\n       '), params };
}

const CreateStudentSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  username: z
    .string()
    .trim()
    .min(2, 'Username must be at least 2 characters')
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, hyphens, periods, and underscores'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  phone: z.string().trim().max(25).optional().nullable(),
  batch: z.string().trim().max(100).optional().nullable(),
  password: z.string().min(4, 'Password must be at least 4 characters').default('112345'),
});

/**
 * GET /api/students
 * Lists students with pagination, search, batch filter, and attempt aggregates.
 */
export const GET = withApi(async (req) => {
  await apiTeacher();
  const url = new URL(req.url);

  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? 25)));
  const search = url.searchParams.get('search')?.trim() ?? '';
  const batch = url.searchParams.get('batch')?.trim() ?? '';
  const status = url.searchParams.get('status')?.trim() ?? 'all';
  const enrollmentParam = url.searchParams.get('enrollment')?.trim();
  const enrollment: 'enrolled' | 'provisional' | 'all' =
    enrollmentParam === 'provisional' || enrollmentParam === 'all' ? enrollmentParam : 'enrolled';

  const db = await getDb();

  const conditions = [eq(profiles.role, 'student')];

  if (search) {
    conditions.push(
      or(
        ilike(profiles.fullName, `%${search}%`),
        ilike(profiles.username, `%${search}%`),
        ilike(profiles.email, `%${search}%`),
        ilike(profiles.phone, `%${search}%`),
      )!,
    );
  }

  if (batch) {
    if (batch === 'General') {
      conditions.push(sql`(${profiles.batch} IS NULL OR ${profiles.batch} = 'General')`);
    } else {
      conditions.push(eq(profiles.batch, batch));
    }
  }

  if (status === 'active') {
    conditions.push(eq(profiles.isActive, true));
  } else if (status === 'inactive') {
    conditions.push(eq(profiles.isActive, false));
  }

  // FBR-03: "Prospective leads" (provisional, self-service phone-login
  // accounts) are quarantined out of the default roster.
  if (enrollment === 'enrolled') {
    conditions.push(eq(profiles.isProvisional, false));
  } else if (enrollment === 'provisional') {
    conditions.push(eq(profiles.isProvisional, true));
  }

  const whereClause = and(...conditions);

  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(profiles)
    .where(whereClause);

  const total = Number(count);
  const offset = (page - 1) * pageSize;

  // Student details joined with aggregated attempt stats
  const { sqlFragment, params } = buildStudentListFilter(search, batch, status, pageSize, offset, enrollment);

  const studentsQuery = await db.$client.query<{
    id: string;
    full_name: string;
    username: string;
    email: string;
    phone: string | null;
    batch: string | null;
    is_active: boolean;
    can_login: boolean;
    created_at: string;
    is_provisional: boolean;
    tests_taken: number;
    avg_score: number | null;
    avg_percentile: number | null;
    last_attempt_at: string | null;
  }>(
    `SELECT
       p.id,
       p.full_name,
       p.username,
       p.email,
       p.phone,
       p.batch,
       p.is_active,
       p.can_login,
       p.created_at,
       p.is_provisional,
       COUNT(a.id) FILTER (WHERE a.status <> 'in_progress') AS tests_taken,
       ROUND(AVG(a.total_marks) FILTER (WHERE a.status <> 'in_progress')::numeric, 1) AS avg_score,
       ROUND(AVG(r.percentile)::numeric, 1) AS avg_percentile,
       MAX(a.submitted_at) AS last_attempt_at
     FROM profiles p
     LEFT JOIN attempts a ON a.student_id = p.id
     LEFT JOIN v_test_ranks r ON r.test_id = a.test_id AND r.student_id = a.student_id AND r.attempt_no = a.attempt_no
     WHERE p.role = 'student'
       ${sqlFragment}
     GROUP BY p.id
     ORDER BY p.created_at DESC
     LIMIT $1 OFFSET $2`,
    params,
  );

  const students = studentsQuery.rows.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    username: r.username,
    email: r.email,
    phone: r.phone ?? null,
    batch: r.batch ?? 'General',
    isActive: r.is_active,
    canLogin: r.can_login,
    createdAt: r.created_at,
    isProvisional: r.is_provisional,
    testsTaken: Number(r.tests_taken ?? 0),
    avgScore: r.avg_score !== null ? Number(r.avg_score) : 0,
    avgPercentile: r.avg_percentile !== null ? Number(r.avg_percentile) : null,
    lastAttemptAt: r.last_attempt_at,
  }));

  return json({
    students,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  });
});

/**
 * POST /api/students
 * Creates a single student account.
 */
export const POST = withApi(async (req) => {
  await apiTeacher();
  const body = await req.json().catch(() => ({}));
  const parsed = CreateStudentSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(422, 'validation_error', 'Invalid student details', {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  const { fullName, username, email, phone, batch, password } = parsed.data;
  const db = await getDb();

  // FBR-05: store E.164 only, so "+919876543210", "919876543210" and
  // "9876543210" can never coexist as separate rows for the same real phone.
  const normalizedPhone = phone && phone.trim() ? normalizePhone('+91', phone.trim()).fullPhone : null;

  // Check unique username, email & phone. `username`/`email` are DB-unique
  // already; `phone` also is (profiles_phone_idx), but only on the
  // as-normalized string, and a wrong guess on a collision is an account
  // takeover — so this is checked proactively rather than left to a raw
  // 23505 on insert.
  const conditions = [eq(profiles.username, username), eq(profiles.email, email)];
  if (normalizedPhone) conditions.push(eq(profiles.phone, normalizedPhone));

  const existing = await db
    .select({ id: profiles.id, username: profiles.username, email: profiles.email, phone: profiles.phone, fullName: profiles.fullName })
    .from(profiles)
    .where(or(...conditions));

  if (existing.length > 0) {
    if (existing.some((e) => e.username.toLowerCase() === username.toLowerCase())) {
      throw new HttpError(409, 'username_taken', `Username "${username}" is already in use.`);
    }
    if (existing.some((e) => e.email.toLowerCase() === email.toLowerCase())) {
      throw new HttpError(409, 'email_taken', `Email "${email}" is already registered.`);
    }
    const holder = existing.find((e) => e.phone === normalizedPhone);
    throw new HttpError(
      409,
      'phone_taken',
      `Phone "${phone}" is already registered to ${holder?.fullName ?? 'another student'}.`,
    );
  }

  const passwordHash = await hashPassword(password);

  let student;
  try {
    [student] = await db
      .insert(profiles)
      .values({
        role: 'student',
        fullName,
        username,
        email,
        phone: normalizedPhone,
        batch: batch || null,
        passwordHash,
        isActive: true,
        canLogin: true,
      })
      .returning({
        id: profiles.id,
        fullName: profiles.fullName,
        username: profiles.username,
        email: profiles.email,
        phone: profiles.phone,
        batch: profiles.batch,
        isActive: profiles.isActive,
        canLogin: profiles.canLogin,
        createdAt: profiles.createdAt,
      });
  } catch (err) {
    // The proactive check above closes the common case; this backstops the
    // insert race — two requests passing the check for the same phone at once.
    if (isUniqueViolation(err)) {
      throw new HttpError(409, 'phone_taken', `Phone "${phone}" was just registered to another student.`);
    }
    throw err;
  }

  return json({ student }, 201);
});
