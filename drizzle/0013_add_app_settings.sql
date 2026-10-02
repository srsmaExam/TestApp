-- 0013_add_app_settings.sql
-- Table to store system-wide configuration keys (such as enabling/disabling WhatsApp OTP)
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Default: WhatsApp OTP is enabled
INSERT INTO app_settings (key, value)
VALUES ('whatsapp_otp_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
