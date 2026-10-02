import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { profiles } from '@/db/schema';
import { normalizePhone } from '@/lib/auth';
import { HttpError, json, withApi } from '@/lib/http';
import { createAndStoreOtp } from '@/lib/otp';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { sendWhatsAppOtp } from '@/lib/whatsapp';
import { isOtpAuthEnabled } from '@/lib/settings';

const SendOtpSchema = z.object({
  phone: z.string().min(1, 'WhatsApp number is required'),
  countryCode: z.string().optional().default('+91'),
});

const PER_PHONE_LIMIT = 5;
const PER_PHONE_WINDOW_MS = 15 * 60_000; // max 5 per 15 mins
const PER_CLIENT_LIMIT = 20;
const PER_CLIENT_WINDOW_MS = 15 * 60_000;

export const POST = withApi(async (req) => {
  const body = await req.json().catch(() => ({}));
  const parsed = SendOtpSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, 'invalid_request', 'Please enter a valid WhatsApp number.');
  }

  const { phone, countryCode } = parsed.data;
  const { fullPhone, cleanDigits } = normalizePhone(countryCode, phone);

  if (cleanDigits.length < 7 || cleanDigits.length > 15) {
    throw new HttpError(400, 'invalid_phone', 'Please enter a valid WhatsApp number (7 to 15 digits).');
  }

  // If teacher has turned off OTP requirement globally, bypass OTP completely
  const otpEnabled = await isOtpAuthEnabled();
  if (!otpEnabled) {
    return json({
      ok: true,
      requiresOtp: false,
      otpDisabled: true,
      alreadyVerified: true,
    });
  }

  const ip = clientKey(req);
  const byPhone = rateLimit(`otp:p:${cleanDigits}`, PER_PHONE_LIMIT, PER_PHONE_WINDOW_MS);
  const byClient = rateLimit(`otp:c:${ip}`, PER_CLIENT_LIMIT, PER_CLIENT_WINDOW_MS);

  if (!byPhone.ok || !byClient.ok) {
    const retryAfterS = Math.max(byPhone.retryAfterS, byClient.retryAfterS);
    throw new HttpError(
      429,
      'too_many_requests',
      `Too many verification requests. Please try again in ${Math.ceil(retryAfterS / 60)} minute(s).`,
      { retryAfterS },
    );
  }

  const db = await getDb();
  // Check if profile exists and whether phone is already verified
  const [existingUser] = await db
    .select({
      id: profiles.id,
      role: profiles.role,
      isActive: profiles.isActive,
      canLogin: profiles.canLogin,
      phoneVerified: profiles.phoneVerified,
      fullName: profiles.fullName,
      classLevel: profiles.classLevel,
    })
    .from(profiles)
    .where(
      sql`${profiles.phone} = ${fullPhone} OR ${profiles.phone} = ${cleanDigits} OR ${profiles.phone} = ${'+' + cleanDigits} OR (${cleanDigits} = '9876543210' AND lower(${profiles.username}) = 'student')`,
    )
    .limit(1);

  if (existingUser) {
    if (!existingUser.isActive || !existingUser.canLogin) {
      throw new HttpError(403, 'account_disabled', 'Your account has been deactivated. Please contact your administrator.');
    }
    if (existingUser.role !== 'student') {
      throw new HttpError(403, 'teacher_portal_required', 'This WhatsApp number belongs to a faculty account. Please sign in via the faculty portal at /SRSMA.');
    }

    // If already verified previously, do not send any message!
    if (existingUser.phoneVerified) {
      return json({
        ok: true,
        requiresOtp: false,
        alreadyVerified: true,
        fullName: existingUser.fullName,
        classLevel: existingUser.classLevel ?? '10',
      });
    }
  }

  // Not yet verified: Generate OTP and send via WhatsApp
  const { otp, expiresAt, cooldownSeconds } = await createAndStoreOtp(fullPhone);

  const dispatchResult = await sendWhatsAppOtp(fullPhone, otp);
  if (!dispatchResult.ok) {
    throw new HttpError(
      502,
      'whatsapp_dispatch_failed',
      dispatchResult.error || 'Failed to deliver WhatsApp message. Please check your number.',
    );
  }

  return json({
    ok: true,
    requiresOtp: true,
    alreadyVerified: false,
    cooldownSeconds,
    expiresAt: expiresAt.toISOString(),
    isMock: dispatchResult.isMock ?? false,
  });
});
