/**
 * SRSMA Diagnostic Evaluation Engine
 * Class X Board Readiness Challenge Evaluator
 *
 * Dynamically computes evaluation metrics, breakdowns, skills, structural patterns,
 * strengths, priority gaps, topics to revisit, and analytical narratives strictly from
 * question profiling metadata and student test responses without hardcoding totals.
 */

export interface QuestionMetadataItem {
  qno: number;
  subject: string;
  chapter: string;
  topic: string;
  conceptTested?: string | null;
  prerequisiteConcept?: string | null;
  difficulty: 'Easy' | 'Medium' | 'Difficult' | string;
  primarySkill: string;
  secondarySkill?: string | null;
  questionStructure: string;
  visualDependency: 'High' | 'Medium' | 'Low' | 'None' | string;
  expectedTime: string;
  answer: string;
  diagnosticWeight: number;
}

export interface StudentQuestionResponse {
  qno: number;
  attempted: boolean;
  selectedOption: string | null;
  timeTakenSeconds: number;
}

export interface StudentResponsePayload {
  studentName: string;
  studentGender?: 'Male' | 'Female' | string | null;
  responses: StudentQuestionResponse[];
}

export type PreparationLevel =
  | 'Basic'
  | 'Conceptually Strong'
  | 'High achievement Potential'
  | 'ADVANCED'
  | 'PROFICIENT'
  | 'BASIC'
  | 'NEEDS IMMEDIATE INTERVENTION';
export type SkillValueCategory = 'Good' | 'Average' | 'Needs Strengthening';
export type PriorityLevel = 'High Priority' | 'Medium Priority' | 'Low Priority';
export type RevisitCategory =
  | 'Pacing / Time Management'
  | 'Conceptual / Calculation Gap'
  | 'High Friction Gap'
  | 'Rapid Guesswork'
  | 'Unattempted';

export interface AreaPerformance {
  score: number;
  totalQuestions: number;
  percentage: number;
}

export interface SkillProfileItem {
  name: string;
  scorePercent: number;
  category: SkillValueCategory;
  earnedWeight: number;
  totalWeight: number;
}

export interface QuestionStructurePerformance {
  type: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface StrengthItem {
  rank: number;
  name: string;
  scoreDetails: string;
  percentage: number;
  reason: string;
  isEmerging?: boolean;
}

export interface DifficultyLevelPerformance {
  level: 'Easy' | 'Medium' | 'Hard';
  score: number;
  total: number;
  percentage: number;
}

export interface SubjectDifficultyBreakdown {
  easy: DifficultyLevelPerformance;
  medium: DifficultyLevelPerformance;
  hard: DifficultyLevelPerformance;
}

export interface SubjectDifficultyBreakdowns {
  mathematics: SubjectDifficultyBreakdown;
  science: SubjectDifficultyBreakdown;
}

export interface PriorityGapItem {
  rank: number;
  name: string;
  scorePercent: number;
  priority: PriorityLevel;
}

export interface TopicToRevisitItem {
  qno: number;
  subject: string;
  chapter: string;
  topic: string;
  issueObserved: string;
  category: RevisitCategory;
  recommendedFocusArea: string;
  timeTaken: number;
  expectedLimit: number;
  isCorrect: boolean;
  attempted: boolean;
}

export interface QuestionAuditItem {
  qno: number;
  subject: string;
  chapter: string;
  topic: string;
  difficulty: string;
  primarySkill: string;
  secondarySkill: string | null;
  questionStructure: string;
  visualDependency: string;
  expectedTimeRaw: string;
  expectedUpperBoundS: number;
  timeTakenS: number;
  timeLimitExceeded: boolean;
  timeManagementScore?: number;
  timeManagementLabel?: string;
  isGuesswork?: boolean;
  correctAnswer: string;
  selectedOption: string | null;
  attempted: boolean;
  isCorrect: boolean;
  diagnosticWeight: number;
  weightedScore: number;
  revisitIssue: string | null;
  revisitCategory: RevisitCategory | null;
}

export type TimeManagementRating = 'Good' | 'Medium' | 'Poor';

export interface QuestionTimeEvaluation {
  qno: number;
  timeTakenSeconds: number;
  ets: number;
  multiplier: number;
  score: 1 | 2 | 3;
  label: 'Good time management' | 'Medium time management' | 'Poor time management';
  rating: TimeManagementRating;
  isGuesswork: boolean;
  attempted: boolean;
}

export interface TimeManagementSummary {
  totalScore: number;
  maxPossibleScore: number;
  finalScorePercent: number;
  rating: TimeManagementRating;
  attemptedCount: number;
  guessworkQuestions: number[];
  items: QuestionTimeEvaluation[];
}

export interface DiagnosticCalculationSteps {
  scoring: {
    totalQuestionsN: number;
    rawScoreSum: number;
    diagnosticWeightSum: number;
    weightedScoreSum: number;
    briFraction: string;
    briResult: number;
    levelRule: string;
    levelResult: PreparationLevel;
  };
  breakdowns: Array<{
    area: string;
    filterCondition: string;
    matchingQuestions: number[];
    score: number;
    total: number;
    formula: string;
    percentage: number;
  }>;
  skills: Array<{
    skillName: string;
    filterCondition: string;
    matchingQuestions: number[];
    earnedWeights: number;
    totalWeights: number;
    formula: string;
    percentage: number;
    categoryRule: string;
    categoryResult: SkillValueCategory;
  }>;
  structures: Array<{
    structureType: string;
    matchingQuestions: number[];
    correctCount: number;
    totalCount: number;
    formula: string;
    percentage: number;
  }>;
  strengthsRanking: Array<{
    rank: number;
    name: string;
    percentage: number;
    scoreDetails: string;
    reason: string;
  }>;
  priorityGapsRanking: Array<{
    rank: number;
    name: string;
    scorePercent: number;
    priority: PriorityLevel;
    ruleApplied: string;
  }>;
  allChapterScores: Array<{
    chapter: string;
    subject: string;
    correct: number;
    total: number;
    percentage: number;
    priority: PriorityLevel;
  }>;
  timeManagement?: {
    attemptedCount: number;
    totalScore: number;
    maxPossibleScore: number;
    formula: string;
    finalScorePercent: number;
    ratingRule: string;
    ratingResult: TimeManagementRating;
    guessworkQuestions: number[];
  };
  questionAudit: QuestionAuditItem[];
}

export interface DiagnosticEvaluationResult {
  studentName: string;
  studentGender?: 'Male' | 'Female' | string | null;
  totalQuestions: number;
  totalRawScore: number;
  totalDiagnosticWeight: number;
  totalWeightedScore: number;
  briScore: number;
  levelOfPreparation: PreparationLevel;

  // Breakdowns
  breakdown: {
    mathematics: AreaPerformance;
    science: AreaPerformance;
    physics: AreaPerformance;
    chemistry: AreaPerformance;
    biology: AreaPerformance;
    easy: AreaPerformance;
    medium: AreaPerformance;
    difficult: AreaPerformance;
    difficultyBySubject?: SubjectDifficultyBreakdowns;
  };

  subjectDifficultyBreakdowns: SubjectDifficultyBreakdowns;

  // Primary Skills & Accuracy
  skills: {
    conceptualFoundation: SkillProfileItem;
    conceptApplication: SkillProfileItem;
    problemSolving: SkillProfileItem;
    accuracy: {
      scorePercent: number;
      category: SkillValueCategory;
      correctCount: number;
      attemptedCount: number;
    };
    questionInterpretation: SkillProfileItem;
  };

  // 7 Question Structure Types
  structures: QuestionStructurePerformance[];

  // Insights & Patterns
  strengthsTitle: string;
  strengths: StrengthItem[];
  priorityGaps: PriorityGapItem[];
  topicsToRevisit: TopicToRevisitItem[];

  // Time Management & Pacing
  timeManagement: TimeManagementSummary;

  // Dynamic Narratives
  keyInsight: string;
  performancePatternInsight: string;

  // Plain Text formatted report
  plainTextReport: string;

  // Page 4: Calculation Steps & Audit Trail (Development Only)
  calculationSteps: DiagnosticCalculationSteps;
}

export function parseExpectedTimeUpperBound(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) return 60;
  if (typeof raw === 'number') return raw > 0 ? raw : 60;
  const str = String(raw).trim();
  const rangeMatch = str.match(/(\d+)\s*[–\-—,]\s*(\d+)/);
  if (rangeMatch) {
    return Number(rangeMatch[2]);
  }
  const singleMatch = str.match(/(\d+)/);
  if (singleMatch) {
    return Number(singleMatch[1]);
  }
  return 60;
}

export function getQuestionETS(
  rawExpectedTime?: string | number | null,
  expectedTimeS?: number | null,
): number {
  if (rawExpectedTime !== null && rawExpectedTime !== undefined && rawExpectedTime !== '') {
    const parsed = parseExpectedTimeUpperBound(rawExpectedTime);
    if (parsed > 0) return parsed;
  }
  if (expectedTimeS && expectedTimeS > 0) {
    return expectedTimeS;
  }
  return 60;
}

export function evaluateQuestionTimeManagement(
  timeTakenSeconds: number,
  ets: number,
): {
  score: 1 | 2 | 3;
  label: 'Good time management' | 'Medium time management' | 'Poor time management';
  rating: TimeManagementRating;
} {
  const safeEts = Math.max(1, ets);
  if (timeTakenSeconds < 1.5 * safeEts) {
    return {
      score: 3,
      label: 'Good time management',
      rating: 'Good',
    };
  }
  if (timeTakenSeconds > 2 * safeEts) {
    return {
      score: 1,
      label: 'Poor time management',
      rating: 'Poor',
    };
  }
  return {
    score: 2,
    label: 'Medium time management',
    rating: 'Medium',
  };
}

export function classifyTimeManagementRating(percentage: number): TimeManagementRating {
  if (percentage <= 33) return 'Poor';
  if (percentage >= 66) return 'Good';
  return 'Medium';
}

export function evaluateTimeManagement(
  questions: Array<{
    qno: number;
    attempted: boolean;
    timeTakenSeconds: number;
    expectedUpperBoundS: number;
  }>,
): TimeManagementSummary {
  let totalScore = 0;
  let attemptedCount = 0;
  const guessworkQuestions: number[] = [];
  const items: QuestionTimeEvaluation[] = [];

  for (const q of questions) {
    const isGuesswork = q.attempted && q.timeTakenSeconds < 8;
    if (isGuesswork) {
      guessworkQuestions.push(q.qno);
    }

    const ets = Math.max(1, q.expectedUpperBoundS);
    const evalResult = evaluateQuestionTimeManagement(q.timeTakenSeconds, ets);
    const multiplier = Number((q.timeTakenSeconds / ets).toFixed(2));

    if (q.attempted) {
      totalScore += evalResult.score;
      attemptedCount += 1;
    }

    items.push({
      qno: q.qno,
      timeTakenSeconds: q.timeTakenSeconds,
      ets,
      multiplier,
      score: evalResult.score,
      label: evalResult.label,
      rating: evalResult.rating,
      isGuesswork,
      attempted: q.attempted,
    });
  }

  const maxPossibleScore = attemptedCount * 3;
  const finalScorePercent =
    maxPossibleScore > 0
      ? Math.round((totalScore / maxPossibleScore) * 100)
      : 0;

  const rating = classifyTimeManagementRating(finalScorePercent);

  return {
    totalScore,
    maxPossibleScore,
    finalScorePercent,
    rating,
    attemptedCount,
    guessworkQuestions,
    items,
  };
}

