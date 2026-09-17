import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { apiTeacher } from '@/lib/auth';
import { HttpError, json, withApi } from '@/lib/http';
import { getDb } from '@/db/client';
import { attempts, profiles } from '@/db/schema';

const BulkDeleteSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1, 'Select at least one student'),
  purge: z.boolean().default(true),
});

/**
 * POST /api/students/bulk-delete
 * Bulk deletes or deactivates students.
 */
export const POST = withApi(async (req) => {
  await apiTeacher();
  const body = await req.json().catch(() => ({}));
  const parsed = BulkDeleteSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(422, 'validation_error', 'Invalid bulk delete request', {
      issues: parsed.error.issues,
    });
  }

  const { studentIds, purge } = parsed.data;
  const db = await getDb();

  // Ensure we only touch profiles with role = 'student'
  const matchedStudents = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.role, 'student'), inArray(profiles.id, studentIds)));

  const validIds = matchedStudents.map((s) => s.id);
  if (validIds.length === 0) {
    return json({
      success: true,
      deletedCount: 0,
      message: 'No matching student accounts found to delete.',
    });
  }

  if (purge) {
    // Delete test attempts for these students (foreign key onDelete: cascade deletes answers and events)
    await db.delete(attempts).where(inArray(attempts.studentId, validIds));
    // Delete student profiles
    await db.delete(profiles).where(and(eq(profiles.role, 'student'), inArray(profiles.id, validIds)));

    return json({
      success: true,
      deletedCount: validIds.length,
      message: `Deleted ${validIds.length} student account${validIds.length === 1 ? '' : 's'} and associated attempts.`,
    });
  }

  // If not purge, find students with attempts and deactivate them; delete students without attempts
  const studentAttempts = await db
    .select({ studentId: attempts.studentId })
    .from(attempts)
    .where(inArray(attempts.studentId, validIds));

  const studentsWithAttempts = new Set(studentAttempts.map((a) => a.studentId));
  const idsToDeactivate = validIds.filter((id) => studentsWithAttempts.has(id));
  const idsToDelete = validIds.filter((id) => !studentsWithAttempts.has(id));

  if (idsToDeactivate.length > 0) {
    await db
      .update(profiles)
      .set({ isActive: false, canLogin: false })
      .where(inArray(profiles.id, idsToDeactivate));
  }

  if (idsToDelete.length > 0) {
    await db
      .delete(profiles)
      .where(and(eq(profiles.role, 'student'), inArray(profiles.id, idsToDelete)));
  }

  return json({
    success: true,
    deletedCount: idsToDelete.length,
    deactivatedCount: idsToDeactivate.length,
    message: `Processed ${validIds.length} students: ${idsToDelete.length} deleted, ${idsToDeactivate.length} deactivated.`,
  });
});
