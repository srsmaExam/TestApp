-- Add city, board, whatsapp_consent, and class_level to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS board text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_consent boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS class_level text;