export function classifySkillValue(percentage: number): SkillValueCategory {
  if (percentage > (2 / 3) * 100) return 'Good';
  if (percentage > (1 / 3) * 100) return 'Average';
  return 'Needs Strengthening';
}

export function classifyPreparationLevel(bri: number): PreparationLevel {
  if (bri >= 80) return 'High achievement Potential';
  if (bri >= 60) return 'Conceptually Strong';
  return 'Basic';
}

export function classifyPriority(percentage: number): PriorityLevel {
  if (percentage < 40) return 'High Priority';
  if (percentage <= 55) return 'Medium Priority';
  return 'Low Priority';
}

/**
 * Main evaluation function
 */
export function evaluateDiagnosticReport(
  metadata: QuestionMetadataItem[],
  student: StudentResponsePayload,
): DiagnosticEvaluationResult {
  const respMap = new Map<number, StudentQuestionResponse>();
  for (const r of student.responses) {
    respMap.set(r.qno, r);
  }

  const N = metadata.length;
  let totalRawScore = 0;
  let totalDiagnosticWeight = 0;
  let totalWeightedScore = 0;
  let totalAttempted = 0;
  let totalCorrect = 0;

  type EvaluatedQ = {
    meta: QuestionMetadataItem;
    attempted: boolean;
    selectedOption: string | null;
    timeTakenSeconds: number;
    isCorrect: boolean;
    weight: number;
    upperLimit: number;
  };

  const evaluatedQuestions: EvaluatedQ[] = [];

  for (const q of metadata) {
    const r = respMap.get(q.qno);
    const attempted = Boolean(r?.attempted && r?.selectedOption !== null && r?.selectedOption !== undefined);
    const selected = r?.selectedOption ? String(r.selectedOption).trim().toUpperCase() : null;
    const correctAns = String(q.answer).trim().toUpperCase();
    const isCorrect = attempted && selected === correctAns;
    const weight = Number(q.diagnosticWeight ?? 1);
    const timeTaken = Number(r?.timeTakenSeconds ?? 0);
    const upperLimit = parseExpectedTimeUpperBound(q.expectedTime);

    totalDiagnosticWeight += weight;
    if (attempted) totalAttempted++;
    if (isCorrect) {
      totalRawScore += 1;
      totalCorrect += 1;
      totalWeightedScore += weight;
    }

    evaluatedQuestions.push({
      meta: q,
      attempted,
      selectedOption: selected,
      timeTakenSeconds: timeTaken,
      isCorrect,
      weight,
      upperLimit,
    });
  }

  // Board Readiness Index (BRI) Score (%)
  const briScore =
    totalDiagnosticWeight > 0
      ? Math.round((totalWeightedScore / totalDiagnosticWeight) * 1000) / 10
      : 0;

  const levelOfPreparation = classifyPreparationLevel(briScore);

  // Subject breakdowns
  const mathsQs = evaluatedQuestions.filter(
    (eq) => eq.meta.subject.toLowerCase() === 'maths' || eq.meta.subject.toLowerCase() === 'mathematics',
  );
  const scienceQs = evaluatedQuestions.filter((eq) =>
    ['physics', 'chemistry', 'biology', 'science'].includes(eq.meta.subject.toLowerCase()),
  );

  const mathsScore = mathsQs.filter((q) => q.isCorrect).length;
  const scienceScore = scienceQs.filter((q) => q.isCorrect).length;

  // Science Sub-divisions (Physics, Chemistry, Biology)
  const physicsQs = evaluatedQuestions.filter((eq) => eq.meta.subject.toLowerCase() === 'physics');
  const chemistryQs = evaluatedQuestions.filter((eq) => eq.meta.subject.toLowerCase() === 'chemistry');
  const biologyQs = evaluatedQuestions.filter((eq) => eq.meta.subject.toLowerCase() === 'biology');

  const physicsScore = physicsQs.filter((q) => q.isCorrect).length;
  const chemistryScore = chemistryQs.filter((q) => q.isCorrect).length;
  const biologyScore = biologyQs.filter((q) => q.isCorrect).length;

  const mathsPerf: AreaPerformance = {
    score: mathsScore,
    totalQuestions: mathsQs.length,
    percentage: mathsQs.length > 0 ? Math.round((mathsScore / mathsQs.length) * 100) : 0,
  };

  const sciencePerf: AreaPerformance = {
    score: scienceScore,
    totalQuestions: scienceQs.length,
    percentage: scienceQs.length > 0 ? Math.round((scienceScore / scienceQs.length) * 100) : 0,
  };

  const physicsPerf: AreaPerformance = {
    score: physicsScore,
    totalQuestions: physicsQs.length,
    percentage: physicsQs.length > 0 ? Math.round((physicsScore / physicsQs.length) * 100) : 0,
  };

  const chemistryPerf: AreaPerformance = {
    score: chemistryScore,
    totalQuestions: chemistryQs.length,
    percentage: chemistryQs.length > 0 ? Math.round((chemistryScore / chemistryQs.length) * 100) : 0,
  };

  const biologyPerf: AreaPerformance = {
    score: biologyScore,
    totalQuestions: biologyQs.length,
    percentage: biologyQs.length > 0 ? Math.round((biologyScore / biologyQs.length) * 100) : 0,
  };

  // Difficulty breakdowns
  const isEasy = (d: string) => d.toLowerCase() === 'easy' || d === '1';
  const isMed = (d: string) => d.toLowerCase() === 'medium' || d === '2';
  const isDiff = (d: string) => d.toLowerCase() === 'difficult' || d.toLowerCase() === 'hard' || d === '3';

  const easyQs = evaluatedQuestions.filter((q) => isEasy(String(q.meta.difficulty)));
  const medQs = evaluatedQuestions.filter((q) => isMed(String(q.meta.difficulty)));
  const diffQs = evaluatedQuestions.filter((q) => isDiff(String(q.meta.difficulty)));

  const easyScore = easyQs.filter((q) => q.isCorrect).length;
  const medScore = medQs.filter((q) => q.isCorrect).length;
  const diffScore = diffQs.filter((q) => q.isCorrect).length;

  const easyPerf: AreaPerformance = {
    score: easyScore,
    totalQuestions: easyQs.length,
    percentage: easyQs.length > 0 ? Math.round((easyScore / easyQs.length) * 100) : 0,
  };
  const medPerf: AreaPerformance = {
    score: medScore,
    totalQuestions: medQs.length,
    percentage: medQs.length > 0 ? Math.round((medScore / medQs.length) * 100) : 0,
  };
  const diffPerf: AreaPerformance = {
    score: diffScore,
    totalQuestions: diffQs.length,
    percentage: diffQs.length > 0 ? Math.round((diffScore / diffQs.length) * 100) : 0,
  };

  // Subject Difficulty breakdowns (Mathematics and Science)
  const mathsEasyQs = mathsQs.filter((q) => isEasy(String(q.meta.difficulty)));
  const mathsMedQs = mathsQs.filter((q) => isMed(String(q.meta.difficulty)));
  const mathsDiffQs = mathsQs.filter((q) => isDiff(String(q.meta.difficulty)));

  const mathsEasyScore = mathsEasyQs.filter((q) => q.isCorrect).length;
  const mathsMedScore = mathsMedQs.filter((q) => q.isCorrect).length;
  const mathsDiffScore = mathsDiffQs.filter((q) => q.isCorrect).length;

  const scienceEasyQs = scienceQs.filter((q) => isEasy(String(q.meta.difficulty)));
  const scienceMedQs = scienceQs.filter((q) => isMed(String(q.meta.difficulty)));
  const scienceDiffQs = scienceQs.filter((q) => isDiff(String(q.meta.difficulty)));

  const scienceEasyScore = scienceEasyQs.filter((q) => q.isCorrect).length;
  const scienceMedScore = scienceMedQs.filter((q) => q.isCorrect).length;
  const scienceDiffScore = scienceDiffQs.filter((q) => q.isCorrect).length;

  const subjectDifficultyBreakdowns: SubjectDifficultyBreakdowns = {
    mathematics: {
      easy: {
        level: 'Easy',
        score: mathsEasyScore,
        total: mathsEasyQs.length,
        percentage: mathsEasyQs.length > 0 ? Math.round((mathsEasyScore / mathsEasyQs.length) * 100) : 0,
      },
      medium: {
        level: 'Medium',
        score: mathsMedScore,
        total: mathsMedQs.length,
        percentage: mathsMedQs.length > 0 ? Math.round((mathsMedScore / mathsMedQs.length) * 100) : 0,
      },
      hard: {
        level: 'Hard',
        score: mathsDiffScore,
        total: mathsDiffQs.length,
        percentage: mathsDiffQs.length > 0 ? Math.round((mathsDiffScore / mathsDiffQs.length) * 100) : 0,
      },
    },
    science: {
      easy: {
        level: 'Easy',
        score: scienceEasyScore,
        total: scienceEasyQs.length,
        percentage: scienceEasyQs.length > 0 ? Math.round((scienceEasyScore / scienceEasyQs.length) * 100) : 0,
      },
      medium: {
        level: 'Medium',
        score: scienceMedScore,
        total: scienceMedQs.length,
        percentage: scienceMedQs.length > 0 ? Math.round((scienceMedScore / scienceMedQs.length) * 100) : 0,
      },
      hard: {
        level: 'Hard',
        score: scienceDiffScore,
        total: scienceDiffQs.length,
        percentage: scienceDiffQs.length > 0 ? Math.round((scienceDiffScore / scienceDiffQs.length) * 100) : 0,
      },
    },
  };

  // Primary Skills Weighted Calculations
  function computeWeightedSkill(
    filterFn: (q: EvaluatedQ) => boolean,
    name: string,
  ): SkillProfileItem {
    const subset = evaluatedQuestions.filter(filterFn);
    const sumTotalWeight = subset.reduce((acc, curr) => acc + curr.weight, 0);
    const sumEarnedWeight = subset.reduce(
      (acc, curr) => acc + (curr.isCorrect ? curr.weight : 0),
      0,
    );
    const pct = sumTotalWeight > 0 ? Math.round((sumEarnedWeight / sumTotalWeight) * 1000) / 10 : 0;
    return {
      name,
      scorePercent: pct,
      category: classifySkillValue(pct),
      earnedWeight: sumEarnedWeight,
      totalWeight: sumTotalWeight,
    };
  }

  const conceptualQs = evaluatedQuestions.filter(
    (q) => q.meta.primarySkill.trim().toLowerCase() === 'conceptual foundation',
  );
  const conceptualFoundation = computeWeightedSkill(
    (q) => q.meta.primarySkill.trim().toLowerCase() === 'conceptual foundation',
    'Conceptual Foundation',
  );

  const applicationQs = evaluatedQuestions.filter(
    (q) => q.meta.primarySkill.trim().toLowerCase() === 'concept application',
  );
  const conceptApplication = computeWeightedSkill(
    (q) => q.meta.primarySkill.trim().toLowerCase() === 'concept application',
    'Concept Application Skill',
  );

  const problemSolvingQs = evaluatedQuestions.filter(
    (q) => q.meta.primarySkill.trim().toLowerCase() === 'problem solving',
  );
  const problemSolving = computeWeightedSkill(
    (q) => q.meta.primarySkill.trim().toLowerCase() === 'problem solving',
    'Problem Solving Skill',
  );

  // Raw Accuracy
  const rawAccuracyPercent =
    totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 1000) / 10 : 0;
  const accuracyCategory = classifySkillValue(rawAccuracyPercent);

  // Question Interpretation Skill
  // Filter questions matching ANY of:
  // - Secondary Skill contains "Interpretation" or "Visual Interpretation" (case-insensitive)
  // - Question Structure contains "Data-based" or "Diagram-based" (case-insensitive)
  // - Visual Dependency == "High" (case-insensitive)
  const isInterpMatch = (q: EvaluatedQ) => {
    const sec = (q.meta.secondarySkill ?? '').toLowerCase();
    const struc = (q.meta.questionStructure ?? '').toLowerCase();
    const vis = (q.meta.visualDependency ?? '').toLowerCase();

    const matchesSec = sec.includes('interpretation');
    const matchesStruc = struc.includes('data-based') || struc.includes('diagram-based');
    const matchesVis = vis === 'high';

    return matchesSec || matchesStruc || matchesVis;
  };

  const interpQs = evaluatedQuestions.filter(isInterpMatch);
  const questionInterpretation = computeWeightedSkill(isInterpMatch, 'Question Interpretation Skill');

  // Time Management & Guesswork Evaluation
  const timeManagement = evaluateTimeManagement(
    evaluatedQuestions.map((eq) => ({
      qno: eq.meta.qno,
      attempted: eq.attempted,
      timeTakenSeconds: eq.timeTakenSeconds,
      expectedUpperBoundS: eq.upperLimit,
    })),
  );

  // Question Structure Performance (5 Performance Patterns: Direct, Multi-step, Diagram-based, Application-based, Word Problem)
  const STRUCTURAL_TYPES = [
    { key: 'Direct', label: 'Direct', regex: /\bdirect\b/i },
    { key: 'Multi-step', label: 'Multi-step', regex: /\bmulti[- ]step\b/i },
    { key: 'Diagram-based', label: 'Diagram-based', regex: /\bdiagram[- ]based\b/i },
    { key: 'Application-based', label: 'Application-based', regex: /\bapplication[- ]based\b/i },
    { key: 'Word problem', label: 'Word Problem', regex: /\bword problem\b/i },
  ];

  const structures: QuestionStructurePerformance[] = STRUCTURAL_TYPES.map((st) => {
    const matching = evaluatedQuestions.filter((q) =>
      st.regex.test(q.meta.questionStructure ?? ''),
    );
    const corr = matching.filter((q) => q.isCorrect).length;
    const tot = matching.length;
    return {
      type: st.label,
      correct: corr,
      total: tot,
      percentage: tot > 0 ? Math.round((corr / tot) * 100) : 0,
    };
  });

  // Chapter-level performance for Strengths & Gaps
  const chapterMap = new Map<string, { correct: number; total: number; subject: string }>();
  for (const eq of evaluatedQuestions) {
    const ch = eq.meta.chapter?.trim() || 'General';
    if (!chapterMap.has(ch)) {
      chapterMap.set(ch, { correct: 0, total: 0, subject: eq.meta.subject });
    }
    const c = chapterMap.get(ch)!;
    c.total += 1;
    if (eq.isCorrect) c.correct += 1;
  }

  const chapterList = Array.from(chapterMap.entries()).map(([ch, val]) => ({
    name: ch,
    subject: val.subject,
    correct: val.correct,
    total: val.total,
    percentage: Math.round((val.correct / val.total) * 100),
  }));

  // Score-based candidate dimensions for Strengths & Priority Gaps
  // Strictly based on Scores, Primary Cognitive Skills, Accuracy, and Question Structures (NOT chapters)
  interface ScoreCandidate {
    name: string;
    percentage: number;
    scoreDetails: string;
    reason: string;
    totalTested: number;
  }

  const scoreCandidates: ScoreCandidate[] = [];

  // 1. Accuracy
  if (totalAttempted > 0) {
    scoreCandidates.push({
      name: 'Accuracy',
      percentage: rawAccuracyPercent,
      scoreDetails: `${totalCorrect}/${totalAttempted} attempted (${rawAccuracyPercent}%)`,
      reason:
        rawAccuracyPercent >= 75
          ? 'High execution precision on attempted questions with disciplined answering and minimal calculation errors.'
          : 'Accuracy on attempted questions indicates occasional calculation slips or careless errors under timed pressure.',
      totalTested: totalAttempted,
    });
  }

  // 2. Concept Application Skill
  if (conceptApplication.totalWeight > 0) {
    scoreCandidates.push({
      name: 'Concept Application Skill',
      percentage: conceptApplication.scorePercent,
      scoreDetails: `${conceptApplication.earnedWeight}/${conceptApplication.totalWeight} pts (${conceptApplication.scorePercent}%)`,
      reason:
        conceptApplication.scorePercent >= 60
          ? 'Strong proficiency in applying learned concepts and mathematical formulas to standard examination problems.'
          : 'Developing ability to apply core scientific formulas and algebraic methods to standard questions.',
      totalTested: conceptApplication.totalWeight,
    });
  }

  // 3. Conceptual Foundation
  if (conceptualFoundation.totalWeight > 0) {
    scoreCandidates.push({
      name: 'Conceptual Foundation',
      percentage: conceptualFoundation.scorePercent,
      scoreDetails: `${conceptualFoundation.earnedWeight}/${conceptualFoundation.totalWeight} pts (${conceptualFoundation.scorePercent}%)`,
      reason:
        conceptualFoundation.scorePercent >= 60
          ? 'Solid comprehension of fundamental definitions, scientific principles, and core textbook facts.'
          : 'Foundational concepts and textbook definitions require systematic consolidation and revision.',
      totalTested: conceptualFoundation.totalWeight,
    });
  }

  // 4. Problem Solving Skill
  if (problemSolving.totalWeight > 0) {
    scoreCandidates.push({
      name: 'Problem Solving Skill',
      percentage: problemSolving.scorePercent,
      scoreDetails: `${problemSolving.earnedWeight}/${problemSolving.totalWeight} pts (${problemSolving.scorePercent}%)`,
      reason:
        problemSolving.scorePercent >= 60
          ? 'Robust analytical reasoning and execution when tackling complex, multi-tiered problems.'
          : 'Analytical breakdown of compound questions and multi-step deduction requires structured practice.',
      totalTested: problemSolving.totalWeight,
    });
  }

  // 5. Question Interpretation Skill
  if (questionInterpretation.totalWeight > 0) {
    scoreCandidates.push({
      name: 'Question Interpretation Skill',
      percentage: questionInterpretation.scorePercent,
      scoreDetails: `${questionInterpretation.earnedWeight}/${questionInterpretation.totalWeight} pts (${questionInterpretation.scorePercent}%)`,
      reason:
        questionInterpretation.scorePercent >= 60
          ? 'Skilled at extracting key parameters, visual clues, and qualifying constraints from problem statements.'
          : 'Decoding question phrasing, diagrams, and implicit scientific conditions needs deliberate practice.',
      totalTested: questionInterpretation.totalWeight,
    });
  }

  // 6. 7 Question Structures (only those with total > 0)
  for (const st of structures) {
    if (st.total > 0) {
      let structReason = '';
      switch (st.type) {
        case 'Direct':
          structReason =
            st.percentage >= 60
              ? 'Flawless recall and rapid retrieval on direct, single-concept questions.'
              : 'Direct recall of fundamental definitions and factual statements needs reinforcement.';
          break;
        case 'Multi-step':
          structReason =
            st.percentage >= 60
              ? 'Effective handling of sequential multi-tier calculations and structured workflows.'
              : 'Cognitive strain and calculation errors during multi-step procedural sequences.';
          break;
        case 'Diagram-based':
          structReason =
            st.percentage >= 60
              ? 'Accurate visual-spatial parsing of schematic figures, ray diagrams, and apparatus.'
              : 'Difficulty interpreting visual ray diagrams, circuit schematics, and anatomical figures.';
          break;
        case 'Data-based':
          structReason =
            st.percentage >= 60
              ? 'Strong ability to interpret and extract conclusions from tables, trends, and statistics.'
              : 'Interpreting data tables and calculating derived statistical/chemical values presents friction.';
          break;
        case 'Application-based':
          structReason =
            st.percentage >= 60
              ? 'High capability in translating theoretical textbook principles to real-world applications.'
              : 'Connecting theoretical syllabus concepts to applied, unfamiliar examination contexts.';
          break;
        case 'Word Problem':
          structReason =
            st.percentage >= 60
              ? 'Proficient at decoding worded problems into accurate mathematical formulations.'
              : 'Translating worded problem narratives into mathematical models and equations.';
          break;
        case 'Structure-based':
        default:
          structReason =
            st.percentage >= 60
              ? 'Solid competence in analyzing molecular models, organic structures, and diagrams.'
              : 'Comprehending structural chemical representations, electron dot structures, and isomerism.';
          break;
      }

      scoreCandidates.push({
        name: `${st.type} Questions`,
        percentage: st.percentage,
        scoreDetails: `${st.correct}/${st.total} (${st.percentage}%)`,
        reason: structReason,
        totalTested: st.total,
      });
    }
  }

  // 6 Candidate Strengths Engine (strictly limited to 6 candidates)
  interface CandidateStrength {
    id: string;
    strongName: string;
    developingName: string;
    percentage: number;
    totalTested: number;
    strongReason: string;
    developingReason: string;
  }

  const strengthCandidates: CandidateStrength[] = [
    {
      id: 'concept_clarity',
      strongName: 'CONCEPT CLARITY',
      developingName: 'CONCEPT CLARITY',
      percentage: conceptualFoundation.scorePercent,
      totalTested: conceptualFoundation.totalWeight,
      strongReason:
        'You understand Class X board concepts well and have built a strong base to build upon. Keep deepening your understanding—you’re on the right track!',
      developingReason:
        'This is one of your stronger areas right now. With focused practice, you can build even greater clarity here.',
    },
    {
      id: 'concept_application',
      strongName: 'CONCEPT APPLICATION',
      developingName: 'CONCEPT APPLICATION',
      percentage: conceptApplication.scorePercent,
      totalTested: conceptApplication.totalWeight,
      strongReason:
        'You are good at putting what you learn into practice. Keep exploring unfamiliar questions to make this strength even stronger!',
      developingReason:
        'You are showing a promising start in applying concepts. More practice with varied questions can strengthen this further.',
    },
    {
      id: 'problem_solving',
      strongName: 'PROBLEM SOLVING SKILL',
      developingName: 'PROBLEM SOLVING',
      percentage: problemSolving.scorePercent,
      totalTested: problemSolving.totalWeight,
      strongReason:
        'You show good logical thinking and can work through challenging problems. Keep challenging yourself—you have a strong problem-solving foundation!',
      developingReason:
        'You show a developing ability to work through problems. Regular practice can help you become more confident and effective.',
    },
    {
      id: 'visual_understanding',
      strongName: 'VISUAL UNDERSTANDING SKILL',
      developingName: 'VISUAL UNDERSTANDING',
      percentage: questionInterpretation.scorePercent,
      totalTested: questionInterpretation.totalWeight,
      strongReason:
        'You are comfortable understanding information through diagrams, graphs and figures. Use this strength to tackle more challenging visual and application-based questions!',
      developingReason:
        'You are showing a good starting point with visual information. More exposure to graphs, diagrams and figures can strengthen this skill.',
    },
    {
      id: 'accuracy',
      strongName: 'ACCURACY',
      developingName: 'ACCURACY',
      percentage: rawAccuracyPercent,
      totalTested: totalAttempted,
      strongReason:
        'You answer questions with good care and precision. Keep building this strength while maintaining your solving speed!',
      developingReason:
        'Your accuracy is currently among your better-performing areas. With careful practice, you can make this an even stronger skill.',
    },
    {
      id: 'time_management',
      strongName: 'TIME MANAGEMENT SKILL',
      developingName: 'TIME MANAGEMENT',
      percentage: timeManagement.finalScorePercent,
      totalTested: timeManagement.maxPossibleScore,
      strongReason:
        'You use your test time effectively and manage your questions well. Keep practising under timed conditions to make this strength even stronger!',
      developingReason:
        'You are making a good start in managing your test time. Timed practice can help you become faster and more consistent.',
    },
  ];

  // Sort descending by percentage, then by totalTested
  const sortedStrengths = [...strengthCandidates].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    return b.totalTested - a.totalTested;
  });

  const top3Selected = sortedStrengths.slice(0, 3);
  const strongCount = top3Selected.filter((item) => item.percentage >= 70).length;

  let strengthsTitle = 'YOUR STRENGTHS';
  if (strongCount >= 3) {
    strengthsTitle = 'YOUR STRENGTHS';
  } else if (strongCount === 1 || strongCount === 2) {
    strengthsTitle = 'YOUR EMERGING STRENGTHS';
  } else {
    strengthsTitle = 'AREAS WITH MOST POTENTIAL';
  }

  const top3Strengths: StrengthItem[] = top3Selected.map((item, idx) => {
    const isStrong = item.percentage >= 70;
    return {
      rank: idx + 1,
      name: isStrong ? item.strongName : item.developingName,
      scoreDetails: `${item.percentage}%`,
      percentage: item.percentage,
      reason: isStrong ? item.strongReason : item.developingReason,
      isEmerging: !isStrong,
    };
  });

  // Priority Gaps / Weakness Areas: only categories where score is 70% or less
  const gapsFiltered = scoreCandidates.filter((item) => item.percentage <= 70);
  const gapsSorted = [...gapsFiltered].sort((a, b) => {
    if (a.percentage !== b.percentage) return a.percentage - b.percentage;
    return b.totalTested - a.totalTested;
  });

  // Display only categories <= 70%; if less than 4, display only those (up to 4)
  const priorityGaps: PriorityGapItem[] = gapsSorted.slice(0, 4).map((item, idx) => ({
    rank: idx + 1,
    name: item.name,
    scorePercent: item.percentage,
    priority: classifyPriority(item.percentage),
  }));

  // Topics to Revisit
  // Rules:
  // 1. Unattempted questions: Flagged as 'Unattempted' (competency cannot be assessed without an attempt).
  // 2. Rapid guesswork: Answered very fast (<= 15s or < 20s and <= 25% of limit, right or wrong) -> Flagged as 'Rapid Guesswork'
  // 3. Severe overtime (>= 2x limit) & Incorrect -> 'High Friction Gap'
  // 4. Severe overtime (>= 2x limit) & Correct -> 'Pacing / Time Management'
  // 5. Normal pacing incorrect -> 'Conceptual / Calculation Gap'
  // 6. Normal pacing correct -> Mastered (excluded)
  const topicsToRevisit: TopicToRevisitItem[] = [];

  for (const q of evaluatedQuestions) {
    // 1. Unattempted
    if (!q.attempted || q.timeTakenSeconds === 0) {
      topicsToRevisit.push({
        qno: q.meta.qno,
        subject: q.meta.subject,
        chapter: q.meta.chapter,
        topic: q.meta.topic,
        issueObserved:
          'Unattempted. Since this question was not attempted, competency in this chapter could not be assessed.',
        category: 'Unattempted',
        recommendedFocusArea:
          q.meta.conceptTested || q.meta.prerequisiteConcept || q.meta.topic,
        timeTaken: q.timeTakenSeconds,
        expectedLimit: q.upperLimit,
        isCorrect: false,
        attempted: false,
      });
      continue;
    }

    // 2. Rapid Guesswork
    const isRapidGuesswork =
      q.timeTakenSeconds <= 15 ||
      (q.timeTakenSeconds < 20 && q.timeTakenSeconds <= 0.25 * q.upperLimit);
    if (isRapidGuesswork) {
      topicsToRevisit.push({
        qno: q.meta.qno,
        subject: q.meta.subject,
        chapter: q.meta.chapter,
        topic: q.meta.topic,
        issueObserved: `Rapid submission (${q.timeTakenSeconds}s vs limit ${q.upperLimit}s). High possibility of unverified guesswork.`,
        category: 'Rapid Guesswork',
        recommendedFocusArea:
          q.meta.conceptTested || q.meta.prerequisiteConcept || q.meta.topic,
        timeTaken: q.timeTakenSeconds,
        expectedLimit: q.upperLimit,
        isCorrect: q.isCorrect,
        attempted: true,
      });
      continue;
    }

    // 3. Severe Overtime & Incorrect
    if (q.timeTakenSeconds >= 2 * q.upperLimit && !q.isCorrect) {
      topicsToRevisit.push({
        qno: q.meta.qno,
        subject: q.meta.subject,
        chapter: q.meta.chapter,
        topic: q.meta.topic,
        issueObserved: `Severe Overtime (${q.timeTakenSeconds}s vs limit ${q.upperLimit}s) and incorrect. High friction & deep conceptual bottleneck.`,
        category: 'High Friction Gap',
        recommendedFocusArea:
          q.meta.prerequisiteConcept || q.meta.conceptTested || q.meta.topic,
        timeTaken: q.timeTakenSeconds,
        expectedLimit: q.upperLimit,
        isCorrect: false,
        attempted: true,
      });
      continue;
    }

    // 4. Severe Overtime & Correct
    if (q.timeTakenSeconds >= 2 * q.upperLimit && q.isCorrect) {
      topicsToRevisit.push({
        qno: q.meta.qno,
        subject: q.meta.subject,
        chapter: q.meta.chapter,
        topic: q.meta.topic,
        issueObserved: `Severe Overtime: Correct response but required ${q.timeTakenSeconds}s (limit: ${q.upperLimit}s). Requires pacing refinement.`,
        category: 'Pacing / Time Management',
        recommendedFocusArea:
          q.meta.conceptTested || q.meta.topic || 'Solving Routine & Speed Drills',
        timeTaken: q.timeTakenSeconds,
        expectedLimit: q.upperLimit,
        isCorrect: true,
        attempted: true,
      });
      continue;
    }

    // 5. Normal pacing incorrect
    if (!q.isCorrect) {
      const category: RevisitCategory = 'Conceptual / Calculation Gap';

      const recommendedFocusArea =
        q.meta.prerequisiteConcept && q.meta.prerequisiteConcept.trim().length > 0
          ? `${q.meta.prerequisiteConcept} (Prerequisite Foundation)`
          : q.meta.conceptTested && q.meta.conceptTested.trim().length > 0
            ? q.meta.conceptTested
            : q.meta.topic;

      topicsToRevisit.push({
        qno: q.meta.qno,
        subject: q.meta.subject,
        chapter: q.meta.chapter,
        topic: q.meta.topic,
        issueObserved: `Incorrect response under normal pacing (${q.timeTakenSeconds}s). Indicates misconception or calculation error.`,
        category,
        recommendedFocusArea,
        timeTaken: q.timeTakenSeconds,
        expectedLimit: q.upperLimit,
        isCorrect: q.isCorrect,
        attempted: q.attempted,
      });
    }
  }

  // Dynamic Narrative Generation: Page 1 "YOUR KEY INSIGHT"
  let keyInsight = '';
  if (levelOfPreparation === 'Basic') {
    keyInsight =
      'You have started building your foundation for the Boards, and this is a good time to strengthen it further. Some gaps are currently making it difficult to consistently convert your understanding into marks. The good news is that these areas can be improved with focused practice. Read the report further to know where you can improve and how to perform better';
  } else {
    // Conceptually Strong or High achievement Potential
    keyInsight =
      'You have built a strong understanding of your Board-level concepts. Your next step is to turn this strong conceptual base into consistently high performance by practising questions that require deeper application, multiple steps and careful interpretation. Read the report further to identify the areas that can help you take your preparation to the next level.';
  }

  // Dynamic Narrative Generation: Page 2 "WHAT THIS TELLS YOU"
  const studentFirstName = student.studentName.split(' ')[0] || student.studentName;
  const directPerf = structures.find((s) => s.type === 'Direct')?.percentage ?? 0;
  const multiStepPerf = structures.find((s) => s.type === 'Multi-step')?.percentage ?? 0;
  const diagramPerf = structures.find((s) => s.type === 'Diagram-based')?.percentage ?? 0;

  let performancePatternInsight = '';
  if (directPerf > multiStepPerf + 20) {
    performancePatternInsight = `The structural breakdown reveals a distinct contrast: ${studentFirstName} performs significantly better on direct recall questions (${directPerf}%) than on multi-step execution problems (${multiStepPerf}%). This indicates that while foundational memory and definitions are intact, multi-layered problem architectures cause cognitive friction and calculation strain. The primary structural bottleneck is intermediate-step verification; training on breaking complex questions into smaller sub-tasks will immediately stabilize Board exam outcomes.`;
  } else if (diagramPerf < directPerf - 20) {
    performancePatternInsight = `Analysis of question formats indicates strong comfort with direct and word-based problems, contrasted by a noticeable performance drop on diagram- and visual-dependent questions (${diagramPerf}%). This highlights that visual parsing and extracting numerical data from schematic illustrations is a critical bottleneck. Regular practice with labelled schematic diagrams and ray/circuit diagrams will rapidly bridge this visual interpretation gap.`;
  } else if (multiStepPerf >= 65 && directPerf >= 65) {
    performancePatternInsight = `${studentFirstName} exhibits a remarkably versatile problem-solving profile, sustaining balanced accuracy across both direct questions (${directPerf}%) and complex multi-step scenarios (${multiStepPerf}%). Diagram-based and application questions are handled with methodological discipline, showing that comprehension is not limited to rote memorization. The primary focus moving forward should be pacing optimization to conserve cognitive energy for the most challenging questions.`;
  } else {
    performancePatternInsight = `The performance distribution indicates that question structure substantially impacts ${studentFirstName}'s response consistency. Direct prompts are approached with fair confidence, but accuracy declines when questions incorporate compound conditions or data extraction. Strengthening procedural routines for multi-step and diagram-driven questions will prevent hesitation and unlock higher consistency across all syllabus units.`;
  }

  // Page 4: Detailed Diagnostic Calculation Steps & Audit Trail (Dev/Audit Mode)
  const calculationSteps: DiagnosticCalculationSteps = {
    scoring: {
      totalQuestionsN: N,
      rawScoreSum: totalRawScore,
      diagnosticWeightSum: totalDiagnosticWeight,
      weightedScoreSum: totalWeightedScore,
      briFraction: `${totalWeightedScore} / ${totalDiagnosticWeight}`,
      briResult: briScore,
      levelRule:
        briScore >= 80
          ? 'BRI >= 80% -> High achievement Potential'
          : briScore >= 60
            ? '60% <= BRI < 80% -> Conceptually Strong'
            : 'BRI < 60% -> Basic',
      levelResult: levelOfPreparation,
    },
    breakdowns: [
      {
        area: 'Mathematics',
        filterCondition: "Subject == 'Maths'",
        matchingQuestions: mathsQs.map((q) => q.meta.qno),
        score: mathsPerf.score,
        total: mathsPerf.totalQuestions,
        formula: `(${mathsPerf.score} / ${mathsPerf.totalQuestions}) * 100%`,
        percentage: mathsPerf.percentage,
      },
      {
        area: 'Science',
        filterCondition: "Subject in ['Physics', 'Chemistry', 'Biology']",
        matchingQuestions: scienceQs.map((q) => q.meta.qno),
        score: sciencePerf.score,
        total: sciencePerf.totalQuestions,
        formula: `(${sciencePerf.score} / ${sciencePerf.totalQuestions}) * 100%`,
        percentage: sciencePerf.percentage,
      },
      {
        area: 'Easy Questions',
        filterCondition: "Difficulty == 'Easy'",
        matchingQuestions: easyQs.map((q) => q.meta.qno),
        score: easyPerf.score,
        total: easyPerf.totalQuestions,
        formula: `(${easyPerf.score} / ${easyPerf.totalQuestions}) * 100%`,
        percentage: easyPerf.percentage,
      },
      {
        area: 'Medium Questions',
        filterCondition: "Difficulty == 'Medium'",
        matchingQuestions: medQs.map((q) => q.meta.qno),
        score: medPerf.score,
        total: medPerf.totalQuestions,
        formula: `(${medPerf.score} / ${medPerf.totalQuestions}) * 100%`,
        percentage: medPerf.percentage,
      },
      {
        area: 'Difficult Questions',
        filterCondition: "Difficulty == 'Difficult'",
        matchingQuestions: diffQs.map((q) => q.meta.qno),
        score: diffPerf.score,
        total: diffPerf.totalQuestions,
        formula: `(${diffPerf.score} / ${diffPerf.totalQuestions}) * 100%`,
        percentage: diffPerf.percentage,
      },
    ],
    skills: [
      {
        skillName: 'Conceptual Foundation',
        filterCondition: "Primary Skill == 'Conceptual Foundation'",
        matchingQuestions: conceptualQs.map((q) => q.meta.qno),
        earnedWeights: conceptualFoundation.earnedWeight,
        totalWeights: conceptualFoundation.totalWeight,
        formula: `(${conceptualFoundation.earnedWeight} / ${conceptualFoundation.totalWeight}) * 100%`,
        percentage: conceptualFoundation.scorePercent,
        categoryRule: `Score > 66.67% ? Good : Score > 33.33% ? Average : Needs Strengthening`,
        categoryResult: conceptualFoundation.category,
      },
      {
        skillName: 'Concept Application Skill',
        filterCondition: "Primary Skill == 'Concept Application'",
        matchingQuestions: applicationQs.map((q) => q.meta.qno),
        earnedWeights: conceptApplication.earnedWeight,
        totalWeights: conceptApplication.totalWeight,
        formula: `(${conceptApplication.earnedWeight} / ${conceptApplication.totalWeight}) * 100%`,
        percentage: conceptApplication.scorePercent,
        categoryRule: `Score > 66.67% ? Good : Score > 33.33% ? Average : Needs Strengthening`,
        categoryResult: conceptApplication.category,
      },
      {
        skillName: 'Problem Solving Skill',
        filterCondition: "Primary Skill == 'Problem Solving'",
        matchingQuestions: problemSolvingQs.map((q) => q.meta.qno),
        earnedWeights: problemSolving.earnedWeight,
        totalWeights: problemSolving.totalWeight,
        formula: `(${problemSolving.earnedWeight} / ${problemSolving.totalWeight}) * 100%`,
        percentage: problemSolving.scorePercent,
        categoryRule: `Score > 66.67% ? Good : Score > 33.33% ? Average : Needs Strengthening`,
        categoryResult: problemSolving.category,
      },
      {
        skillName: 'Accuracy',
        filterCondition: 'Attempted == True',
        matchingQuestions: evaluatedQuestions.filter((q) => q.attempted).map((q) => q.meta.qno),
        earnedWeights: totalCorrect,
        totalWeights: totalAttempted,
        formula: `(${totalCorrect} / ${totalAttempted}) * 100%`,
        percentage: rawAccuracyPercent,
        categoryRule: `Accuracy > 66.67% ? Good : Accuracy > 33.33% ? Average : Needs Strengthening`,
        categoryResult: accuracyCategory,
      },
      {
        skillName: 'Question Interpretation Skill',
        filterCondition:
          'Secondary Skill contains "Interpretation" OR Structure contains "Data-based" / "Diagram-based" OR Visual Dependency == "High"',
        matchingQuestions: interpQs.map((q) => q.meta.qno),
        earnedWeights: questionInterpretation.earnedWeight,
        totalWeights: questionInterpretation.totalWeight,
        formula: `(${questionInterpretation.earnedWeight} / ${questionInterpretation.totalWeight}) * 100%`,
        percentage: questionInterpretation.scorePercent,
        categoryRule: `Score > 66.67% ? Good : Score > 33.33% ? Average : Needs Strengthening`,
        categoryResult: questionInterpretation.category,
      },
    ],
    structures: structures.map((st) => {
      const matchQs = evaluatedQuestions
        .filter((eq) => eq.meta.questionStructure.toLowerCase().includes(st.type.toLowerCase()))
        .map((eq) => eq.meta.qno);
      return {
        structureType: st.type,
        matchingQuestions: matchQs,
        correctCount: st.correct,
        totalCount: st.total,
        formula: `(${st.correct} / ${st.total}) * 100%`,
        percentage: st.percentage,
      };
    }),
    strengthsRanking: top3Strengths.map((s) => ({
      rank: s.rank,
      name: s.name,
      percentage: s.percentage,
      scoreDetails: s.scoreDetails,
      reason: s.reason,
    })),
    priorityGapsRanking: priorityGaps.map((g) => ({
      rank: g.rank,
      name: g.name,
      scorePercent: g.scorePercent,
      priority: g.priority,
      ruleApplied:
        g.scorePercent < 40
          ? 'Score < 40% -> High Priority'
          : g.scorePercent <= 55
            ? '40% <= Score <= 55% -> Medium Priority'
            : '55% < Score <= 70% -> Low Priority',
    })),
    allChapterScores: chapterList.map((c) => ({
      chapter: c.name,
      subject: c.subject,
      correct: c.correct,
      total: c.total,
      percentage: c.percentage,
      priority: classifyPriority(c.percentage),
    })),
    timeManagement: {
      attemptedCount: timeManagement.attemptedCount,
      totalScore: timeManagement.totalScore,
      maxPossibleScore: timeManagement.maxPossibleScore,
      formula: `(${timeManagement.totalScore} / (3 * ${timeManagement.attemptedCount})) * 100%`,
      finalScorePercent: timeManagement.finalScorePercent,
      ratingRule: 'Score <= 33% ? Poor : Score >= 66% ? Good : Medium',
      ratingResult: timeManagement.rating,
      guessworkQuestions: timeManagement.guessworkQuestions,
    },
    questionAudit: evaluatedQuestions.map((eq) => {
      const isOvertime = eq.timeTakenSeconds > eq.upperLimit;
      const revisitItem = topicsToRevisit.find((t) => t.qno === eq.meta.qno);
      const timeItem = timeManagement.items.find((t) => t.qno === eq.meta.qno);

      return {
        qno: eq.meta.qno,
        subject: eq.meta.subject,
        chapter: eq.meta.chapter,
        topic: eq.meta.topic,
        difficulty: eq.meta.difficulty,
        primarySkill: eq.meta.primarySkill,
        secondarySkill: eq.meta.secondarySkill ?? null,
        questionStructure: eq.meta.questionStructure,
        visualDependency: eq.meta.visualDependency,
        expectedTimeRaw: eq.meta.expectedTime,
        expectedUpperBoundS: eq.upperLimit,
        timeTakenS: eq.timeTakenSeconds,
        timeLimitExceeded: isOvertime,
        timeManagementScore: timeItem?.score,
        timeManagementLabel: timeItem?.label,
        isGuesswork: timeItem?.isGuesswork,
        correctAnswer: eq.meta.answer,
        selectedOption: eq.selectedOption,
        attempted: eq.attempted,
        isCorrect: eq.isCorrect,
        diagnosticWeight: eq.weight,
        weightedScore: eq.isCorrect ? eq.weight : 0,
        revisitIssue: revisitItem ? revisitItem.issueObserved : null,
        revisitCategory: revisitItem ? revisitItem.category : null,
      };
    }),
  };

  // Generate Exact Plain Text Report Layout per Section 3 & Section 4 (Audit)
  const plainTextReport = generateReportPlainTextFormat({
    studentName: student.studentName,
    totalRawScore,
    totalQuestions: N,
    totalWeightedScore,
    totalDiagnosticWeight,
    briScore,
    levelOfPreparation,
    mathsScore: mathsPerf.score,
    mathsTotalQuestions: mathsPerf.totalQuestions,
    mathsPercentage: mathsPerf.percentage,
    scienceScore: sciencePerf.score,
    scienceTotalQuestions: sciencePerf.totalQuestions,
    sciencePercentage: sciencePerf.percentage,
    physicsPercentage: physicsPerf.percentage,
    chemistryPercentage: chemistryPerf.percentage,
    biologyPercentage: biologyPerf.percentage,
    easyScore: easyPerf.score,
    easyTotalQuestions: easyPerf.totalQuestions,
    mediumScore: medPerf.score,
    mediumTotalQuestions: medPerf.totalQuestions,
    difficultScore: diffPerf.score,
    difficultTotalQuestions: diffPerf.totalQuestions,
    conceptualFoundationCategory: conceptualFoundation.category,
    conceptApplicationCategory: conceptApplication.category,
    problemSolvingCategory: problemSolving.category,
    accuracyCategory,
    questionInterpretationCategory: questionInterpretation.category,
    keyInsight,
    strengthsTitle,
    top3Strengths,
    structures,
    performancePatternInsight,
    priorityGaps,
    topicsToRevisit,
    timeManagement,
    subjectDifficultyBreakdowns,
    calculationSteps,
  });

  return {
    studentName: student.studentName,
    studentGender: student.studentGender ?? null,
    totalQuestions: N,
    totalRawScore,
    totalDiagnosticWeight,
    totalWeightedScore,
    briScore,
    levelOfPreparation,
    breakdown: {
      mathematics: mathsPerf,
      science: sciencePerf,
      physics: physicsPerf,
      chemistry: chemistryPerf,
      biology: biologyPerf,
      easy: easyPerf,
      medium: medPerf,
      difficult: diffPerf,
      difficultyBySubject: subjectDifficultyBreakdowns,
    },
    subjectDifficultyBreakdowns,
    skills: {
      conceptualFoundation,
      conceptApplication,
      problemSolving,
      accuracy: {
        scorePercent: rawAccuracyPercent,
        category: accuracyCategory,
        correctCount: totalCorrect,
        attemptedCount: totalAttempted,
      },
      questionInterpretation,
    },
    structures,
    strengthsTitle,
    strengths: top3Strengths,
    priorityGaps,
    topicsToRevisit,
    timeManagement,
    keyInsight,
    performancePatternInsight,
    plainTextReport,
    calculationSteps,
  };
}

