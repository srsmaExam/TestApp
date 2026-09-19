import { getDb, closeDb } from '../src/db/client';

async function main() {
  const db = await getDb();
  console.log('[check-counts] Connected to database.');

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

  for (const t of tables) {
    const res = await db.$client.query<{ count: string }>(`SELECT count(*) as count FROM ${t}`);
    console.log(`${t.padEnd(20)}: ${res.rows[0].count}`);
  }

  const profilesRes = await db.$client.query<{ role: string; count: string; is_provisional: boolean }>(
    `SELECT role, is_provisional, count(*) as count FROM profiles GROUP BY role, is_provisional`
  );
  console.log('\nProfiles breakdown:');
  console.table(profilesRes.rows);

  const teacherRes = await db.$client.query<{ id: string; username: string; full_name: string; email: string; role: string }>(
    `SELECT id, username, full_name, email, role FROM profiles WHERE role = 'teacher'`
  );
  console.log('\nTeacher / Admin profiles:');
  console.table(teacherRes.rows);

  const testList = await db.$client.query<{ id: string; title: string; audience: string; is_published: boolean }>(
    `SELECT id, title, audience, is_published FROM tests`
  );
  console.log('\nTests:');
  console.table(testList.rows);

  const paperList = await db.$client.query<{ id: string; title: string; code: string }>(
    `SELECT id, title, code FROM papers`
  );
  console.log('\nPapers:');
  console.table(paperList.rows);

  const studentList = await db.$client.query<{ id: string; username: string; full_name: string; phone: string; role: string; is_provisional: boolean }>(
    `SELECT id, username, full_name, phone, role, is_provisional FROM profiles WHERE role != 'teacher'`
  );
  console.log('\nStudent profiles to be deleted:');
  console.table(studentList.rows);

  const allTables = await db.$client.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
  );
  console.log('\nAll public tables in DB:', allTables.rows.map(r => r.table_name));

  await closeDb();
}

main().catch((err) => {
  console.error('[check-counts] error:', err);
  process.exitCode = 1;
});
