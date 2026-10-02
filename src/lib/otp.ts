import { createHash, randomInt } from 'node:crypto';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { phoneOtps } from '@/db/schema';
import { HttpError } from '@/lib/http';

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 30;

function getHashSecret(): string {
  return process.env.SESSION_SECRET || 'srsma-default-otp-secret-key-9921';
}

export function hashOtp(phone: string, otp: string): string {
  return createHash('sha256')
    .update(`${phone}:${otp}:${getHashSecret()}`)
    .digest('hex');
}

/**
 * Creates, hashes, and stores a new 6-digit OTP for the given phone number.
 * Enforces a 30-second resend cooldown.
 */
export async function createAndStoreOtp(
  normalizedPhone: string,
): Promise<{ otp: string; expiresAt: Date; cooldownSeconds: number }> {
  const db = await getDb();
  const now = new Date();

  // 1. Check for cooldown (if an OTP was created less than RESEND_COOLDOWN_SECONDS ago)
  const [latest] = await db
    .select()
    .from(phoneOtps)
    .where(eq(phoneOtps.phone, normalizedPhone))
    .orderBy(desc(phoneOtps.createdAt))
    .limit(1);

  if (latest) {
    const elapsedSeconds = (now.getTime() - new Date(latest.createdAt).getTime()) / 1000;
    if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
      const waitTime = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsedSeconds);
      throw new HttpError(
        429,
        'cooldown_active',
        `Please wait ${waitTime} seconds before requesting another code.`,
        { retryAfterS: waitTime },
      );
    }
  }

  // 2. Remove older OTPs for this phone to prevent clutter & stale replay
  await db.delete(phoneOtps).where(eq(phoneOtps.phone, normalizedPhone));

  // 3. Generate 6-digit code
  const otp = randomInt(100000, 1000000).toString();
  const otpHash = hashOtp(normalizedPhone, otp);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60_000);

  // 4. Insert into database
  await db.insert(phoneOtps).values({
    phone: normalizedPhone,
    otpHash,
    expiresAt,
    attempts: 0,
  });

  return { otp, expiresAt, cooldownSeconds: RESEND_COOLDOWN_SECONDS };
}

/**
 * Verifies the user-submitted OTP against the database.
 * Tracks failed attempts and removes the OTP upon successful verification.
 */
export async function verifyStoredOtp(
  normalizedPhone: string,
  candidateOtp: string,
): Promise<{ valid: boolean }> {
  const db = await getDb();
  const now = new Date();

  const [record] = await db
    .select()
    .from(phoneOtps)
    .where(
      and(
        eq(phoneOtps.phone, normalizedPhone),
        gt(phoneOtps.expiresAt, now),
      ),
    )
    .orderBy(desc(phoneOtps.createdAt))
    .limit(1);

  if (!record) {
    throw new HttpError(
      400,
      'otp_expired_or_invalid',
      'The verification code has expired or was not requested. Please request a new code.',
    );
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await db.delete(phoneOtps).where(eq(phoneOtps.id, record.id));
    throw new HttpError(
      429,
      'too_many_attempts',
      'Too many incorrect attempts. Please request a new code.',
    );
  }

  const expectedHash = hashOtp(normalizedPhone, candidateOtp.trim());
  if (record.otpHash !== expectedHash) {
    // Increment attempts count
    await db
      .update(phoneOtps)
      .set({ attempts: sql`${phoneOtps.attempts} + 1` })
      .where(eq(phoneOtps.id, record.id));

    const remaining = MAX_ATTEMPTS - (record.attempts + 1);
    throw new HttpError(
      400,
      'invalid_otp',
      remaining > 0
        ? `Incorrect code. ${remaining} attempt(s) remaining.`
        : 'Incorrect code. Please request a new code.',
    );
  }

  // Valid! Delete the OTP record so it cannot be reused
  await db.delete(phoneOtps).where(eq(phoneOtps.id, record.id));

  return { valid: true };
}
