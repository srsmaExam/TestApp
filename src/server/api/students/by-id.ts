import { and, desc, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { apiTeacher, normalizePhone } from '@/lib/auth';
import { HttpError, isUniqueViolation, json, withApi } from '@/lib/http';
import { hashPassword } from '@/lib/password';
import { getDb } from '@/db/client';
import { attempts, profiles, tests } from '@/db/schema';

type Ctx = { params: Promise<{ id: string }> };

const UpdateStudentSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  phone: z.string().trim().max(25).optional().nullable(),
  batch: z.string().trim().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
  canLogin: z.boolean().optional(),
  newPassword: z.string().min(4).optional(),
  // FBR-03: "Convert to enrolled student" — clears the provisional flag so
  // the account is entitled to the enrolled question bank and counted in
  // cohort statistics. Always sent together with a real `batch`.
  isProvisional: z.boolean().optional(),
});

/**
 * GET /api/students/:id
 * Fetches a single student with attempt summary.
 */
export const GET = withApi<Ctx>(async (req, { params }) => {
  await apiTeacher();
  const { id: studentId } = await params;
  const db = await getDb();

  const [student] = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      username: profiles.username,
      email: profiles.email,
      phone: profiles.phone,
      batch: profiles.batch,
      isActive: profiles.isActive,
      canLogin: profiles.canLogin,
      createdAt: profiles.createdAt,
      isProvisional: profiles.isProvisional,
    })
    .from(profiles)
    .where(and(eq(profiles.id, studentId), eq(profiles.role, 'student')));

  if (!student) {
    throw new HttpError(404, 'not_found', 'Student profile not found.');
  }

  const studentAttempts = await db
    .select({
      attemptId: attempts.id,
      testId: attempts.testId,
      testTitle: tests.title,
      attemptNo: attempts.attemptNo,
      status: attempts.status,
      totalMarks: attempts.totalMarks,
      maxMarks: attempts.maxMarks,
      submittedAt: attempts.submittedAt,
    })
    .from(attempts)
    .innerJoin(tests, eq(tests.id, attempts.testId))
    .where(eq(attempts.studentId, studentId))
    .orderBy(desc(attempts.startedAt));

  return json({ student, attempts: studentAttempts });
});

/**
 * PATCH /api/students/:id
 * Updates student fields, batch, status, or resets password.
 */
export const PATCH = withApi<Ctx>(async (req, { params }) => {
  await apiTeacher();
  const { id: studentId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = UpdateStudentSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(422, 'validation_error', 'Invalid student updates', {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  const db = await getDb();

  const [existing] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, studentId), eq(profiles.role, 'student')));

  if (!existing) {
    throw new HttpError(404, 'not_found', 'Student profile not found.');
  }

  const updates: Record<string, unknown> = {};

  if (parsed.data.fullName !== undefined) updates.fullName = parsed.data.fullName;
  if (parsed.data.batch !== undefined) updates.batch = parsed.data.batch || null;
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;
  if (parsed.data.canLogin !== undefined) updates.canLogin = parsed.data.canLogin;
  if (parsed.data.isProvisional !== undefined) updates.isProvisional = parsed.data.isProvisional;

  if (parsed.data.email !== undefined && parsed.data.email !== existing.email) {
    const emailConflict = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(eq(profiles.email, parsed.data.email), ne(profiles.id, studentId)));
    if (emailConflict.length > 0) {
      throw new HttpError(409, 'email_taken', `Email "${parsed.data.email}" is already registered.`);
    }
    updates.email = parsed.data.email;
  }

  // FBR-05: missed by the preliminary report — this was the only one of the
  // four student write paths with no phone validation at all, silently
  // storing whatever string was sent. Normalise, then check for a collision
  // proactively (a wrong guess on ambiguity is an account takeover).
  if (parsed.data.phone !== undefined) {
    const normalizedPhone = parsed.data.phone && parsed.data.phone.trim()
      ? normalizePhone('+91', parsed.data.phone.trim()).fullPhone
      : null;

    if (normalizedPhone && normalizedPhone !== existing.phone) {
      const [holder] = await db
        .select({ id: profiles.id, fullName: profiles.fullName })
        .from(profiles)
        .where(and(eq(profiles.phone, normalizedPhone), ne(profiles.id, studentId)));
      if (holder) {
        throw new HttpError(409, 'phone_taken', `Phone "${parsed.data.phone}" is already registered to ${holder.fullName}.`);
      }
    }
    updates.phone = normalizedPhone;
  }

  if (parsed.data.newPassword) {
    updates.passwordHash = await hashPassword(parsed.data.newPassword);
  }

  if (Object.keys(updates).length > 0) {
    try {
      await db.update(profiles).set(updates).where(eq(profiles.id, studentId));
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new HttpError(409, 'phone_taken', `Phone "${parsed.data.phone}" was just registered to another student.`);
      }
      throw err;
    }
  }

  const [updated] = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      username: profiles.username,
      email: profiles.email,
      phone: profiles.phone,
      batch: profiles.batch,
      isActive: profiles.isActive,
      canLogin: profiles.canLogin,
      createdAt: profiles.createdAt,
      isProvisional: profiles.isProvisional,
    })
    .from(profiles)
    .where(eq(profiles.id, studentId));

  return json({ student: updated });
});

/**
 * DELETE /api/students/:id
 * Deletes student if no attempts exist, or deactivates if attempt history exists.
 */
export const DELETE = withApi<Ctx>(async (req, { params }) => {
  await apiTeacher();
  const { id: studentId } = await params;
  const db = await getDb();

  const [existing] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, studentId), eq(profiles.role, 'student')));

  if (!existing) {
    throw new HttpError(404, 'not_found', 'Student profile not found.');
  }

  // Check attempt history
  const [attemptCount] = await db
    .select({ count: attempts.id })
    .from(attempts)
    .where(eq(attempts.studentId, studentId))
    .limit(1);

  if (attemptCount) {
    // Preserve exam audit trail by deactivating instead of deleting
    await db
      .update(profiles)
      .set({ isActive: false, canLogin: false })
      .where(eq(profiles.id, studentId));

    return json({
      deleted: false,
      deactivated: true,
      message: 'Student has recorded exam attempts. Account was deactivated to preserve exam history.',
    });
  }

  await db.delete(profiles).where(eq(profiles.id, studentId));
  return json({ deleted: true, deactivated: false, message: 'Student deleted successfully.' });
});
