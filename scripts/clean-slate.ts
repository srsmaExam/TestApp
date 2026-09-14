import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { getDb, closeDb } from '../src/db/client';
import { IMAGES_DIR, PAPERS_DIR, ensureDataDirs } from '../src/lib/paths';

async function main() {
  const db = await getDb();
  console.log('[clean-slate] Connected to database.');

  // 1. Safety verification: ensure at least one teacher account exists
  const teacherCheck = await db.$client.query<{ id: string; username: string; email: string }>(
    `SELECT id, username, email FROM profiles WHERE role = 'teacher'`
  );

  if (teacherCheck.rows.length === 0) {
    throw new Error('FATAL: No teacher/admin account found! Aborting wipe to prevent total lock-out.');
  }

  console.log(`[clean-slate] Preserving teacher account: "${teacherCheck.rows[0].username}" (${teacherCheck.rows[0].email})`);

  // 2. Perform transactional deletion
  console.log('[clean-slate] Beginning transactional wipe...');
  await db.$client.query('BEGIN');

  try {
    const rEvents = (await db.$client.query('DELETE FROM attempt_events')) as any;
    console.log(`  Purged attempt_events: ${rEvents.rowCount ?? 0} rows`);

    const rAnswers = (await db.$client.query('DELETE FROM attempt_answers')) as any;
    console.log(`  Purged attempt_answers: ${rAnswers.rowCount ?? 0} rows`);

    const rAttempts = (await db.$client.query('DELETE FROM attempts')) as any;
    console.log(`  Purged attempts: ${rAttempts.rowCount ?? 0} rows`);

    const rTestQuestions = (await db.$client.query('DELETE FROM test_questions')) as any;
    console.log(`  Purged test_questions: ${rTestQuestions.rowCount ?? 0} rows`);

    const rTests = (await db.$client.query('DELETE FROM tests')) as any;
    console.log(`  Purged tests: ${rTests.rowCount ?? 0} rows`);

    const rRevisions = (await db.$client.query('DELETE FROM question_revisions')) as any;
    console.log(`  Purged question_revisions: ${rRevisions.rowCount ?? 0} rows`);

    const rImages = (await db.$client.query('DELETE FROM question_images')) as any;
    console.log(`  Purged question_images: ${rImages.rowCount ?? 0} rows`);

    const rQuestions = (await db.$client.query('DELETE FROM questions')) as any;
    console.log(`  Purged questions: ${rQuestions.rowCount ?? 0} rows`);

    const rPapers = (await db.$client.query('DELETE FROM papers')) as any;
    console.log(`  Purged papers: ${rPapers.rowCount ?? 0} rows`);

    const rStoredFiles = (await db.$client.query('DELETE FROM stored_files')) as any;
    console.log(`  Purged stored_files: ${rStoredFiles.rowCount ?? 0} rows`);

    const rStudents = (await db.$client.query("DELETE FROM profiles WHERE role != 'teacher'")) as any;
    console.log(`  Purged student profiles: ${rStudents.rowCount ?? 0} rows`);

    await db.$client.query('COMMIT');
    console.log('[clean-slate] Database transaction COMMITTED successfully.');
  } catch (err) {
    await db.$client.query('ROLLBACK');
    console.error('[clean-slate] Transaction failed! ROLLED BACK all changes.', err);
    throw err;
  }

  // 3. Clear local file cache in data/papers and data/images
  try {
    if (fs.existsSync(PAPERS_DIR)) {
      const files = await fsp.readdir(PAPERS_DIR);
      for (const f of files) {
        await fsp.rm(path.join(PAPERS_DIR, f), { recursive: true, force: true });
      }
      console.log(`[clean-slate] Cleared local ${PAPERS_DIR}`);
    }
    if (fs.existsSync(IMAGES_DIR)) {
      const files = await fsp.readdir(IMAGES_DIR);
      for (const f of files) {
        await fsp.rm(path.join(IMAGES_DIR, f), { recursive: true, force: true });
      }
      console.log(`[clean-slate] Cleared local ${IMAGES_DIR}`);
    }
    ensureDataDirs();
  } catch (fileErr) {
    console.warn('[clean-slate] Notice: local files cleanup encountered non-fatal error:', fileErr);
  }

  // 4. Verify post-wipe counts
  console.log('\n[clean-slate] POST-WIPE VERIFICATION:');
  const tables = [
    'profiles',
    'papers',
    'questions',
    'question_images',
    'question_revisions',
    'tests',
    'test_questions',
    'attempts',
    'attempt_answers',
    'attempt_events',
    'stored_files',
  ];

  const summary: { Table: string; 'Remaining Rows': number; Status: string }[] = [];
  for (const table of tables) {
    const res = await db.$client.query<{ count: string }>(`SELECT count(*) as count FROM ${table}`);
    const count = Number(res.rows[0].count);
    const expected = table === 'profiles' ? 1 : 0;
    summary.push({
      Table: table,
      'Remaining Rows': count,
      Status: count === expected ? 'CLEAN' : 'UNEXPECTED',
    });
  }

  console.table(summary);

  const remainingProfiles = await db.$client.query<{ id: string; username: string; full_name: string; email: string; role: string }>(
    `SELECT id, username, full_name, email, role FROM profiles`
  );
  console.log('Remaining Profile in DB:');
  console.table(remainingProfiles.rows);

  console.log('\n[clean-slate] Platform reset complete. Ready for official launch with clean slate!');
  await closeDb();
}

main().catch((err) => {
  console.error('[clean-slate] Fatal execution error:', err);
  process.exitCode = 1;
});
