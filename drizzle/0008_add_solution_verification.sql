-- Add solution_verified_at and solution_verified_by to questions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS solution_verified_at timestamptz;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS solution_verified_by uuid REFERENCES profiles(id);
CREATE INDEX IF NOT EXISTS questions_paper_sol_verif_idx ON questions(paper_id, solution_verified_at);
