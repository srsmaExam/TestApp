import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { getDb, closeDb } from '../src/db/client';
import { BACKUPS_DIR, IMAGES_DIR, PAPERS_DIR, ensureDataDirs } from '../src/lib/paths';

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function main() {
  ensureDataDirs();
  const db = await getDb();
  console.log('[backup-production] Connected to database. Extracting all tables...');

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

  const backupData: Record<string, any[]> = {
    _meta: [
      {
        createdAt: new Date().toISOString(),
        databaseUrl: process.env.DATABASE_URL ? 'postgresql://[configured]' : 'pglite',
        purpose: 'pre-wipe-clean-slate',
      },
    ],
  };

  let totalRows = 0;
  for (const table of tables) {
    const res = await db.$client.query(`SELECT * FROM ${table}`);
    backupData[table] = res.rows;
    totalRows += res.rows.length;
    console.log(`  [table] ${table.padEnd(20)}: ${res.rows.length} rows`);
  }

  const backupFolder = path.join(BACKUPS_DIR, `production-pre-wipe-${timestamp()}`);
  await fsp.mkdir(backupFolder, { recursive: true });

  const backupJsonPath = path.join(backupFolder, 'database-dump.json');
  await fsp.writeFile(backupJsonPath, JSON.stringify(backupData, null, 2), 'utf8');

  // Also snapshot local paper and image files if they exist
  if (fs.existsSync(PAPERS_DIR)) {
    await fsp.cp(PAPERS_DIR, path.join(backupFolder, 'local-papers'), { recursive: true });
  }
  if (fs.existsSync(IMAGES_DIR)) {
    await fsp.cp(IMAGES_DIR, path.join(backupFolder, 'local-images'), { recursive: true });
  }

  const stat = await fsp.stat(backupJsonPath);
  console.log(`\n[backup-production] SUCCESS! Wrote ${totalRows} rows (${(stat.size / 1024).toFixed(1)} KB) to:`);
  console.log(`  ${backupFolder}`);

  await closeDb();
}

main().catch((err) => {
  console.error('[backup-production] FAILED:', err);
  process.exitCode = 1;
});
