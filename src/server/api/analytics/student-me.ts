import { and, desc, eq, inArray, isNotNull, or, sql } from 'drizzle-orm';
import { apiSession } from '@/lib/auth';
import { HttpError, json, withApi } from '@/lib/http';
import { getDb } from '@/db/client';
import { attemptAnswers, attempts, profiles, questions, testQuestions, tests } from '@/db/schema';
import {
  evaluateDiagnosticReport,
  getSampleDiagnosticReport,
  type QuestionMetadataItem,
  type StudentQuestionResponse,
} from '@/lib/diagnostic-evaluator';

export const GET = withApi(async (req) => {
  const session = await apiSession();
  const db = await getDb();

  let targetUserId = session.userId;
  let targetStudentName = session.fullName || 'Student';
  let isReportUnlocked = false;

  let targetGender: string | null = null;

  const url = new URL(req.url);
  const queryStudentId = url.searchParams.get('studentId');

  let isFormFilled = false;
  let targetBoard: string | null = null;
  let targetSchool: string | null = null;
  let targetCity: string | null = null;
  let targetClassLevel: string | null = null;

  if (session.role === 'teacher') {
    if (queryStudentId) {
      const [targetStudent] = await db
        .select({
          id: profiles.id,
          fullName: profiles.fullName,
          role: profiles.role,
          gender: profiles.gender,
          board: profiles.board,
          school: profiles.school,
          city: profiles.city,
          classLevel: profiles.classLevel,
          whatsappConsent: profiles.whatsappConsent,
        })
        .from(profiles)
        .where(eq(profiles.id, queryStudentId));

      if (!targetStudent || targetStudent.role !== 'student') {
        throw new HttpError(404, 'not_found', 'Student profile not found.');
      }
      targetUserId = targetStudent.id;
      targetStudentName = targetStudent.fullName;
      targetGender = targetStudent.gender;
      isFormFilled = Boolean(targetStudent.whatsappConsent && targetStudent.city);
      targetBoard = targetStudent.board ?? null;
      targetSchool = targetStudent.school ?? null;
      targetCity = targetStudent.city ?? null;
      targetClassLevel = targetStudent.classLevel ?? 'X';
    }
    isReportUnlocked = true;
  } else if (session.role === 'student') {
    targetUserId = session.userId;
    targetStudentName = session.fullName || 'Student';
    const [profile] = await db
      .select({
        whatsappConsent: profiles.whatsappConsent,
        city: profiles.city,
        board: profiles.board,
        school: profiles.school,
        classLevel: profiles.classLevel,
        isProvisional: profiles.isProvisional,
        gender: profiles.gender,
      })
      .from(profiles)
      .where(eq(profiles.id, session.userId));

    isFormFilled = Boolean(profile && profile.whatsappConsent && profile.city);
    isReportUnlocked = isFormFilled;
    targetGender = profile?.gender ?? null;
    targetBoard = profile?.board ?? null;
    targetSchool = profile?.school ?? null;
    targetCity = profile?.city ?? null;
    targetClassLevel = profile?.classLevel ?? 'X';
  } else {
    throw new HttpError(403, 'forbidden', 'Access denied.');
  }

  // Completed attempts by this student whose results are available.
  // For students, gated on results_policy: attempts for 'on_release' tests with released_at IS NULL
  // are excluded so scores/rankings are not leaked before teacher release.
  // For teachers, all submitted attempts are visible.
  const releaseCondition =
    session.role === 'teacher'
      ? undefined
      : or(eq(tests.resultsPolicy, 'immediate'), isNotNull(tests.releasedAt));

  const whereConditions = [
    eq(attempts.studentId, targetUserId),
    sql`${attempts.status} <> 'in_progress'`,
  ];
  if (releaseCondition) {
    whereConditions.push(releaseCondition);
  }

  const studentAttempts = await db
    .select({
      attemptId: attempts.id,
      testId: attempts.testId,
      testTitle: tests.title,
      attemptNo: attempts.attemptNo,
      startedAt: attempts.startedAt,
      submittedAt: attempts.submittedAt,
      totalMarks: attempts.totalMarks,
      maxMarks: attempts.maxMarks,
      totalTimeS: attempts.totalTimeS,
    })
    .from(attempts)
    .innerJoin(tests, eq(tests.id, attempts.testId))
    .where(and(...whereConditions))
    .orderBy(desc(attempts.submittedAt));

  if (studentAttempts.length === 0) {
    const sampleDiagnosticReport = getSampleDiagnosticReport(targetStudentName);
    return json({
      studentId: targetUserId,
      studentName: targetStudentName,
      isReportUnlocked,
      totalAttempts: 0,
      avgScore: 0,
      avgPercentile: 0,
      recentTests: [],
      subjectBreakdown: {
        physics: { correct: 0, attempted: 0, total: 0, accuracy: 0 },
        chemistry: { correct: 0, attempted: 0, total: 0, accuracy: 0 },
        maths: { correct: 0, attempted: 0, total: 0, accuracy: 0 },
        biology: { correct: 0, attempted: 0, total: 0, accuracy: 0 },
      },
      chapterBreakdown: [],
      diagnosticReport: null,
      sampleDiagnosticReport,
    });
  }

  // Fetch ranks and percentiles for these attempts from v_test_ranks
  const ranksRes = await db.$client.query<{
    test_id: string;
    student_id: string;
    attempt_no: number;
    rank: number;
    percentile: number;
  }>('SELECT test_id, student_id, attempt_no, rank, percentile FROM v_test_ranks WHERE student_id = $1', [
    targetUserId,
  ]);

  const ranksMap = new Map(ranksRes.rows.map((r) => [`${r.test_id}-${r.attempt_no}`, r]));

  const attemptIds = studentAttempts.map((a) => a.attemptId);

  // Load all question responses for chapter and subject accuracy
  const answers = await db
    .select({
      subject: questions.subject,
      chapter: questions.chapter,
      isCorrect: attemptAnswers.isCorrect,
      response: attemptAnswers.response,
    })
    .from(attemptAnswers)
    .innerJoin(questions, eq(questions.id, attemptAnswers.questionId))
    .where(inArray(attemptAnswers.attemptId, attemptIds));

  const subjects: Record<string, { correct: number; attempted: number; total: number; accuracy: number }> = {
    physics: { correct: 0, attempted: 0, total: 0, accuracy: 0 },
    chemistry: { correct: 0, attempted: 0, total: 0, accuracy: 0 },
    maths: { correct: 0, attempted: 0, total: 0, accuracy: 0 },
    biology: { correct: 0, attempted: 0, total: 0, accuracy: 0 },
  };

  const chapterMap = new Map<string, { chapter: string; subject: string; correct: number; attempted: number; total: number }>();

  for (const a of answers) {
    const isAtt = a.response !== null && a.response !== undefined;
    const isCorr = Boolean(a.isCorrect);

    if (subjects[a.subject]) {
      subjects[a.subject].total += 1;
      if (isAtt) subjects[a.subject].attempted += 1;
      if (isCorr) subjects[a.subject].correct += 1;
    }

    const chap = a.chapter ?? 'General';
    const key = `${a.subject}-${chap}`;
    if (!chapterMap.has(key)) {
      chapterMap.set(key, { chapter: chap, subject: a.subject, correct: 0, attempted: 0, total: 0 });
    }
    const c = chapterMap.get(key)!;
    c.total += 1;
    if (isAtt) c.attempted += 1;
    if (isCorr) c.correct += 1;
  }

  for (const s of Object.values(subjects)) {
    s.accuracy = s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0;
  }

  const chapterBreakdown = Array.from(chapterMap.values())
    .map((c) => ({
      ...c,
      accuracy: c.attempted > 0 ? Math.round((c.correct / c.attempted) * 100) : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy); // Weakest chapters first

  let totalPercentile = 0;
  let percentileCount = 0;
  let totalScore = 0;

  const recentTests = studentAttempts.map((a) => {
    const rInfo = ranksMap.get(`${a.testId}-${a.attemptNo}`);
    const score = Number(a.totalMarks ?? 0);
    const pctl = rInfo && rInfo.percentile !== null ? Number(rInfo.percentile) : null;
    const rank = rInfo && rInfo.rank !== null ? Number(rInfo.rank) : null;

    totalScore += score;
    if (pctl !== null) {
      totalPercentile += pctl;
      percentileCount++;
    }

    return {
      attemptId: a.attemptId,
      testId: a.testId,
      testTitle: a.testTitle,
      attemptNo: a.attemptNo,
      score,
      maxMarks: Number(a.maxMarks ?? 0),
      rank,
      percentile: pctl,
      submittedAt: a.submittedAt,
      timeSpentMin: Math.round((a.totalTimeS ?? 0) / 60),
    };
  });

  // Dynamically compute diagnostic evaluation for the latest attempt
  let diagnosticReport = null;
  if (studentAttempts.length > 0) {
    const latestAttempt = studentAttempts[0];
    const latestQuestions = await db
      .select({
        id: questions.id,
        position: testQuestions.position,
        subject: questions.subject,
        chapter: questions.chapter,
        topic: questions.topic,
        difficulty: questions.difficulty,
        expectedTimeS: questions.expectedTimeS,
        answer: questions.answer,
        metadata: questions.metadata,
        isCorrect: attemptAnswers.isCorrect,
        response: attemptAnswers.response,
        timeSpentMs: attemptAnswers.timeSpentMs,
      })
      .from(testQuestions)
      .innerJoin(questions, eq(questions.id, testQuestions.questionId))
      .leftJoin(
        attemptAnswers,
        and(
          eq(attemptAnswers.attemptId, latestAttempt.attemptId),
          eq(attemptAnswers.questionId, questions.id),
        ),
      )
      .where(eq(testQuestions.testId, latestAttempt.testId))
      .orderBy(testQuestions.position);

    if (latestQuestions.length > 0) {
      const metadataList: QuestionMetadataItem[] = latestQuestions.map((q, idx) => {
        const m = (q.metadata as any) || {};
        return {
          qno: q.position ?? idx + 1,
          subject:
            q.subject === 'maths'
              ? 'Maths'
              : q.subject.charAt(0).toUpperCase() + q.subject.slice(1),
          chapter: q.chapter || 'General',
          topic: q.topic || 'General',
          conceptTested: m.conceptTested || null,
          prerequisiteConcept: m.prerequisiteConcept || null,
          difficulty:
            m.difficultyLabel ||
            (q.difficulty === 1 ? 'Easy' : q.difficulty === 3 ? 'Difficult' : 'Medium'),
          primarySkill: m.primarySkill || 'Concept Application',
          secondarySkill: m.secondarySkill || null,
          questionStructure: m.questionStructure || 'Direct',
          visualDependency: m.visualDependency || 'None',
          expectedTime: m.expectedTime || `${q.expectedTimeS || 60}`,
          answer:
            typeof q.answer === 'object' && (q.answer as any)?.key
              ? (q.answer as any).key
              : typeof q.answer === 'object' && (q.answer as any)?.value !== undefined
              ? String((q.answer as any).value)
              : String(q.answer || 'A'),
          diagnosticWeight: Number(m.diagnosticWeight || 1),
        };
      });

      const responses: StudentQuestionResponse[] = latestQuestions.map((q, idx) => {
        const isAtt = q.response !== null && q.response !== undefined;
        const sel =
          typeof q.response === 'object' && (q.response as any)?.key
            ? (q.response as any).key
            : (q.response as any)?.value !== undefined
            ? String((q.response as any).value)
            : null;
        return {
          qno: q.position ?? idx + 1,
          attempted: isAtt,
          selectedOption: sel,
          timeTakenSeconds: Math.round((q.timeSpentMs ?? 0) / 1000),
        };
      });

      diagnosticReport = evaluateDiagnosticReport(metadataList, {
        studentName: targetStudentName,
        responses,
      });
    }
  }

  return json({
    studentId: targetUserId,
    studentName: targetStudentName,
    gender: targetGender,
    isReportUnlocked,
    studentDetails: {
      board: targetBoard,
      school: targetSchool,
      city: targetCity,
      classLevel: targetClassLevel,
      gender: targetGender,
      isFormFilled,
    },
    totalAttempts: studentAttempts.length,
    avgScore: Math.round((totalScore / studentAttempts.length) * 10) / 10,
    avgPercentile:
      percentileCount > 0 ? Math.round((totalPercentile / percentileCount) * 10) / 10 : null,
    recentTests,
    subjectBreakdown: subjects,
    chapterBreakdown,
    diagnosticReport: isReportUnlocked ? diagnosticReport : null,
    sampleDiagnosticReport: null,
  });
});
