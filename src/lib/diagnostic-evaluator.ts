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
  responses: StudentQuestionResponse[];
}

export type PreparationLevel = 'ADVANCED' | 'PROFICIENT' | 'BASIC' | 'NEEDS IMMEDIATE INTERVENTION';
export type SkillValueCategory = 'Good' | 'Average' | 'Needs Strengthening';
export type PriorityLevel = 'High Priority' | 'Medium Priority' | 'Low Priority';
export type RevisitCategory =
  | 'Pacing / Time Management'
  | 'Conceptual / Calculation Gap'
  | 'High Friction Gap';

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

export interface DiagnosticEvaluationResult {
  studentName: string;
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
    easy: AreaPerformance;
    medium: AreaPerformance;
    difficult: AreaPerformance;
  };

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
  strengths: StrengthItem[];
  priorityGaps: PriorityGapItem[];
  topicsToRevisit: TopicToRevisitItem[];

  // Dynamic Narratives
  keyInsight: string;
  performancePatternInsight: string;

  // Plain Text formatted report
  plainTextReport: string;
}

export function parseExpectedTimeUpperBound(raw: string | null | undefined): number {
  if (!raw) return 60;
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

export function classifySkillValue(percentage: number): SkillValueCategory {
  if (percentage > (2 / 3) * 100) return 'Good';
  if (percentage > (1 / 3) * 100) return 'Average';
  return 'Needs Strengthening';
}

export function classifyPreparationLevel(bri: number): PreparationLevel {
  if (bri >= 80) return 'ADVANCED';
  if (bri >= 60) return 'PROFICIENT';
  if (bri >= 40) return 'BASIC';
  return 'NEEDS IMMEDIATE INTERVENTION';
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
    ['physics', 'chemistry', 'biology'].includes(eq.meta.subject.toLowerCase()),
  );

  const mathsScore = mathsQs.filter((q) => q.isCorrect).length;
  const scienceScore = scienceQs.filter((q) => q.isCorrect).length;

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

  const conceptualFoundation = computeWeightedSkill(
    (q) => q.meta.primarySkill.trim().toLowerCase() === 'conceptual foundation',
    'Conceptual Foundation',
  );

  const conceptApplication = computeWeightedSkill(
    (q) => q.meta.primarySkill.trim().toLowerCase() === 'concept application',
    'Concept Application Skill',
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
  const questionInterpretation = computeWeightedSkill((q) => {
    const sec = (q.meta.secondarySkill ?? '').toLowerCase();
    const struc = (q.meta.questionStructure ?? '').toLowerCase();
    const vis = (q.meta.visualDependency ?? '').toLowerCase();

    const matchesSec = sec.includes('interpretation');
    const matchesStruc = struc.includes('data-based') || struc.includes('diagram-based');
    const matchesVis = vis === 'high';

    return matchesSec || matchesStruc || matchesVis;
  }, 'Question Interpretation Skill');

  // Question Structure Performance (7 Structural Types)
  const STRUCTURAL_TYPES = [
    { key: 'Direct', label: 'Direct', regex: /\bdirect\b/i },
    { key: 'Multi-step', label: 'Multi-step', regex: /\bmulti[- ]step\b/i },
    { key: 'Diagram-based', label: 'Diagram-based', regex: /\bdiagram[- ]based\b/i },
    { key: 'Data-based', label: 'Data-based', regex: /\bdata[- ]based\b/i },
    { key: 'Application-based', label: 'Application-based', regex: /\bapplication[- ]based\b/i },
    { key: 'Word problem', label: 'Word Problem', regex: /\bword problem\b/i },
    { key: 'Structure-based', label: 'Structure-based', regex: /\bstructure[- ]based\b/i },
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

  // Top 3 Strengths
  // Candidate pool: chapters with high scores, high-scoring question types, and top skills
  type StrengthCandidate = {
    name: string;
    percentage: number;
    scoreDetails: string;
    reason: string;
    priorityScore: number; // For sorting
  };

  const strengthCandidates: StrengthCandidate[] = [];

  for (const ch of chapterList) {
    if (ch.percentage >= 60) {
      strengthCandidates.push({
        name: ch.name,
        percentage: ch.percentage,
        scoreDetails: `${ch.correct}/${ch.total} (${ch.percentage}%)`,
        reason:
          ch.percentage === 100
            ? 'Demonstrated flawless conceptual clarity and accurate execution on all questions.'
            : 'Consistently converted conceptual understanding into correct answers with solid foundation.',
        priorityScore: ch.percentage * 10 + ch.total,
      });
    }
  }

  for (const st of structures) {
    if (st.total >= 2 && st.percentage >= 60) {
      strengthCandidates.push({
        name: `${st.type} Questions`,
        percentage: st.percentage,
        scoreDetails: `${st.correct}/${st.total} (${st.percentage}%)`,
        reason: `Efficient handling and high accuracy when tackling questions structured as ${st.type.toLowerCase()}.`,
        priorityScore: st.percentage * 10 + st.total,
      });
    }
  }

  const skillsList = [
    conceptualFoundation,
    conceptApplication,
    problemSolving,
    questionInterpretation,
  ];

  for (const sk of skillsList) {
    if (sk.scorePercent >= 60) {
      strengthCandidates.push({
        name: sk.name,
        percentage: sk.scorePercent,
        scoreDetails: `${sk.earnedWeight}/${sk.totalWeight} pts (${sk.scorePercent}%)`,
        reason: `High proficiency (${sk.category}) in applying ${sk.name.toLowerCase()} under exam conditions.`,
        priorityScore: sk.scorePercent * 10 + sk.totalWeight,
      });
    }
  }

  // Fallback if student scored lower across the board: pick highest available
  if (strengthCandidates.length === 0) {
    chapterList.sort((a, b) => b.percentage - a.percentage);
    for (const ch of chapterList.slice(0, 3)) {
      strengthCandidates.push({
        name: ch.name,
        percentage: ch.percentage,
        scoreDetails: `${ch.correct}/${ch.total} (${ch.percentage}%)`,
        reason: 'Best relative baseline performance showing developing conceptual comprehension.',
        priorityScore: ch.percentage,
      });
    }
  }

  strengthCandidates.sort((a, b) => b.priorityScore - a.priorityScore);
  const top3Strengths: StrengthItem[] = strengthCandidates.slice(0, 3).map((item, idx) => ({
    rank: idx + 1,
    name: item.name,
    scoreDetails: item.scoreDetails,
    percentage: item.percentage,
    reason: item.reason,
  }));

  // Priority Gaps (4 lowest-scoring chapters or syllabus areas)
  chapterList.sort((a, b) => a.percentage - b.percentage);
  const priorityGaps: PriorityGapItem[] = chapterList.slice(0, 4).map((ch, idx) => ({
    rank: idx + 1,
    name: ch.name,
    scorePercent: ch.percentage,
    priority: classifyPriority(ch.percentage),
  }));

  // Topics to Revisit
  // Flag every question that meets at least one of these two operational triggers:
  // 1. Time Inefficiency: TimeTakenSeconds > upper bound of Expected Time
  // 2. Inaccuracy: Attempted == true and SelectedOption != Answer (or skipped)
  const topicsToRevisit: TopicToRevisitItem[] = [];

  for (const q of evaluatedQuestions) {
    const isOvertime = q.timeTakenSeconds > q.upperLimit;
    const isIncorrect = !q.isCorrect;

    if (!isOvertime && !isIncorrect) {
      continue; // Met both time and accuracy criteria!
    }

    let category: RevisitCategory;
    let issueObserved: string;

    if (q.isCorrect && isOvertime) {
      category = 'Pacing / Time Management';
      issueObserved = `Spent ${q.timeTakenSeconds}s vs ${q.upperLimit}s limit (Pacing exceeded)`;
    } else if (isIncorrect && isOvertime) {
      category = 'High Friction Gap';
      issueObserved = q.attempted
        ? `Spent ${q.timeTakenSeconds}s vs ${q.upperLimit}s limit (Incorrect)`
        : `Spent ${q.timeTakenSeconds}s vs ${q.upperLimit}s limit (Unattempted)`;
    } else {
      category = 'Conceptual / Calculation Gap';
      issueObserved = q.attempted
        ? `Incorrect answer within ${q.timeTakenSeconds}s (limit ${q.upperLimit}s)`
        : `Question skipped / unattempted (${q.timeTakenSeconds}s)`;
    }

    const recommendedFocusArea =
      q.meta.conceptTested || q.meta.prerequisiteConcept || q.meta.topic;

    topicsToRevisit.push({
      qno: q.meta.qno,
      subject: q.meta.subject,
      chapter: q.meta.chapter,
      topic: q.meta.topic,
      issueObserved,
      category,
      recommendedFocusArea,
      timeTaken: q.timeTakenSeconds,
      expectedLimit: q.upperLimit,
      isCorrect: q.isCorrect,
      attempted: q.attempted,
    });
  }

  // Dynamic Narrative Generation: Page 1 "YOUR KEY INSIGHT"
  const studentFirstName = student.studentName.split(' ')[0] || student.studentName;
  const mathsPct = mathsPerf.percentage;
  const sciPct = sciencePerf.percentage;
  const interpretationCat = questionInterpretation.category;
  const problemSolvingCat = problemSolving.category;
  const conceptFoundCat = conceptualFoundation.category;

  let keyInsight = '';
  if (briScore >= 80) {
    keyInsight = `${studentFirstName} demonstrates an outstanding academic foundation across both Mathematics (${mathsPct}%) and Science (${sciPct}%), placing their current preparation in the ADVANCED band. Core conceptual recall is remarkably resilient, with strong visual interpretation and systematic execution on multi-step problems. To solidify a top-tier score in the upcoming Class X Board examination, focus on eliminating minor time-leakages on high-friction calculation steps and maintaining procedural precision on descriptive questions.`;
  } else if (briScore >= 60) {
    if (problemSolvingCat === 'Needs Strengthening' || problemSolving.scorePercent < 50) {
      keyInsight = `${studentFirstName} shows a promising baseline with solid conceptual understanding (${conceptFoundCat}), currently placing in the PROFICIENT readiness band. While direct factual and formula-driven questions are answered reliably, performance dips when navigating multi-step problem solving where calculations compound. Converting this understanding into consistent Board exam marks requires focused drill on algebraic multi-step pacing and bridging prerequisite concepts in complex topics.`;
    } else {
      keyInsight = `${studentFirstName} showcases commendable competence with balanced scores across Mathematics (${mathsPct}%) and Science (${sciPct}%), positioning their performance firmly in the PROFICIENT category. Core concepts are well understood, but occasional interpretation lapses on diagram- and data-based prompts create preventable mark losses. Enhancing systematic question-parsing before jumping into calculations will rapidly elevate this solid baseline into the 90%+ Board bracket.`;
    }
  } else if (briScore >= 40) {
    keyInsight = `${studentFirstName}'s diagnostic profile reflects an active learning curve currently situated in the BASIC readiness band (${briScore}% BRI). The results show clear familiarity with elementary definitions, but substantial friction arises as questions transition from direct recall to application-based and visual interpretations. With structured topic-by-topic reinforcement in flagged high-priority chapters and guided practice on timed execution, ${studentFirstName} can make rapid, significant leaps toward Board excellence.`;
  } else {
    keyInsight = `${studentFirstName}'s diagnostic results indicate that foundational concepts across critical chapters require immediate, structured intervention (${briScore}% BRI). The primary bottleneck lies in core prerequisite concepts and procedural confidence, which currently leads to hesitation and timeouts across multiple question formats. A focused revision plan targeting fundamental definitions and step-by-step worked examples will quickly rebuild confidence and yield substantial score gains.`;
  }

  // Dynamic Narrative Generation: Page 2 "WHAT THIS TELLS YOU"
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

  // Generate Exact Plain Text Report Layout per Section 3
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
    scienceScore: sciencePerf.score,
    scienceTotalQuestions: sciencePerf.totalQuestions,
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
    top3Strengths,
    structures,
    performancePatternInsight,
    priorityGaps,
    topicsToRevisit,
  });

  return {
    studentName: student.studentName,
    totalQuestions: N,
    totalRawScore,
    totalDiagnosticWeight,
    totalWeightedScore,
    briScore,
    levelOfPreparation,
    breakdown: {
      mathematics: mathsPerf,
      science: sciencePerf,
      easy: easyPerf,
      medium: medPerf,
      difficult: diffPerf,
    },
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
    strengths: top3Strengths,
    priorityGaps,
    topicsToRevisit,
    keyInsight,
    performancePatternInsight,
    plainTextReport,
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
  scienceScore: number;
  scienceTotalQuestions: number;
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
  top3Strengths: StrengthItem[];
  structures: QuestionStructurePerformance[];
  performancePatternInsight: string;
  priorityGaps: PriorityGapItem[];
  topicsToRevisit: TopicToRevisitItem[];
}): string {
  const lines: string[] = [];

  // PAGE 1
  lines.push('================================================================================');
  lines.push('PAGE 1: SRSMA BOARD READINESS CHALLENGE REPORT');
  lines.push('================================================================================');
  lines.push('');
  lines.push('SRSMA BOARD READINESS CHALLENGE REPORT');
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
  lines.push(
    `OVERALL SCORE: ${data.totalRawScore} / ${data.totalQuestions} (${data.totalWeightedScore} / ${data.totalDiagnosticWeight} Weighted Points)`,
  );
  lines.push(`BOARD READINESS INDEX: ${data.briScore}%`);
  lines.push(`LEVEL OF PREPARATION: ${data.levelOfPreparation}`);
  lines.push('');
  lines.push('| Area                 | Performance                                  |');
  lines.push('|----------------------|----------------------------------------------|');
  lines.push(`| Mathematics          | ${(data.mathsScore + ' / ' + data.mathsTotalQuestions).padEnd(44)} |`);
  lines.push(`| Science              | ${(data.scienceScore + ' / ' + data.scienceTotalQuestions).padEnd(44)} |`);
  lines.push(`| Easy Questions       | ${(data.easyScore + ' / ' + data.easyTotalQuestions).padEnd(44)} |`);
  lines.push(`| Medium Questions     | ${(data.mediumScore + ' / ' + data.mediumTotalQuestions).padEnd(44)} |`);
  lines.push(`| Difficult Questions  | ${(data.difficultScore + ' / ' + data.difficultTotalQuestions).padEnd(44)} |`);
  lines.push('');
  lines.push('YOUR BOARD READINESS PROFILE');
  lines.push(`• Conceptual Foundation       — ${data.conceptualFoundationCategory}`);
  lines.push(`• Concept Application Skill   — ${data.conceptApplicationCategory}`);
  lines.push(`• Problem Solving Skill       — ${data.problemSolvingCategory}`);
  lines.push(`• Accuracy                    — ${data.accuracyCategory}`);
  lines.push(`• Question Interpretation Skill — ${data.questionInterpretationCategory}`);
  lines.push('');
  lines.push('(Three Levels: Good | Average | Needs Strengthening)');
  lines.push('');
  lines.push('YOUR KEY INSIGHT');
  lines.push(data.keyInsight);
  lines.push('');

  // PAGE 2
  lines.push('================================================================================');
  lines.push('PAGE 2: PERFORMANCE ANALYSIS & PATTERNS');
  lines.push('================================================================================');
  lines.push('');
  lines.push('YOUR STRENGTHS');
  data.top3Strengths.forEach((s) => {
    lines.push(`${s.rank}. ${s.name}: ${s.scoreDetails} — ${s.reason}`);
  });
  lines.push('');
  lines.push('YOUR PERFORMANCE PATTERN');
  lines.push('| Question Type     | Correct / Total                           | Performance (%) |');
  lines.push('|-------------------|-------------------------------------------|-----------------|');
  data.structures.forEach((st) => {
    lines.push(
      `| ${st.type.padEnd(17)} | ${(st.correct + ' / ' + st.total).padEnd(41)} | ${String(st.percentage + '%').padEnd(15)} |`,
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
  data.priorityGaps.forEach((g) => {
    lines.push(`${g.rank}. ${g.name}: ${g.scorePercent}% — Priority: ${g.priority.replace(' Priority', '')}`);
  });
  lines.push('');
  lines.push('*(Priority Benchmarks: < 40% = High Priority | 40% to 55% = Medium Priority | 55% to 74% = Low Priority)*');
  lines.push('');
  lines.push('TOPICS TO REVISIT');
  lines.push('List of topics where pacing or accuracy issues occurred during the test:');
  lines.push('');
  lines.push('| Q# | Subject | Chapter | Topic | Issue Observed | Category | Recommended Focus Area |');
  lines.push('|---|---|---|---|---|---|---|');
  data.topicsToRevisit.forEach((t) => {
    lines.push(
      `| ${t.qno} | ${t.subject} | ${t.chapter} | ${t.topic} | ${t.issueObserved} | ${t.category} | ${t.recommendedFocusArea} |`,
    );
  });
  lines.push('');
  lines.push('*Topic observations are based only on the questions tested.*');

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