function generateReportPlainTextFormat(data: {
  studentName: string;
  totalRawScore: number;
  totalQuestions: number;
  totalWeightedScore: number;
  totalDiagnosticWeight: number;
  briScore: number;
  levelOfPreparation: PreparationLevel;
  mathsScore: number;
  mathsTotalQuestions: number;
  mathsPercentage: number;
  scienceScore: number;
  scienceTotalQuestions: number;
  sciencePercentage: number;
  physicsPercentage: number;
  chemistryPercentage: number;
  biologyPercentage: number;
  easyScore: number;
  easyTotalQuestions: number;
  mediumScore: number;
  mediumTotalQuestions: number;
  difficultScore: number;
  difficultTotalQuestions: number;
  conceptualFoundationCategory: SkillValueCategory;
  conceptApplicationCategory: SkillValueCategory;
  problemSolvingCategory: SkillValueCategory;
  accuracyCategory: SkillValueCategory;
  questionInterpretationCategory: SkillValueCategory;
  keyInsight: string;
  strengthsTitle?: string;
  top3Strengths: StrengthItem[];
  structures: QuestionStructurePerformance[];
  performancePatternInsight: string;
  priorityGaps: PriorityGapItem[];
  topicsToRevisit: TopicToRevisitItem[];
  timeManagement?: TimeManagementSummary;
  subjectDifficultyBreakdowns?: SubjectDifficultyBreakdowns;
  calculationSteps: DiagnosticCalculationSteps;
}): string {
  const lines: string[] = [];

  // PAGE 1
  lines.push('================================================================================');
  lines.push('PAGE 1: BOARD READINESS CHALLENGE REPORT');
  lines.push('================================================================================');
  lines.push('');
  lines.push('BOARD READINESS CHALLENGE REPORT');
  lines.push('');
  lines.push(`Dear ${data.studentName},`);
  lines.push('');
  lines.push(
    'Congratulations on taking this first step towards becoming more Board-ready! Taking this diagnostic test shows that you care about your preparation and are willing to find out where you stand and how you can improve. Go through this report carefully—it will help you understand your strengths, identify the areas that need more attention, and know what to do next. If you use these insights well you can put yourself in a strong position to excel in your Class X Board examinations. Go ahead and explore further!',
  );
  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('PERSONAL DIAGNOSTIC REPORT');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('');
  lines.push('YOUR BOARD READINESS SNAPSHOT');
  lines.push(`OVERALL RAW SCORE: ${data.totalRawScore} / ${data.totalQuestions}`);
  lines.push(`BOARD READINESS INDEX: ${data.briScore} / 100`);
  lines.push(`LEVEL OF PREPARATION: ${data.levelOfPreparation}`);
  if (data.timeManagement) {
    lines.push(
      `TIME MANAGEMENT SCORE: ${data.timeManagement.finalScorePercent}% (${data.timeManagement.rating} — ${data.timeManagement.totalScore}/${data.timeManagement.maxPossibleScore} pts on ${data.timeManagement.attemptedCount} attempted questions)`,
    );
  }
  lines.push('');
  lines.push('| Subject              | Score (%)                                    |');
  lines.push('|----------------------|----------------------------------------------|');
  lines.push(`| Mathematics          | ${String(data.mathsPercentage + '%').padEnd(44)} |`);
  lines.push(`| Science              | ${String(data.sciencePercentage + '%').padEnd(44)} |`);
  lines.push(`|   • Physics          | ${String(data.physicsPercentage + '%').padEnd(44)} |`);
  lines.push(`|   • Chemistry        | ${String(data.chemistryPercentage + '%').padEnd(44)} |`);
  lines.push(`|   • Biology          | ${String(data.biologyPercentage + '%').padEnd(44)} |`);
  lines.push('');
  const subjectInsight =
    data.mathsPercentage > data.sciencePercentage
      ? 'You seem to be doing better in Maths compared to Science.'
      : data.sciencePercentage > data.mathsPercentage
        ? 'You seem to be doing better in Science compared to Maths.'
        : 'Your performance in Maths and Science seems to be well balanced.';
  lines.push(`SUBJECT INSIGHT: ${subjectInsight}`);

  if (data.subjectDifficultyBreakdowns) {
    lines.push('');
    lines.push('DIFFICULTY LEVEL PERFORMANCE (PERCENTAGE SOLVED)');
    lines.push(
      `Mathematics: Easy: ${data.subjectDifficultyBreakdowns.mathematics.easy.percentage}%, Medium: ${data.subjectDifficultyBreakdowns.mathematics.medium.percentage}%, Hard: ${data.subjectDifficultyBreakdowns.mathematics.hard.percentage}%`,
    );
    lines.push(
      `Science: Easy: ${data.subjectDifficultyBreakdowns.science.easy.percentage}%, Medium: ${data.subjectDifficultyBreakdowns.science.medium.percentage}%, Hard: ${data.subjectDifficultyBreakdowns.science.hard.percentage}%`,
    );
  }

  if (data.timeManagement && data.timeManagement.guessworkQuestions.length > 0) {
    lines.push('');
    lines.push(
      `⚠️ GUESSWORK OBSERVATION: There is possibility of guesswork being done in answering Q${data.timeManagement.guessworkQuestions.join(', Q')} (response submitted in under 8s).`,
    );
  }

  lines.push('');
  lines.push('YOUR KEY INSIGHT');
  lines.push(data.keyInsight);
  lines.push('');

  // PAGE 2
  lines.push('================================================================================');
  lines.push('PAGE 2: YOUR STRENGTHS');
  lines.push('================================================================================');
  lines.push('');
  lines.push(data.strengthsTitle || 'YOUR STRENGTHS');
  data.top3Strengths.forEach((s) => {
    lines.push(`${s.rank}. ${s.name}: ${s.scoreDetails} — ${s.reason}`);
  });
  lines.push('');
  lines.push('YOUR PERFORMANCE PATTERN');
  lines.push('| Question Type     | Rating (up to 5 Stars)                         |');
  lines.push('|-------------------|------------------------------------------------|');
  data.structures.forEach((st) => {
    const starVal = Math.round((st.percentage / 100) * 5 * 10) / 10;
    const filledCount = Math.round(starVal);
    const starIcons = '★'.repeat(filledCount) + '☆'.repeat(5 - filledCount);
    lines.push(
      `| ${st.type.padEnd(17)} | ${(`${starIcons} (${starVal}/5 Stars)`).padEnd(46)} |`,
    );
  });
  lines.push('');
  lines.push('WHAT THIS TELLS YOU');
  lines.push(data.performancePatternInsight);
  lines.push('');

  // PAGE 3
  lines.push('================================================================================');
  lines.push('PAGE 3: WHERE SHOULD YOU IMPROVE?');
  lines.push('================================================================================');
  lines.push('');
  lines.push('PAGE 3 — WHERE SHOULD YOU IMPROVE?');
  lines.push('');
  lines.push('YOUR PRIORITY GAPS');
  if (data.priorityGaps.length === 0) {
    lines.push('🎉 Congratulations! Outstanding performance — no weakness areas detected (<= 70%). All evaluated categories scored above 70%.');
  } else {
    data.priorityGaps.forEach((g) => {
      lines.push(`${g.rank}. ${g.name}: ${g.scorePercent}% — Priority: ${g.priority.replace(' Priority', '')}`);
    });
  }
  lines.push('');
  lines.push('TOPICS TO REVISIT');
  lines.push('List of topics where pacing or accuracy issues occurred during the test:');
  lines.push('');
  lines.push('| Q# | Subject | Chapter | Topic | Category |');
  lines.push('|---|---|---|---|---|');
  data.topicsToRevisit.forEach((t) => {
    lines.push(
      `| ${t.qno} | ${t.subject} | ${t.chapter} | ${t.topic} | ${t.category} |`,
    );
  });
  lines.push('');
  lines.push('*Topic observations are based only on the questions tested.*');
  lines.push('');

  // PAGE 4: YOUR NEXT STEPS
  lines.push('================================================================================');
  lines.push('PAGE 4: YOUR NEXT STEPS');
  lines.push('================================================================================');
  lines.push('');
  lines.push('PAGE 4 — YOUR NEXT STEPS');
  lines.push('');
  const prepNorm = String(data.levelOfPreparation || '').trim().toLowerCase();
  const isHighPrep = prepNorm.includes('high achievement') || prepNorm === 'advanced' || data.briScore >= 80;
  const isConceptuallyStrong = !isHighPrep && (prepNorm.includes('conceptually strong') || prepNorm === 'proficient' || data.briScore >= 60);

  if (isHighPrep) {
    lines.push('HOW TO MOVE FROM STRONG TO EXCELLENT');
    lines.push('① Challenge yourself');
    lines.push('Do not spend all your practice time on questions you can already solve. Regularly include unfamiliar and higher-order problems.');
    lines.push('② Practise mixed problems');
    lines.push('Combine concepts from different chapters so that you practise identifying the method, not just applying a memorised formula.');
    lines.push('③ Analyse mistakes deeply');
    lines.push('When you make an error, identify exactly where your reasoning broke down and re-solve the problem independently.');
    lines.push('④ Build examination efficiency');
    lines.push('Continue timed practice so that your accuracy remains high even when working under examination pressure.');
    lines.push('⑤ Use Board preparation strategically');
    lines.push('Secure all standard Board-level questions first, then use additional time to strengthen case-based, application-based and higher-order questions.');
  } else if (isConceptuallyStrong) {
    lines.push('TURN YOUR CURRENT PERFORMANCE INTO STRONGER BOARD PREPARATION');
    lines.push('① Move beyond direct questions');
    lines.push('For every chapter you study, include application-based and multi-step questions—not only straightforward exercises.');
    lines.push('② Rework every important mistake');
    lines.push('After a test, first attempt the incorrect question again without seeing the solution. Then identify whether the issue was:');
    lines.push('Concept • Application • Accuracy • Interpretation');
    lines.push('③ Practise consistently');
    lines.push('A manageable amount of focused practice every day is more valuable than occasional long study sessions.');
    lines.push('④ Test yourself every 1–2 weeks');
    lines.push('Use mixed, timed questions to check whether your improvement is carrying across chapters.');
    lines.push('⑤ Shift towards Board-style practice');
    lines.push('As the examination approaches, progressively increase your practice of sample papers, case-based questions and mixed-chapter questions.');
  } else {
    lines.push('TURN YOUR GAPS INTO PROGRESS');
    lines.push('① Strengthen the basics');
    lines.push('Revisit the concepts behind the questions you could not solve. Make sure you can explain the idea before memorising the method.');
    lines.push('② Practise a few questions every day');
    lines.push('Use a simple progression:');
    lines.push('Basic → Standard → Application');
    lines.push('Focus on quality and consistency rather than solving a very large number of questions.');
    lines.push('③ Keep an Error Notebook');
    lines.push('For every important mistake, record:');
    lines.push('What did I get wrong? → Why? → What is the correct approach?');
    lines.push('④ Test yourself regularly');
    lines.push('Take a short mixed test every 1–2 weeks and track whether the same mistakes are recurring.');
    lines.push('⑤ Master your prescribed textbook');
    lines.push('Become confident with examples and exercises before moving extensively to additional or advanced material.');
  }
  lines.push('');

  // PAGE 5: NEED STRUCTURED SUPPORT? — SRSMA BOARD MASTERY COURSE
  lines.push('================================================================================');
  lines.push('PAGE 5: NEED STRUCTURED SUPPORT? — SRSMA BOARD MASTERY COURSE');
  lines.push('================================================================================');
  lines.push('');
  lines.push('PAGE 5 — NEED STRUCTURED SUPPORT?');
  lines.push('SRSMA BOARD MASTERY COURSE');
  lines.push('');
  lines.push('WHY THIS COURSE?');
  lines.push('Knowing a chapter is not enough. Students must learn to solve unfamiliar, application-based questions.');
  lines.push('SRSMA Way: From knowing the chapter to confidently solving what comes next.');
  lines.push('');
  lines.push('THE CLASS X GAP');
  lines.push('School teaches the chapter → Basic examples are understood → Routine questions get done → Unfamiliar questions feel difficult');
  lines.push('• "I know the formula... but don\'t know when to use it."');
  lines.push('• "I understood the chapter... but can\'t solve a new question."');
  lines.push('• "I can score in familiar tests... but lose marks in tougher papers."');
  lines.push('SRSMA BOARD MASTERY COURSE CLOSES THIS GAP!');
  lines.push('');
  lines.push('THIS PROGRAMME IS IDEAL FOR STUDENTS WHO:');
  lines.push('✓ Have conceptual gaps');
  lines.push('✓ Want to improve Board marks');
  lines.push('✓ Find Maths or Science difficult');
  lines.push('✓ Want structured preparation outside school');
  lines.push('✓ Want stronger fundamentals before Class XI');
  lines.push('(Especially valuable for students who plan to choose MPC / BiPC after Class X)');
  lines.push('');
  lines.push('THE FOUR PILLARS OF THIS COURSE:');
  lines.push('1. Concept Clarity: Identify weak fundamentals and rebuild them from the ground up.');
  lines.push('2. Deep Practice: Move from basic → application → higher-order → Board-level questions.');
  lines.push('3. Performance Feedback: Tests reveal exactly where the student is losing marks — and what to improve.');
  lines.push('4. Exam Skills: Learn to approach questions, manage time & present answers effectively.');
  lines.push('');
  lines.push('THE 100 HOUR ROADMAP (100 hours. 12 weeks. One clear goal.):');
  lines.push('1. UNDERSTAND (Close the gaps — Maths & Science):');
  lines.push('   01. Strengthen weak fundamentals | 02. Understand concepts from first principles');
  lines.push('   03. Learn the why, not just the formula | 04. Connect concepts across chapters');
  lines.push('   05. Develop clear methods for solving problems');
  lines.push('2. MASTER (Practise. Apply. Solve.):');
  lines.push('   1. Basic: Concept-First questions | 2. Application: Exam-Style problems');
  lines.push('   3. Higher-Order: Competency questions | 4. Board Pattern: High-impact PYQs');
  lines.push('3. PERFORM (Test. Analyse. Improve.):');
  lines.push('   6 Full-Length Mock Tests (3 Maths + 3 Science)');
  lines.push('   Attempt → Analyse → Identify Mistakes → Correct → Improve');
  lines.push('NOT 100 HOURS OF LECTURES. IT\'S 100 HOURS OF GUIDED PREPARATION!');
  lines.push('');
  lines.push('STAR FACULTY GUIDING YOUR CHILD:');
  lines.push('• Mr. Amal M Das (B.Tech, IIT KGP | Program Coordinator & Maths HOD)');
  lines.push('• Mr. Brajesh (B.Tech, IIT Madras | Physics HOD)');
  lines.push('• Mr. Ninad (B.Tech, IIT Madras | Chemistry HOD)');
  lines.push('• Mr. Thirumala (M.Tech, NIT Warangal | Maths Faculty)');
  lines.push('');

  // PAGE 6 (DEVELOPMENT ONLY: DETAILED CALCULATION STEPS & AUDIT)
  const cs = data.calculationSteps;
  lines.push('================================================================================');
  lines.push('PAGE 6: DIAGNOSTIC AUDIT & CALCULATION STEPS (DEVELOPMENT ONLY)');
  lines.push('================================================================================');
  lines.push('');
  lines.push('PAGE 6 — DIAGNOSTIC AUDIT & CALCULATION STEPS');
  lines.push('DEVELOPMENT & AUDIT MODE: VERIFICATION TRACE FOR EVALUATION LOGIC');
  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('1. SCORING & BOARD READINESS INDEX (BRI) CALCULATION STEPS');
  lines.push('--------------------------------------------------------------------------------');
  lines.push(`• Total Questions Evaluated (N): ${cs.scoring.totalQuestionsN}`);
  lines.push(`• Scoring Condition: Si = 1 if Attempted == true and SelectedOption == Answer; else 0`);
  lines.push(`• Total Raw Score: sum(Si) = ${cs.scoring.rawScoreSum} / ${cs.scoring.totalQuestionsN}`);
  lines.push(`• Total Diagnostic Weight (W_total): sum(Wi) = ${cs.scoring.diagnosticWeightSum} points`);
  lines.push(`• Total Weighted Score: sum(Si * Wi) = ${cs.scoring.weightedScoreSum} points`);
  lines.push(`• Board Readiness Index Formula:`);
  lines.push(`  BRI = (Total Weighted Score / Total Diagnostic Weight) * 100%`);
  lines.push(`  BRI = (${cs.scoring.weightedScoreSum} / ${cs.scoring.diagnosticWeightSum}) * 100% = ${cs.scoring.briResult}%`);
  lines.push(`• Level of Preparation Threshold Rules:`);
  lines.push(`  - BRI >= 80%                     -> High achievement Potential`);
  lines.push(`  - 60% <= BRI < 80%               -> Conceptually Strong`);
  lines.push(`  - BRI < 60%                      -> Basic`);
  lines.push(`• Applied Rule: ${cs.scoring.levelRule} -> Level: ${cs.scoring.levelResult}`);
  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('2. SUBJECT & DIFFICULTY BREAKDOWNS (CALCULATION STEPS)');
  lines.push('--------------------------------------------------------------------------------');
  cs.breakdowns.forEach((b) => {
    lines.push(`• ${b.area}:`);
    lines.push(`  - Filter Rule: ${b.filterCondition}`);
    lines.push(`  - Matching Questions: [${b.matchingQuestions.join(', ')}] (Total: ${b.total})`);
    lines.push(`  - Score: ${b.score} / ${b.total} -> Formula: ${b.formula} = ${b.percentage}%`);
  });
  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('3. PRIMARY SKILLS & ACCURACY WEIGHTED DERIVATION STEPS');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('• Classification Thresholds:');
  lines.push('  - Good: Score > 66.67%');
  lines.push('  - Average: 33.33% < Score <= 66.67%');
  lines.push('  - Needs Strengthening: Score <= 33.33%');
  lines.push('');
  cs.skills.forEach((s) => {
    lines.push(`• ${s.skillName}:`);
    lines.push(`  - Filter: ${s.filterCondition}`);
    lines.push(`  - Questions: [${s.matchingQuestions.join(', ')}]`);
    lines.push(`  - Weighted Sum: Earned ${s.earnedWeights} / Total ${s.totalWeights} points`);
    lines.push(`  - Calculation: ${s.formula} = ${s.percentage}% -> Category: ${s.categoryResult}`);
  });
  lines.push('');
  if (cs.timeManagement) {
    lines.push('--------------------------------------------------------------------------------');
    lines.push('4. TIME MANAGEMENT & PACING CALCULATION STEPS');
    lines.push('--------------------------------------------------------------------------------');
    lines.push(`• Total Attempted Questions: ${cs.timeManagement.attemptedCount}`);
    lines.push(`• Per-Question Rules:`);
    lines.push(`  - time < 1.5 * ETS       -> Good time management (score = 3)`);
    lines.push(`  - 1.5 * ETS <= time <= 2 * ETS -> Medium time management (score = 2)`);
    lines.push(`  - time > 2 * ETS         -> Poor time management (score = 1)`);
    lines.push(`• Total Time Score: ${cs.timeManagement.totalScore} / ${cs.timeManagement.maxPossibleScore} (Max: 3 * attempted)`);
    lines.push(`• Time Management Formula: (Score / (3 * Attempted)) * 100%`);
    lines.push(`  Calculation: ${cs.timeManagement.formula} = ${cs.timeManagement.finalScorePercent}%`);
    lines.push(`• Rating Thresholds: Score <= 33% (Poor) | 33% - 66% (Medium) | >= 66% (Good)`);
    lines.push(`• Final Rating: ${cs.timeManagement.ratingResult}`);
    if (cs.timeManagement.guessworkQuestions.length > 0) {
      lines.push(`• Guesswork Flag (<8s): [Q${cs.timeManagement.guessworkQuestions.join(', Q')}]`);
    } else {
      lines.push(`• Guesswork Flag (<8s): None detected`);
    }
    lines.push('');
  }
  lines.push('--------------------------------------------------------------------------------');
  lines.push('5. 7 QUESTION STRUCTURE PERFORMANCE BREAKDOWN');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('| Question Type     | Matching Questions        | Correct / Total | Performance (%) |');
  lines.push('|-------------------|---------------------------|-----------------|-----------------|');
  cs.structures.forEach((st) => {
    lines.push(
      `| ${st.structureType.padEnd(17)} | ${('Q' + st.matchingQuestions.join(', Q')).padEnd(25)} | ${(st.correctCount + ' / ' + st.totalCount).padEnd(15)} | ${String(st.percentage + '%').padEnd(15)} |`,
    );
  });
  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('6. COMPLETE QUESTION-BY-QUESTION EVALUATION AUDIT');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('| Q# | Subject | Chapter | Weight | Ans | Att? | Sel | Corr? | Spent | ETS | Time Label (Score) | Guess? | Issue |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  cs.questionAudit.forEach((a) => {
    lines.push(
      `| ${a.qno} | ${a.subject} | ${a.chapter} | ${a.diagnosticWeight} | ${a.correctAnswer} | ${a.attempted ? 'Yes' : 'No'} | ${a.selectedOption ?? '—'} | ${a.isCorrect ? 'Yes' : 'No'} | ${a.timeTakenS}s | ${a.expectedUpperBoundS}s | ${a.timeManagementLabel ?? '—'} (${a.timeManagementScore ?? '—'}) | ${a.isGuesswork ? 'YES' : 'No'} | ${a.revisitCategory ?? 'None'} |`,
    );
  });
  lines.push('');
  lines.push('*End of Diagnostic Audit Report (Page 4)*');

  return lines.join('\n');
}

