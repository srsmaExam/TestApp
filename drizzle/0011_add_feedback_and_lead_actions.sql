-- Add WhatsApp click tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_contact_clicked boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_enroll_clicked boolean NOT NULL DEFAULT false;

-- Table to track student CTA clicks (e.g. WhatsApp Contact Us, WhatsApp Enroll Now)
CREATE TABLE IF NOT EXISTS student_lead_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attempt_id uuid REFERENCES attempts(id) ON DELETE SET NULL,
  action text NOT NULL,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table to store student feedback on Diagnostic Test and Report
CREATE TABLE IF NOT EXISTS student_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attempt_id uuid REFERENCES attempts(id) ON DELETE SET NULL,
  test_id uuid REFERENCES tests(id) ON DELETE SET NULL,
  test_rating smallint,
  report_rating smallint,
  feedback_text text,
  source_tab text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_lead_actions_student_idx ON student_lead_actions(student_id);
CREATE INDEX IF NOT EXISTS student_lead_actions_attempt_idx ON student_lead_actions(attempt_id);
CREATE INDEX IF NOT EXISTS student_feedback_student_idx ON student_feedback(student_id);
CREATE INDEX IF NOT EXISTS student_feedback_attempt_idx ON student_feedback(attempt_id);
