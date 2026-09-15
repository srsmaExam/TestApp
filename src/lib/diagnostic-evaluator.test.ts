import { describe, expect, it } from 'vitest';
import {
  evaluateDiagnosticReport,
  classifySkillValue,
  classifyPreparationLevel,
  classifyPriority,
  parseExpectedTimeUpperBound,
  type QuestionMetadataItem,
  type StudentResponsePayload,
} from './diagnostic-evaluator';

describe('SRSMA Diagnostic Evaluator', () => {
  const sampleMetadata: QuestionMetadataItem[] = [
    {
      qno: 1,
      subject: 'Maths',
      chapter: 'Real Numbers',
      topic: 'HCF & LCM',
      difficulty: 'Easy',
      primarySkill: 'Concept Application',
      secondarySkill: 'Calculation',
      questionStructure: 'Direct',
      visualDependency: 'None',
      expectedTime: '45–60 sec',
      answer: 'B',
      diagnosticWeight: 1,
      conceptTested: 'Relationship between HCF and LCM',
      prerequisiteConcept: 'HCF/LCM concept',
    },
    {
      qno: 2,
      subject: 'Maths',
      chapter: 'Polynomials',
      topic: 'Zeroes of a Polynomial',
      difficulty: 'Easy',
      primarySkill: 'Concept Application',
      secondarySkill: 'Reasoning',
      questionStructure: 'Direct',
      visualDependency: 'None',
      expectedTime: '30–45 sec',
      answer: 'C',
      diagnosticWeight: 1,
      conceptTested: 'Relationship between zeroes and coefficients',
      prerequisiteConcept: 'Quadratic polynomial / factorisation',
    },
    {
      qno: 3,
      subject: 'Maths',
      chapter: 'Triangles',
      topic: 'Similarity of Triangles',
      difficulty: 'Difficult',
      primarySkill: 'Problem Solving',
      secondarySkill: 'Visual Interpretation',
      questionStructure: 'Diagram-based, Multi-step',
      visualDependency: 'High',
      expectedTime: '90–120 sec',
      answer: 'C',
      diagnosticWeight: 3,
      conceptTested: 'Similar triangles / geometric mean relation',
      prerequisiteConcept: 'Similarity criteria, right triangle',
    },
    {
      qno: 4,
      subject: 'Physics',
      chapter: 'Electricity',
      topic: 'Resistors',
      difficulty: 'Difficult',
      primarySkill: 'Problem Solving',
      secondarySkill: 'Logical / Analytical Reasoning',
      questionStructure: 'Diagram-based, Multi-step',
      visualDependency: 'High',
      expectedTime: '90–120 sec',
      answer: 'D',
      diagnosticWeight: 3,
      conceptTested: 'Resistor network reduction',
      prerequisiteConcept: "Ohm's law",
    },
    {
      qno: 5,
      subject: 'Chemistry',
      chapter: 'Chemical Reactions and Equations',
      topic: 'Oxidation and Reduction',
      difficulty: 'Easy',
      primarySkill: 'Conceptual Foundation',
      secondarySkill: 'Interpretation',
      questionStructure: 'Direct',
      visualDependency: 'None',
      expectedTime: '30–45 sec',
      answer: 'A',
      diagnosticWeight: 1,
      conceptTested: 'Reducing agent identification',
      prerequisiteConcept: 'Redox reactions',
    },
  ];

  it('correctly classifies skill values and thresholds', () => {
    expect(classifySkillValue(80)).toBe('Good');
    expect(classifySkillValue(66.7)).toBe('Good');
    expect(classifySkillValue(50)).toBe('Average');
    expect(classifySkillValue(33.34)).toBe('Average');
    expect(classifySkillValue(33.33)).toBe('Needs Strengthening');
    expect(classifySkillValue(20)).toBe('Needs Strengthening');
  });

  it('correctly classifies preparation level', () => {
    expect(classifyPreparationLevel(85)).toBe('High achievement Potential');
    expect(classifyPreparationLevel(80)).toBe('High achievement Potential');
    expect(classifyPreparationLevel(75)).toBe('Conceptually Strong');
    expect(classifyPreparationLevel(60)).toBe('Conceptually Strong');
    expect(classifyPreparationLevel(55)).toBe('Basic');
    expect(classifyPreparationLevel(40)).toBe('Basic');
    expect(classifyPreparationLevel(35)).toBe('Basic');
  });

  it('correctly classifies priority levels', () => {
    expect(classifyPriority(30)).toBe('High Priority');
    expect(classifyPriority(39)).toBe('High Priority');
    expect(classifyPriority(40)).toBe('Medium Priority');
    expect(classifyPriority(55)).toBe('Medium Priority');
    expect(classifyPriority(60)).toBe('Low Priority');
  });

  it('parses expected time upper bound correctly', () => {
    expect(parseExpectedTimeUpperBound('45–60 sec')).toBe(60);
    expect(parseExpectedTimeUpperBound('30-45 sec')).toBe(45);
    expect(parseExpectedTimeUpperBound('45,60')).toBe(60);
    expect(parseExpectedTimeUpperBound('90–120 sec')).toBe(120);
    expect(parseExpectedTimeUpperBound('30')).toBe(30);
  });

  it('evaluates student attempt and computes BRI and breakdowns dynamically', () => {
    const studentPayload: StudentResponsePayload = {
      studentName: 'Aarav Sharma',
      responses: [
        { qno: 1, attempted: true, selectedOption: 'B', timeTakenSeconds: 40 }, // Correct, within time (40 <= 60) -> Excluded
        { qno: 2, attempted: true, selectedOption: 'C', timeTakenSeconds: 100 }, // Correct, severe overtime (100 >= 2 * 45 = 90s) -> Pacing flag with severe overtime!
        { qno: 3, attempted: true, selectedOption: 'A', timeTakenSeconds: 100 }, // Wrong (A != C), attempted (>10s) -> Conceptual gap
        { qno: 4, attempted: true, selectedOption: 'D', timeTakenSeconds: 130 }, // Correct, slight overtime (130 < 240) -> Excluded
        { qno: 5, attempted: false, selectedOption: null, timeTakenSeconds: 0 }, // Unattempted (0s <= 10s) -> Excluded
      ],
    };

    const result = evaluateDiagnosticReport(sampleMetadata, studentPayload);

    // Total questions: 5
    expect(result.totalQuestions).toBe(5);
    // Raw score: Q1, Q2, Q4 are correct => 3
    expect(result.totalRawScore).toBe(3);

    // Total weight: Q1(1) + Q2(1) + Q3(3) + Q4(3) + Q5(1) = 9
    expect(result.totalDiagnosticWeight).toBe(9);
    // Weighted score: Q1(1) + Q2(1) + Q4(3) = 5
    expect(result.totalWeightedScore).toBe(5);

    // BRI = (5 / 9) * 100 = 55.6%
    expect(result.briScore).toBeCloseTo(55.6, 1);
    expect(result.levelOfPreparation).toBe('Basic');
    expect(result.keyInsight).toBe(
      'You have started building your foundation for the Boards, and this is a good time to strengthen it further. Some gaps are currently making it difficult to consistently convert your understanding into marks. The good news is that these areas can be improved with focused practice. Read the report further to know where you can improve and how to perform better',
    );

    // Subject performance:
    // Maths: Q1, Q2, Q3 (total 3). Correct: Q1, Q2 => 2/3
    expect(result.breakdown.mathematics.score).toBe(2);
    expect(result.breakdown.mathematics.totalQuestions).toBe(3);

    // Science: Q4 (Physics), Q5 (Chemistry) (total 2). Correct: Q4 => 1/2
    expect(result.breakdown.science.score).toBe(1);
    expect(result.breakdown.science.totalQuestions).toBe(2);

    // Difficult questions: Q3(diff), Q4(diff) => 1/2
    expect(result.breakdown.difficult.score).toBe(1);
    expect(result.breakdown.difficult.totalQuestions).toBe(2);

    // Easy questions: Q1, Q2, Q5 => Q1, Q2 correct => 2/3
    expect(result.breakdown.easy.score).toBe(2);
    expect(result.breakdown.easy.totalQuestions).toBe(3);

    // Question structure performance:
    // Direct: Q1, Q2, Q5 => total 3. Correct: Q1, Q2 => 2/3 (67%)
    const direct = result.structures.find((s) => s.type === 'Direct');
    expect(direct?.correct).toBe(2);
    expect(direct?.total).toBe(3);

    // Diagram-based: Q3, Q4 => total 2. Correct: Q4 => 1/2 (50%)
    const diagram = result.structures.find((s) => s.type === 'Diagram-based');
    expect(diagram?.correct).toBe(1);
    expect(diagram?.total).toBe(2);

    // Strengths and Priority Gaps: MUST be based on scores and question structures / skills (NO chapters)
    const chapterNames = sampleMetadata.map((m) => m.chapter);
    result.strengths.forEach((s) => {
      expect(chapterNames).not.toContain(s.name);
    });
    result.priorityGaps.forEach((g) => {
      expect(chapterNames).not.toContain(g.name);
    });

    // Flagged topics to revisit:
    // Q1: Correct within time -> Excluded
    // Q2: Severe overtime (100s >= 2 * 45s = 90s) -> Pacing / Time Management (mentioned severe overtime)
    // Q3: Attempted (>10s) and incorrect -> Conceptual / Calculation Gap
    // Q4: Correct, slight overtime (130s < 240s) -> Excluded
    // Q5: Unattempted (0s <= 10s) -> Excluded
    expect(result.topicsToRevisit.length).toBe(2);

    const q2Flag = result.topicsToRevisit.find((t) => t.qno === 2);
    expect(q2Flag?.category).toBe('Pacing / Time Management');
    expect(q2Flag?.issueObserved).toContain('Severe Overtime');

    const q3Flag = result.topicsToRevisit.find((t) => t.qno === 3);
    expect(q3Flag?.category).toBe('Conceptual / Calculation Gap');

    // Plain text report generation
    expect(result.plainTextReport).toContain('PAGE 1: SRSMA BOARD READINESS CHALLENGE REPORT');
    expect(result.plainTextReport).toContain('PAGE 2: PERFORMANCE ANALYSIS & PATTERNS');
    expect(result.plainTextReport).toContain('PAGE 3: WHERE SHOULD YOU IMPROVE?');
    expect(result.plainTextReport).toContain('PAGE 4: DIAGNOSTIC AUDIT & CALCULATION STEPS (DEVELOPMENT ONLY)');
    expect(result.plainTextReport).toContain('Dear Aarav Sharma,');

    // Page 4: Calculation steps audit verification
    expect(result.calculationSteps).toBeDefined();
    expect(result.calculationSteps.scoring.rawScoreSum).toBe(3);
    expect(result.calculationSteps.scoring.diagnosticWeightSum).toBe(9);
    expect(result.calculationSteps.scoring.weightedScoreSum).toBe(5);
    expect(result.calculationSteps.scoring.briResult).toBeCloseTo(55.6, 1);
    expect(result.calculationSteps.breakdowns.length).toBe(5);
    expect(result.calculationSteps.skills.length).toBe(5);
    expect(result.calculationSteps.questionAudit.length).toBe(5);
  });

  it('generates correct key insight for Conceptually Strong and High achievement Potential', () => {
    // 1. High achievement Potential (100% score)
    const highScorerPayload: StudentResponsePayload = {
      studentName: 'Priya Patel',
      responses: [
        { qno: 1, attempted: true, selectedOption: 'B', timeTakenSeconds: 30 },
        { qno: 2, attempted: true, selectedOption: 'C', timeTakenSeconds: 30 },
        { qno: 3, attempted: true, selectedOption: 'C', timeTakenSeconds: 40 },
        { qno: 4, attempted: true, selectedOption: 'D', timeTakenSeconds: 50 },
        { qno: 5, attempted: true, selectedOption: 'A', timeTakenSeconds: 20 },
      ],
    };

    const highResult = evaluateDiagnosticReport(sampleMetadata, highScorerPayload);
    expect(highResult.briScore).toBe(100);
    expect(highResult.levelOfPreparation).toBe('High achievement Potential');
    expect(highResult.keyInsight).toBe(
      'You have built a strong understanding of your Board-level concepts. Your next step is to turn this strong conceptual base into consistently high performance by practising questions that require deeper application, multiple steps and careful interpretation. Read the report further to identify the areas that can help you take your preparation to the next level.',
    );

    // 2. Conceptually Strong (e.g. Q1, Q3, Q4 correct: 1 + 3 + 3 = 7/9 = 77.8% BRI)
    const strongScorerPayload: StudentResponsePayload = {
      studentName: 'Rohan Mehta',
      responses: [
        { qno: 1, attempted: true, selectedOption: 'B', timeTakenSeconds: 30 }, // Correct (+1)
        { qno: 2, attempted: true, selectedOption: 'A', timeTakenSeconds: 30 }, // Wrong (0)
        { qno: 3, attempted: true, selectedOption: 'C', timeTakenSeconds: 40 }, // Correct (+3)
        { qno: 4, attempted: true, selectedOption: 'D', timeTakenSeconds: 50 }, // Correct (+3)
        { qno: 5, attempted: true, selectedOption: 'B', timeTakenSeconds: 20 }, // Wrong (0)
      ],
    };

    const strongResult = evaluateDiagnosticReport(sampleMetadata, strongScorerPayload);
    expect(strongResult.briScore).toBeCloseTo(77.8, 1);
    expect(strongResult.levelOfPreparation).toBe('Conceptually Strong');
    expect(strongResult.keyInsight).toBe(
      'You have built a strong understanding of your Board-level concepts. Your next step is to turn this strong conceptual base into consistently high performance by practising questions that require deeper application, multiple steps and careful interpretation. Read the report further to identify the areas that can help you take your preparation to the next level.',
    );
  });
});
