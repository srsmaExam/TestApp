/**
 * WhatsApp Cloud API Client
 *
 * Dispatches WhatsApp OTP messages using Meta's Cloud API (Graph API v21.0).
 * If WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID are not set, or if
 * ENABLE_DEV_OTP_MOCK is enabled, it logs the OTP to the console for frictionless local development.
 */

export type SendOtpResult = {
  ok: boolean;
  messageId?: string;
  isMock?: boolean;
  error?: string;
};

export async function sendWhatsAppOtp(
  rawPhone: string,
  otpCode: string,
): Promise<SendOtpResult> {
  // Strip non-digits and leading + for Meta API (e.g. +91 98765 43210 -> 919876543210)
  const recipientDigits = rawPhone.replace(/\D/g, '');

  const accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'student_login_otp';
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US';
  const isMockExplicit = process.env.ENABLE_DEV_OTP_MOCK === 'true';

  // Fallback to console mock if credentials are not configured or dev mock is explicitly enabled
  if (!accessToken || !phoneNumberId || isMockExplicit) {
    console.log('\n======================================================');
    console.log('📲 [WHATSAPP OTP SIMULATOR]');
    console.log(`To:          +${recipientDigits}`);
    console.log(`OTP Code:    ${otpCode}`);
    console.log(`Template:    ${templateName} (${languageCode})`);
    if (!accessToken || !phoneNumberId) {
      console.log('ℹ️  Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to .env to deliver real messages.');
    }
    console.log('======================================================\n');
    return { ok: true, isMock: true, messageId: `mock_${Date.now()}` };
  }

  // Meta Graph API Endpoint
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  // We support templates with URL button, Copy-Code button, or body-only
  const candidates = [
    // 1. URL button template (e.g. Authentication template with URL button)
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientDigits,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: otpCode }],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: otpCode }],
          },
        ],
      },
    },
    // 2. Copy-code button template
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientDigits,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: otpCode }],
          },
          {
            type: 'button',
            sub_type: 'copy_code',
            index: '0',
            parameters: [{ type: 'coupon_code', coupon_code: otpCode }],
          },
        ],
      },
    },
    // 3. Body only template
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientDigits,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: otpCode }],
          },
        ],
      },
    },
  ];

  try {
    let lastError = '';
    for (const payload of candidates) {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.messages?.[0]?.id) {
        return { ok: true, messageId: data.messages[0].id, isMock: false };
      }

      lastError = data?.error?.message || `Meta API HTTP ${res.status}`;
      // If error is not related to button/parameter format, don't keep retrying other payloads
      const errLower = lastError.toLowerCase();
      if (!errLower.includes('button') && !errLower.includes('parameter') && !errLower.includes('132018') && !errLower.includes('131008')) {
        break;
      }
    }

    console.error('[whatsapp] send failed:', lastError);
    return { ok: false, error: lastError };
  } catch (err: any) {
    console.error('[whatsapp] network error dispatching OTP:', err);
    return { ok: false, error: err.message || 'Failed to reach Meta WhatsApp servers.' };
  }
}