export const SAMPLE_20_METADATA: QuestionMetadataItem[] = [
  {
    qno: 1,
    subject: 'Maths',
    chapter: 'Real Numbers',
    topic: 'HCF & LCM',
    conceptTested: 'Relationship between HCF and LCM',
    prerequisiteConcept: 'HCF/LCM concept',
    difficulty: 'Easy',
    primarySkill: 'Concept Application',
    secondarySkill: 'Calculation',
    questionStructure: 'Direct',
    visualDependency: 'None',
    expectedTime: '45,60',
    answer: 'B',
    diagnosticWeight: 1,
  },
  {
    qno: 2,
    subject: 'Maths',
    chapter: 'Polynomials',
    topic: 'Zeros of a Polynomial',
    conceptTested: 'Product of roots and zeros of a quadratic polynomial',
    prerequisiteConcept: 'Roots/zeros of quadratic polynomial',
    difficulty: 'Easy',
    primarySkill: 'Concept Application',
    secondarySkill: 'Calculation',
    questionStructure: 'Direct',
    visualDependency: 'None',
    expectedTime: '30,45',
    answer: 'C',
    diagnosticWeight: 1,
  },
  {
    qno: 3,
    subject: 'Maths',
    chapter: 'Pair of Linear Equations in Two Variables',
    topic: 'Consistency of Linear Equations',
    conceptTested: 'Condition for infinite solutions',
    prerequisiteConcept: 'Coincident lines / ratios condition',
    difficulty: 'Easy',
    primarySkill: 'Conceptual Foundation',
    secondarySkill: 'Calculation',
    questionStructure: 'Direct',
    visualDependency: 'None',
    expectedTime: '30,45',
    answer: 'C',
    diagnosticWeight: 1,
  },
  {
    qno: 4,
    subject: 'Maths',
    chapter: 'Coordinate Geometry',
    topic: 'Distance Formula',
    conceptTested: 'Distance from origin',
    prerequisiteConcept: 'Distance formula / Pythagoras theorem',
    difficulty: 'Easy',
    primarySkill: 'Concept Application',
    secondarySkill: 'Calculation',
    questionStructure: 'Direct',
    visualDependency: 'None',
    expectedTime: '30,45',
    answer: 'B',
    diagnosticWeight: 1,
  },
  {
    qno: 5,
    subject: 'Maths',
    chapter: 'Triangles',
    topic: 'Basic Proportionality Theorem (Thales Theorem)',
    conceptTested: 'Application of BPT in a triangle',
    prerequisiteConcept: 'Ratio of sides / Thales theorem',
    difficulty: 'Easy',
    primarySkill: 'Concept Application',
    secondarySkill: 'Calculation',
    questionStructure: 'Direct',
    visualDependency: 'None',
    expectedTime: '45,60',
    answer: 'B',
    diagnosticWeight: 1,
  },
  {
    qno: 6,
    subject: 'Maths',
    chapter: 'Circles',
    topic: 'Tangents to a Circle',
    conceptTested: 'Equal tangents from an external point',
    prerequisiteConcept: 'Tangent properties / circle geometry',
    difficulty: 'Medium',
    primarySkill: 'Concept Application',
    secondarySkill: 'Visual Interpretation',
    questionStructure: 'Diagram-based, Multi-step',
    visualDependency: 'High',
    expectedTime: '75,90',
    answer: 'A',
    diagnosticWeight: 2,
  },
  {
    qno: 7,
    subject: 'Maths',
    chapter: 'Statistics',
    topic: 'Median & Mode',
    conceptTested: 'Identifying median and modal classes',
    prerequisiteConcept: 'Cumulative frequency / frequency distribution',
    difficulty: 'Medium',
    primarySkill: 'Concept Application',
    secondarySkill: 'Interpretation',
    questionStructure: 'Data-based',
    visualDependency: 'Medium',
    expectedTime: '60,75',
    answer: 'B',
    diagnosticWeight: 2,
  },
  {
    qno: 8,
    subject: 'Maths',
    chapter: 'Quadratic Equations',
    topic: 'Relationship between roots and coefficients',
    conceptTested: 'Relationship between roots and coefficients of the quadratic equation',
    prerequisiteConcept: 'Relationship between roots and coefficients of the quadratic equation',
    difficulty: 'Easy',
    primarySkill: 'Conceptual Foundation',
    secondarySkill: 'Calculation',
    questionStructure: 'Multi-step',
    visualDependency: 'None',
    expectedTime: '30,45',
    answer: 'B',
    diagnosticWeight: 1,
  },
  {
    qno: 9,
    subject: 'Maths',
    chapter: 'Introduction to Trigonometry',
    topic: 'Trigonometric Ratios',
    conceptTested: 'Finding angle using tan ratio',
    prerequisiteConcept: 'Right triangle / trig ratios',
    difficulty: 'Easy',
    primarySkill: 'Concept Application',
    secondarySkill: 'Interpretation',
    questionStructure: 'Word problem',
    visualDependency: 'None',
    expectedTime: '60,75',
    answer: 'C',
    diagnosticWeight: 2,
  },
  {
    qno: 10,
    subject: 'Maths',
    chapter: 'Surface Areas & Volumes',
    topic: 'Volume of Combined Solids',
    conceptTested: 'Volume of cone + hemisphere',
    prerequisiteConcept: 'Volume formulas',
    difficulty: 'Difficult',
    primarySkill: 'Problem Solving',
    secondarySkill: 'Calculation',
    questionStructure: 'Multi-step',
    visualDependency: 'Low',
    expectedTime: '90,120',
    answer: 'C',
    diagnosticWeight: 2,
  },
  {
    qno: 11,
    subject: 'Physics',
    chapter: 'Magnetic Effects of Electric Current',
    topic: 'Magnetic field due to current-carrying conductor',
    conceptTested: 'Direction of magnetic field around a straight current-carrying conductor',
    prerequisiteConcept: 'Right-hand thumb rule / magnetic field around current-carrying wire',
    difficulty: 'Easy',
    primarySkill: 'Conceptual Foundation',
    secondarySkill: 'Visual Interpretation',
    questionStructure: 'Diagram-based',
    visualDependency: 'High',
    expectedTime: '30,45',
    answer: 'D',
    diagnosticWeight: 1,
  },
  {
    qno: 12,
    subject: 'Physics',
    chapter: 'Light – Reflection and Refraction',
    topic: 'Image formation by concave lens',
    conceptTested: 'Lens formula and image formation by a concave lens',
    prerequisiteConcept: 'Sign convention + lens formula',
    difficulty: 'Medium',
    primarySkill: 'Concept Application',
    secondarySkill: 'Calculation, Procedural Accuracy',
    questionStructure: 'Direct',
    visualDependency: 'Low',
    expectedTime: '60,75',
    answer: 'C',
    diagnosticWeight: 2,
  },
  {
    qno: 13,
    subject: 'Physics',
    chapter: 'Electricity',
    topic: 'Combination of resistors / effective resistance',
    conceptTested: 'Reduction of complex resistor network + potential difference across a resistor',
    prerequisiteConcept: "Series and parallel combinations; Ohm's law; potential difference",
    difficulty: 'Difficult',
    primarySkill: 'Problem Solving',
    secondarySkill: 'Logical / Analytical Reasoning',
    questionStructure: 'Diagram-based, Multi-step',
    visualDependency: 'High',
    expectedTime: '90,120',
    answer: 'D',
    diagnosticWeight: 3,
  },
  {
    qno: 14,
    subject: 'Physics',
    chapter: 'Electricity',
    topic: 'Power',
    conceptTested: 'Relationship between potential difference, current and resistance',
    prerequisiteConcept: "Ohm's law",
    difficulty: 'Easy',
    primarySkill: 'Concept Application',
    secondarySkill: 'Calculation, Procedural Accuracy',
    questionStructure: 'Direct',
    visualDependency: 'None',
    expectedTime: '30,45',
    answer: 'B',
    diagnosticWeight: 1,
  },
  {
    qno: 15,
    subject: 'Chemistry',
    chapter: 'Chemical Reactions and Equations',
    topic: 'Oxidation and Reduction / Reducing Agent',
    conceptTested: 'Identification of the reducing agent in a redox reaction',
    prerequisiteConcept: 'Oxidation and reduction; electron transfer / oxygen-hydrogen concept',
    difficulty: 'Easy',
    primarySkill: 'Conceptual Foundation',
    secondarySkill: 'Logical / Analytical Reasoning',
    questionStructure: 'Direct',
    visualDependency: 'None',
    expectedTime: '30,45',
    answer: 'A',
    diagnosticWeight: 1,
  },
  {
    qno: 16,
    subject: 'Chemistry',
    chapter: 'Acids, Bases and Salts',
    topic: 'pH and Hydrogen Ion Concentration',
    conceptTested: 'Relationship between pH and hydrogen ion concentration',
    prerequisiteConcept: 'pH scale; meaning of acidic/basic strength',
    difficulty: 'Easy',
    primarySkill: 'Conceptual Foundation',
    secondarySkill: 'Interpretation',
    questionStructure: 'Data-based',
    visualDependency: 'None',
    expectedTime: '30,45',
    answer: 'B',
    diagnosticWeight: 1,
  },
  {
    qno: 17,
    subject: 'Chemistry',
    chapter: 'Metals and Non-metals',
    topic: 'Thermite Reaction / Reactivity of Metals',
    conceptTested: 'Aluminum displaces iron from iron oxide in a highly exothermic thermite reaction',
    prerequisiteConcept: 'Reactivity series; displacement reactions; properties of metals',
    difficulty: 'Difficult',
    primarySkill: 'Conceptual Foundation',
    secondarySkill: 'Application',
    questionStructure: 'Diagram-based, Application-based',
    visualDependency: 'High',
    expectedTime: '60,90',
    answer: 'C',
    diagnosticWeight: 3,
  },
  {
    qno: 18,
    subject: 'Chemistry',
    chapter: 'Carbon and Its Compounds',
    topic: 'Functional Groups / Carboxylic Acids',
    conceptTested: 'Identification of the functional group that reacts with baking soda to release CO₂',
    prerequisiteConcept: 'Functional groups; properties of carboxylic acids; acid-carbonate reaction',
    difficulty: 'Medium',
    primarySkill: 'Conceptual Foundation',
    secondarySkill: 'Application',
    questionStructure: 'Structure-based',
    visualDependency: 'High',
    expectedTime: '45,60',
    answer: 'D',
    diagnosticWeight: 2,
  },
  {
    qno: 19,
    subject: 'Biology',
    chapter: 'Life Processes',
    topic: 'Stomata and Gaseous Exchange',
    conceptTested: 'Role of water movement and guard-cell turgidity in opening stomata',
    prerequisiteConcept: 'Structure of stomata; guard cells; osmosis / turgidity',
    difficulty: 'Easy',
    primarySkill: 'Conceptual Foundation',
    secondarySkill: 'Visual Interpretation',
    questionStructure: 'Diagram-based',
    visualDependency: 'Low',
    expectedTime: '45,60',
    answer: 'B',
    diagnosticWeight: 1,
  },
  {
    qno: 20,
    subject: 'Biology',
    chapter: 'Heredity and Evolution',
    topic: 'Mendelian Inheritance / Monohybrid Cross',
    conceptTested: 'Expected proportion of heterozygous tall plants in F₂ generation',
    prerequisiteConcept: 'Dominant/recessive traits; genotype; monohybrid cross',
    difficulty: 'Medium',
    primarySkill: 'Concept Application',
    secondarySkill: 'Logical / Analytical Reasoning',
    questionStructure: 'Multi-step, Application-based',
    visualDependency: 'Low',
    expectedTime: '60,75',
    answer: 'B',
    diagnosticWeight: 2,
  },
];

