-- =====================================================================
-- 0006_provisional_accounts — FBR-03: unauthenticated question-bank and
-- answer-key exfiltration via open phone auto-provisioning.
--
-- Phone login auto-provisions a live student account for any 7-15 digit
-- number, and that account could immediately open every published test and
-- read every answer key and worked solution from the result page. This
-- migration separates "an account exists" from "an account is entitled to
-- the enrolled question bank":
--
--   profiles.is_provisional  — true for self-service accounts created by the
--                               phone-login funnel (e.g. the Board Readiness
--                               Challenge landing page) until a teacher
--                               converts them to a real enrolled student.
--   tests.audience            — 'enrolled' (default, unchanged behaviour for
--                               every existing test) or 'public' (visible
--                               and attemptable by provisional accounts —
--                               intended for the public diagnostic only).
--
-- Both defaults are chosen so this migration changes nothing for any
-- currently-enrolled student or currently-published test at deploy time.
-- =====================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_provisional boolean NOT NULL DEFAULT false;
ALTER TABLE tests    ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'enrolled';

-- Cohort statistics (v_test_ranks) must never include a provisional attempt —
-- a fake profile skews rank and percentile for every real student in the
-- same cohort.
CREATE OR REPLACE VIEW v_test_ranks AS
SELECT
  a.test_id, a.student_id, a.attempt_no, a.total_marks,
  rank() OVER (PARTITION BY a.test_id ORDER BY a.total_marks DESC NULLS LAST) AS rank,
  round(100 * percent_rank() OVER (PARTITION BY a.test_id
                                   ORDER BY a.total_marks ASC NULLS FIRST)::numeric, 1) AS percentile
FROM attempts a
JOIN profiles p ON p.id = a.student_id
WHERE a.status IN ('submitted', 'auto_submitted')
  AND a.total_marks IS NOT NULL
  AND p.is_provisional = false;

CREATE INDEX IF NOT EXISTS profiles_is_provisional_idx ON profiles (is_provisional);
CREATE INDEX IF NOT EXISTS tests_audience_idx ON tests (audience);
