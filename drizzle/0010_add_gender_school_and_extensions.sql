-- Add gender and school to profiles, and time_extensions_count to attempts
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school text;
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS time_extensions_count integer NOT NULL DEFAULT 0;
