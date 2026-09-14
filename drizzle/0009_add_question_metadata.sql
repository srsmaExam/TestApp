-- 0009_add_question_metadata.sql
-- Add extensible metadata column for question profiling (primary skill, cognitive level, concept tested, diagnostic weight, etc.)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS metadata jsonb;
