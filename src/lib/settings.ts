import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { appSettings } from '@/db/schema';

export const SETTING_WHATSAPP_OTP_ENABLED = 'whatsapp_otp_enabled';

/**
 * Retrieves a string setting from the database, falling back to defaultValue if missing.
 */
export async function getAppSetting(key: string, defaultValue: string): Promise<string> {
  try {
    const db = await getDb();
    const [row] = await db
      .select({ value: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);

    return row?.value ?? defaultValue;
  } catch (err) {
    console.error(`[settings] failed to read setting "${key}":`, err);
    return defaultValue;
  }
}

/**
 * Checks whether WhatsApp OTP verification is currently enforced for student logins.
 * Defaults to true.
 */
export async function isOtpAuthEnabled(): Promise<boolean> {
  const val = await getAppSetting(SETTING_WHATSAPP_OTP_ENABLED, 'true');
  return val === 'true';
}

/**
 * Sets or updates an application configuration setting in the database.
 */
export async function setAppSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db
    .insert(appSettings)
    .values({
      key,
      value,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value,
        updatedAt: new Date(),
      },
    });
}
