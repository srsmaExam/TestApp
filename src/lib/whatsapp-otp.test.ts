import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import type { Db } from '@/db/client';
import { createAndStoreOtp, hashOtp, verifyStoredOtp } from './otp';
import { loginWithPhone, normalizePhone } from './auth';
import { isOtpAuthEnabled, setAppSetting } from './settings';

const ROOT = path.resolve(import.meta.dirname, '../..');
const MIGRATIONS_DIR = path.join(ROOT, 'drizzle');

let pg: PGlite;
let db: Db;

const cookieStore = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => (cookieStore.has(name) ? { value: cookieStore.get(name) } : undefined),
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  })),
}));

vi.mock('@/db/client', () => ({
  getDb: vi.fn(async () => db),
}));

describe('WhatsApp OTP Authentication Flow', () => {
  const testPhone = '+919876500001';

  beforeAll(async () => {
    process.env.SESSION_SECRET = 'a'.repeat(32);

    pg = await PGlite.create();
    const files = fs
      .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.sql'))
      .map((e) => e.name)
      .sort();
    for (const file of files) {
      await pg.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
    }
    db = drizzle(pg, { schema }) as Db;
  });

  afterAll(async () => {
    await pg?.close();
  });

  it('correctly hashes OTP with phone salt', () => {
    const hash1 = hashOtp(testPhone, '123456');
    const hash2 = hashOtp(testPhone, '123456');
    const hash3 = hashOtp(testPhone, '654321');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(64); // SHA-256 hex string
  });

  it('generates, stores, and verifies a 6-digit OTP', async () => {
    const { otp, expiresAt, cooldownSeconds } = await createAndStoreOtp(testPhone);

    expect(otp).toMatch(/^\d{6}$/);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(cooldownSeconds).toBe(30);

    // Verify correct OTP
    const result = await verifyStoredOtp(testPhone, otp);
    expect(result.valid).toBe(true);
  });

  it('rejects an incorrect OTP and throws invalid_otp', async () => {
    const { otp } = await createAndStoreOtp(testPhone);

    const wrongOtp = otp === '111111' ? '222222' : '111111';
    await expect(verifyStoredOtp(testPhone, wrongOtp)).rejects.toThrow('Incorrect code');
  });

  it('normalizes international phone numbers consistently', () => {
    const res1 = normalizePhone('+91', '9876543210');
    expect(res1.fullPhone).toBe('+919876543210');
    expect(res1.cleanDigits).toBe('9876543210');

    // Strips redundant country code if typed by user
    const res2 = normalizePhone('+91', '919876543210');
    expect(res2.fullPhone).toBe('+919876543210');
    expect(res2.cleanDigits).toBe('9876543210');
  });

  it('marks student profile as phone_verified and remembers them for future logins', async () => {
    const studentPhone = '9876500099';
    const countryCode = '+91';
    const { fullPhone } = normalizePhone(countryCode, studentPhone);

    // Initial sign up with OTP verification
    const { otp } = await createAndStoreOtp(fullPhone);
    const verification = await verifyStoredOtp(fullPhone, otp);
    expect(verification.valid).toBe(true);

    // Provision student with phoneVerified = true
    const session = await loginWithPhone(countryCode, studentPhone, {
      fullName: 'Rahul Sharma',
      classLevel: '11',
      phoneVerified: true,
    });

    expect(session.fullName).toBe('Rahul Sharma');
    expect(session.role).toBe('student');

    // Verify DB has phoneVerified set to true
    const [dbStudent] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.phone, fullPhone))
      .limit(1);

    expect(dbStudent).toBeDefined();
    expect(dbStudent.phoneVerified).toBe(true);

    // Next time the student signs in: loginWithPhone succeeds directly
    const nextSession = await loginWithPhone(countryCode, studentPhone);
    expect(nextSession.userId).toBe(dbStudent.id);
  });

  it('allows teacher to toggle OTP requirement off and on', async () => {
    // Default should be true
    expect(await isOtpAuthEnabled()).toBe(true);

    // Disable OTP
    await setAppSetting('whatsapp_otp_enabled', 'false');
    expect(await isOtpAuthEnabled()).toBe(false);

    // Re-enable OTP
    await setAppSetting('whatsapp_otp_enabled', 'true');
    expect(await isOtpAuthEnabled()).toBe(true);
  });
});

