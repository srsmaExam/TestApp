import { and, inArray, isNotNull } from 'drizzle-orm';
import { apiTeacher } from '@/lib/auth';
import { HttpError, isUniqueViolation, json, withApi } from '@/lib/http';
import { hashPassword } from '@/lib/password';
import { parseStudentCsv } from '@/lib/student-csv';
import { getDb } from '@/db/client';
import { profiles } from '@/db/schema';

/**
 * POST /api/students/bulk-import
 * Imports students from CSV string with validation, collision detection, and password hashing.
 */
export const POST = withApi(async (req) => {
  await apiTeacher();
  const body = await req.json().catch(() => ({}));
  const csvText = typeof body.csvText === 'string' ? body.csvText : '';

  if (!csvText.trim()) {
    throw new HttpError(422, 'empty_csv', 'Please provide CSV content to import.');
  }

  const { validRows, errors } = parseStudentCsv(csvText);

  if (errors.length > 0) {
    throw new HttpError(422, 'csv_validation_errors', 'CSV contains validation errors.', {
      errors,
      validRowsCount: validRows.length,
    });
  }

  if (validRows.length === 0) {
    throw new HttpError(422, 'no_valid_rows', 'No valid student rows found in the CSV.');
  }

  const db = await getDb();

  // Check for conflicts against existing DB records
  const usernames = validRows.map((r) => r.username);
  const emails = validRows.map((r) => r.email);

  const existingUsers = await db
    .select({ username: profiles.username, email: profiles.email })
    .from(profiles)
    .where(inArray(profiles.username, usernames));

  const existingEmails = await db
    .select({ username: profiles.username, email: profiles.email })
    .from(profiles)
    .where(inArray(profiles.email, emails));

  // FBR-05: missed by the preliminary report — bulk-import validated intra-CSV
  // username/email collisions but never checked phone at all, against either
  // the CSV or the DB. parseStudentCsv() already normalises and catches
  // intra-CSV phone duplicates; this catches a CSV row colliding with an
  // already-enrolled student's phone.
  const phones = validRows.map((r) => r.phone).filter((p): p is string => Boolean(p));
  const existingPhones =
    phones.length > 0
      ? await db
          .select({ phone: profiles.phone, fullName: profiles.fullName })
          .from(profiles)
          .where(and(isNotNull(profiles.phone), inArray(profiles.phone, phones)))
      : [];

  const collisionErrors: Array<{ row: number; field: string; message: string }> = [];

  const existingUserSet = new Set(existingUsers.map((u) => u.username.toLowerCase()));
  const existingEmailSet = new Set(existingEmails.map((u) => u.email.toLowerCase()));
  const existingPhoneMap = new Map(existingPhones.map((p) => [p.phone as string, p.fullName]));

  for (const row of validRows) {
    if (existingUserSet.has(row.username.toLowerCase())) {
      collisionErrors.push({
        row: row.rowNumber,
        field: 'username',
        message: `Username "${row.username}" already exists in the system.`,
      });
    }
    if (existingEmailSet.has(row.email.toLowerCase())) {
      collisionErrors.push({
        row: row.rowNumber,
        field: 'email',
        message: `Email "${row.email}" already exists in the system.`,
      });
    }
    if (row.phone && existingPhoneMap.has(row.phone)) {
      collisionErrors.push({
        row: row.rowNumber,
        field: 'phone',
        message: `Phone "${row.phone}" is already registered to ${existingPhoneMap.get(row.phone)}.`,
      });
    }
  }

  if (collisionErrors.length > 0) {
    throw new HttpError(409, 'db_conflicts', 'Some rows collide with existing student accounts.', {
      errors: collisionErrors,
    });
  }

  // Hash passwords and prepare rows for insert
  const toInsert = await Promise.all(
    validRows.map(async (r) => {
      const passwordHash = await hashPassword(r.password || '112345');
      return {
        role: 'student' as const,
        fullName: r.fullName,
        username: r.username,
        email: r.email,
        phone: r.phone || null,
        batch: r.batch || null,
        passwordHash,
        isActive: true,
        canLogin: true,
      };
    }),
  );

  // Insert all in a transaction
  try {
    await db.transaction(async (tx) => {
      for (const row of toInsert) {
        await tx.insert(profiles).values(row);
      }
    });
  } catch (err) {
    // Backstops the insert race the proactive check above can't catch — two
    // imports (or an import racing a manual student creation) claiming the
    // same phone at once.
    if (isUniqueViolation(err)) {
      throw new HttpError(409, 'db_conflicts', 'A phone number in this CSV was just registered by another request. Please retry.');
    }
    throw err;
  }

  return json({
    success: true,
    importedCount: validRows.length,
    message: `Successfully imported ${validRows.length} student${validRows.length === 1 ? '' : 's'}.`,
  });
});
