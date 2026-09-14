import fs from 'node:fs';
import path from 'node:path';
import { and, eq } from 'drizzle-orm';
import { getDb, closeDb } from '../src/db/client.js';
import { papers, questions, type QuestionMetadata } from '../src/db/schema.js';

interface ProfilingRow {
  Qno: number;
  Subject: string;
  Chapter: string;
  Topic: string;
  'Difficulty*': string;
  'Primary Skill': string;
  'Secondary Skill': string;
  'Cognitive Level': string;
  'Concept Tested': string;
  'Prerequisite Concept': string;
  'Question Structure': string;
  'Visual Dependency': string;
  'Calculation Intensity': string;
  'Expected Time': string;
  Answer: string;
  'Diagnostic Weight': number;
}

function parseExpectedTime(raw: string | null | undefined): { commaSeparated: string; seconds: number } {
  if (!raw) return { commaSeparated: '60', seconds: 60 };
  const trimmed = raw.trim();
  const match = trimmed.match(/(\d+)\s*[–\-—]\s*(\d+)/);
  if (match) {
    const min = match[1];
    const max = match[2];
    return {
      commaSeparated: `${min},${max}`,
      seconds: Number(max),
    };
  }
  const single = trimmed.match(/(\d+)/);
  if (single) {
    const s = single[1];
    return { commaSeparated: s, seconds: Number(s) };
  }
  return { commaSeparated: '60', seconds: 60 };
}

function parseDifficulty(raw: string | null | undefined): { level: number; label: string } {
  const norm = (raw ?? '').trim().toLowerCase();
  if (norm === 'easy') return { level: 1, label: 'Easy' };
  if (norm === 'difficult' || norm === 'hard') return { level: 3, label: 'Difficult' };
  return { level: 2, label: 'Medium' };
}

async function main() {
  const jsonPath = path.resolve(process.cwd(), 'data', 'profiling_data.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`[attach-metadata] Missing ${jsonPath}`);
    process.exitCode = 1;
    return;
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const profilingRows: ProfilingRow[] = JSON.parse(raw);
  console.log(`[attach-metadata] Loaded ${profilingRows.length} profiling records.`);

  const db = await getDb();

  // Find the target paper
  const allPapers = await db.select().from(papers);
  if (allPapers.length === 0) {
    console.error('[attach-metadata] No papers found in database.');
    process.exitCode = 1;
    return;
  }

  const paper = allPapers.find((p) => p.code === 'JM-1') ?? allPapers[0];
  console.log(`[attach-metadata] Attaching metadata to paper: [${paper.code}] "${paper.title}" (ID: ${paper.id})`);

  let updatedCount = 0;

  for (const row of profilingRows) {
    const qno = row.Qno;
    const { commaSeparated, seconds } = parseExpectedTime(row['Expected Time']);
    const { level: diffLevel, label: diffLabel } = parseDifficulty(row['Difficulty*']);

    const metadata: QuestionMetadata = {
      primarySkill: row['Primary Skill'] ?? null,
      secondarySkill: row['Secondary Skill'] ?? null,
      cognitiveLevel: row['Cognitive Level'] ?? null,
      conceptTested: row['Concept Tested'] ?? null,
      prerequisiteConcept: row['Prerequisite Concept'] ?? null,
      questionStructure: row['Question Structure'] ?? null,
      visualDependency: row['Visual Dependency'] ?? null,
      calculationIntensity: row['Calculation Intensity'] ?? null,
      expectedTime: commaSeparated, // e.g. "45,60"
      diagnosticWeight: row['Diagnostic Weight'] != null ? Number(row['Diagnostic Weight']) : null,
      difficultyLabel: diffLabel,
    };

    const condition = and(eq(questions.paperId, paper.id), eq(questions.sourceQno, qno));
    const [existing] = await db.select({ id: questions.id }).from(questions).where(condition);

    if (!existing) {
      console.warn(`[attach-metadata] Question Q${qno} not found for paper ${paper.code}`);
      continue;
    }

    await db
      .update(questions)
      .set({
        chapter: row.Chapter ?? null,
        topic: row.Topic ?? null,
        difficulty: diffLevel,
        expectedTimeS: seconds,
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, existing.id));

    updatedCount++;
    console.log(`  ✓ Q${qno.toString().padStart(2, ' ')}: [${row.Subject}] "${row.Chapter} > ${row.Topic}" | Diff: ${diffLabel} | Time: ${commaSeparated}s | Weight: ${row['Diagnostic Weight']}`);
  }

  console.log(`\n[attach-metadata] SUCCESS! Attached metadata to ${updatedCount}/${profilingRows.length} questions.`);

  await closeDb();
}

main().catch((err) => {
  console.error('[attach-metadata] FAILED:', err);
  process.exitCode = 1;
});
