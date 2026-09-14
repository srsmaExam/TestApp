import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { papers, questions, questionImages, tests, testQuestions, storedFiles } from '../src/db/schema';
import { resolveDataPath } from '../src/lib/paths';

// Only force local PGlite if explicitly requested via --local flag
if (process.argv.includes('--local')) {
  delete process.env.DATABASE_URL;
}

import { getDb, closeDb } from '../src/db/client';

const LOCAL_PAPER_DIR = path.resolve(process.cwd(), 'LocalPaper');
const IMAGES_EXPORT_DIR = path.join(LOCAL_PAPER_DIR, 'images');

async function main() {
  await fsp.mkdir(LOCAL_PAPER_DIR, { recursive: true });
  await fsp.mkdir(IMAGES_EXPORT_DIR, { recursive: true });

  const db = await getDb();
  const dbType = process.env.DATABASE_URL ? 'Configured Database (Supabase / Postgres)' : 'Local PGlite';
  console.log(`[export-local-paper] Connected to ${dbType}.`);

  // 1. Fetch available papers
  const allPapers = await db.select().from(papers);
  if (allPapers.length === 0) {
    console.error('[export-local-paper] No papers found in local database.');
    console.log('  -> First upload a paper and verify questions in local dev: npm run dev');
    process.exitCode = 1;
    return;
  }

  // Check if a paper code or title filter was supplied via CLI argument
  const targetArg = process.argv.slice(2).find((a) => !a.startsWith('-'))?.toLowerCase();
  let selectedPaper = allPapers[0];

  if (targetArg) {
    const match = allPapers.find(
      (p) => p.code.toLowerCase() === targetArg || p.title.toLowerCase().includes(targetArg),
    );
    if (!match) {
      console.error(`[export-local-paper] Could not find paper matching "${targetArg}". Available:`);
      for (const p of allPapers) {
        console.log(`  - [${p.code}] ${p.title} (ID: ${p.id})`);
      }
      process.exitCode = 1;
      return;
    }
    selectedPaper = match;
  } else if (allPapers.length > 1) {
    // If not specified and multiple exist, prefer paper with latest created_at or non-DEMO
    const nonDemo = allPapers.filter((p) => p.code !== 'DEMO-1');
    selectedPaper = nonDemo.length > 0 ? nonDemo[nonDemo.length - 1] : allPapers[allPapers.length - 1];
    console.log(`[export-local-paper] Multiple papers found. Selected latest: [${selectedPaper.code}] "${selectedPaper.title}"`);
  } else {
    console.log(`[export-local-paper] Selected paper: [${selectedPaper.code}] "${selectedPaper.title}"`);
  }

  // 2. Fetch associated questions
  const paperQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.paperId, selectedPaper.id));

  paperQuestions.sort((a, b) => (a.sourceQno ?? 0) - (b.sourceQno ?? 0));

  console.log(`[export-local-paper] Found ${paperQuestions.length} questions for paper.`);

  // 3. Fetch question images
  const qIds = paperQuestions.map((q) => q.id);
  const allImages = [];
  for (const q of paperQuestions) {
    const imgs = await db.select().from(questionImages).where(eq(questionImages.questionId, q.id));
    allImages.push(...imgs);
  }
  console.log(`[export-local-paper] Found ${allImages.length} cropped images.`);

  // 4. Copy image files and extract from stored_files if needed
  let copiedImages = 0;
  for (const img of allImages) {
    const targetImgDir = path.join(IMAGES_EXPORT_DIR, img.questionId);
    await fsp.mkdir(targetImgDir, { recursive: true });
    const targetImgPath = path.join(targetImgDir, `${img.placeholderId}.webp`);

    // Check disk first
    const diskPath = resolveDataPath(img.storagePath);
    if (fs.existsSync(diskPath)) {
      await fsp.copyFile(diskPath, targetImgPath);
      copiedImages++;
    } else {
      // Fall back to stored_files table
      const [sf] = await db.select().from(storedFiles).where(eq(storedFiles.key, img.storagePath));
      if (sf) {
        await fsp.writeFile(targetImgPath, Buffer.from(sf.data, 'base64'));
        copiedImages++;
      } else {
        console.warn(`[export-local-paper] Warning: image file missing for placeholder [[IMG:${img.placeholderId}]]`);
      }
    }
  }

  // 5. Copy PDF file if available
  const pdfDiskPath = resolveDataPath(selectedPaper.filePath);
  const targetPdfPath = path.join(LOCAL_PAPER_DIR, 'source_paper.pdf');
  if (fs.existsSync(pdfDiskPath)) {
    await fsp.copyFile(pdfDiskPath, targetPdfPath);
    console.log(`[export-local-paper] Copied source PDF to ${targetPdfPath}`);
  }

  // 6. Check if a test was built for this paper
  let associatedTest = null;
  const testQMatches = await db.select().from(testQuestions);
  const matchingTestIds = new Set<string>();
  for (const tq of testQMatches) {
    if (qIds.includes(tq.questionId)) {
      matchingTestIds.add(tq.testId);
    }
  }

  if (matchingTestIds.size > 0) {
    const [firstTest] = await db
      .select()
      .from(tests)
      .where(eq(tests.id, Array.from(matchingTestIds)[0]));
    if (firstTest) {
      associatedTest = firstTest;
      console.log(`[export-local-paper] Associated test found: "${firstTest.title}"`);
    }
  }

  // 7. Write consolidated LocalPaper/paper.json
  const exportPayload = {
    _meta: {
      exportedAt: new Date().toISOString(),
      source: 'local-pglite',
      version: '1.0',
    },
    paper: {
      id: selectedPaper.id,
      title: selectedPaper.title,
      code: selectedPaper.code,
      examYear: selectedPaper.examYear,
      pdfPages: selectedPaper.pdfPages,
      originalFilename: selectedPaper.originalFilename,
      fileSizeBytes: selectedPaper.fileSizeBytes,
      sha256: selectedPaper.sha256,
      extractionMeta: selectedPaper.extractionMeta,
    },
    test: associatedTest
      ? {
          title: associatedTest.title,
          description: associatedTest.description,
          durationS: associatedTest.durationS,
          audience: associatedTest.audience ?? 'public',
          isPublished: true,
          resultsPolicy: associatedTest.resultsPolicy ?? 'immediate',
          shuffleQuestions: associatedTest.shuffleQuestions ?? false,
          shuffleOptions: associatedTest.shuffleOptions ?? false,
        }
      : {
          title: selectedPaper.title,
          description: 'Class 10 Board Readiness Diagnostic Test',
          durationS: 1200, // 20 minutes default
          audience: 'public',
          isPublished: true,
          resultsPolicy: 'immediate',
          shuffleQuestions: false,
          shuffleOptions: false,
        },
    questions: paperQuestions.map((q) => ({
      id: q.id,
      humanCode: q.humanCode,
      sourceQno: q.sourceQno,
      sourcePage: q.sourcePage,
      subject: q.subject,
      type: q.type,
      status: 'verified', // Ensure verified status when exported
      body: q.body,
      options: q.options,
      answer: q.answer,
      solution: q.solution,
      difficulty: q.difficulty,
      expectedTimeS: q.expectedTimeS,
      chapter: q.chapter,
      topic: q.topic,
      metadata: q.metadata,
    })),
    questionImages: allImages.map((img) => ({
      id: img.id,
      questionId: img.questionId,
      placeholderId: img.placeholderId,
      storagePath: img.storagePath,
      altText: img.altText,
      widthPx: img.widthPx,
      heightPx: img.heightPx,
      sourcePage: img.sourcePage,
      cropRect: img.cropRect,
    })),
  };

  const outputJsonPath = path.join(LOCAL_PAPER_DIR, 'paper.json');
  await fsp.writeFile(outputJsonPath, JSON.stringify(exportPayload, null, 2), 'utf8');

  console.log('\n[export-local-paper] SUCCESS!');
  console.log(`  Paper:          "${selectedPaper.title}" [${selectedPaper.code}]`);
  console.log(`  Questions:      ${paperQuestions.length} exported`);
  console.log(`  Cropped Images: ${copiedImages} copied to LocalPaper/images/`);
  console.log(`  Master JSON:    ${outputJsonPath}`);
  console.log('\nYou can now commit LocalPaper/ to Git to keep this test permanently in code.');
  console.log('To push to production, run: npm run sync:local-paper');

  await closeDb();
}

main().catch((err) => {
  console.error('[export-local-paper] FAILED:', err);
  process.exitCode = 1;
});
