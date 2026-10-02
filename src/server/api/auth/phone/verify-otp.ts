import { z } from 'zod';
import { loginWithPhone, normalizePhone } from '@/lib/auth';
import { HttpError, json, withApi } from '@/lib/http';
import { verifyStoredOtp } from '@/lib/otp';
import { clientKey, rateLimit } from '@/lib/rate-limit';

const VerifyOtpSchema = z.object({
  phone: z.string().min(1, 'WhatsApp number is required'),
  countryCode: z.string().optional().default('+91'),
  otp: z.string().trim().min(6, 'Please enter the 6-digit OTP').max(6, 'Please enter the 6-digit OTP'),
  fullName: z.string().trim().optional(),
  classLevel: z.string().trim().optional(),
});

const PER_CLIENT_LIMIT = 30;
const PER_CLIENT_WINDOW_MS = 5 * 60_000;

export const POST = withApi(async (req) => {
  const body = await req.json().catch(() => ({}));
  const parsed = VerifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || 'Please check your inputs.';
    throw new HttpError(400, 'invalid_request', issue);
  }

  const { phone, countryCode, otp, fullName, classLevel } = parsed.data;
  const { fullPhone } = normalizePhone(countryCode, phone);

  const ip = clientKey(req);
  const byClient = rateLimit(`verify-otp:c:${ip}`, PER_CLIENT_LIMIT, PER_CLIENT_WINDOW_MS);
  if (!byClient.ok) {
    throw new HttpError(
      429,
      'too_many_attempts',
      `Too many verification attempts. Please wait a moment and try again.`,
      { retryAfterS: byClient.retryAfterS },
    );
  }

  // 1. Verify OTP in database
  await verifyStoredOtp(fullPhone, otp);

  // 2. Provision or log in student with phoneVerified = true!
  const session = await loginWithPhone(countryCode, phone, {
    fullName,
    classLevel,
    phoneVerified: true,
  });

  return json({
    ok: true,
    homeUrl: '/student',
    session,
  });
});
