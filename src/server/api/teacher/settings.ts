import { z } from 'zod';
import { apiTeacher } from '@/lib/auth';
import { HttpError, json, withApi } from '@/lib/http';
import { isOtpAuthEnabled, setAppSetting, SETTING_WHATSAPP_OTP_ENABLED } from '@/lib/settings';

const UpdateSettingsSchema = z.object({
  whatsappOtpEnabled: z.boolean(),
});

export const GET = withApi(async () => {
  await apiTeacher();
  const enabled = await isOtpAuthEnabled();
  return json({ ok: true, whatsappOtpEnabled: enabled });
});

export const PATCH = withApi(async (req) => {
  await apiTeacher();

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, 'invalid_request', 'Invalid settings payload.');
  }

  const { whatsappOtpEnabled } = parsed.data;
  await setAppSetting(SETTING_WHATSAPP_OTP_ENABLED, whatsappOtpEnabled ? 'true' : 'false');

  return json({
    ok: true,
    whatsappOtpEnabled,
    message: whatsappOtpEnabled
      ? 'WhatsApp OTP verification enabled for student logins.'
      : 'WhatsApp OTP verification disabled. Students can sign in directly.',
  });
});