export function getSampleDiagnosticReport(studentName = 'Aarav Sharma'): DiagnosticEvaluationResult {
  const responses: StudentQuestionResponse[] = SAMPLE_20_METADATA.map((m, idx) => {
    if (idx < 5) {
      return { qno: m.qno, attempted: true, selectedOption: m.answer, timeTakenSeconds: 38 };
    }
    if (idx === 5) {
      return { qno: m.qno, attempted: true, selectedOption: m.answer, timeTakenSeconds: 95 };
    }
    if (idx === 6) {
      return { qno: m.qno, attempted: true, selectedOption: m.answer === 'A' ? 'B' : 'A', timeTakenSeconds: 45 };
    }
    if (idx === 7) {
      return { qno: m.qno, attempted: true, selectedOption: m.answer === 'C' ? 'D' : 'C', timeTakenSeconds: 130 };
    }
    if (idx < 12) {
      return { qno: m.qno, attempted: true, selectedOption: m.answer, timeTakenSeconds: 48 };
    }
    if (idx === 12) {
      return { qno: m.qno, attempted: false, selectedOption: null, timeTakenSeconds: 10 };
    }
    if (idx < 16) {
      return { qno: m.qno, attempted: true, selectedOption: m.answer, timeTakenSeconds: 55 };
    }
    return { qno: m.qno, attempted: false, selectedOption: null, timeTakenSeconds: 5 };
  });

  return evaluateDiagnosticReport(SAMPLE_20_METADATA, {
    studentName,
    responses,
  });
}
