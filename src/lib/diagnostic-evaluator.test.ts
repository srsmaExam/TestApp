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
    expect(classifyPreparationLevel(85)).toBe('ADVANCED');
    expect(classifyPreparationLevel(80)).toBe('ADVANCED');
    expect(classifyPreparationLevel(75)).toBe('PROFICIENT');
    expect(classifyPreparationLevel(60)).toBe('PROFICIENT');
    expect(classifyPreparationLevel(55)).toBe('BASIC');
    expect(classifyPreparationLevel(40)).toBe('BASIC');
    expect(classifyPreparationLevel(35)).toBe('NEEDS IMMEDIATE INTERVENTION');
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
        { qno: 1, attempted: true, selectedOption: 'B', timeTakenSeconds: 40 }, // Correct, within time (40 <= 60)
        { qno: 2, attempted: true, selectedOption: 'C', timeTakenSeconds: 50 }, // Correct, overtime (50 > 45) -> Pacing flag
        { qno: 3, attempted: true, selectedOption: 'A', timeTakenSeconds: 100 }, // Wrong (A != C), within time -> Conceptual gap
        { qno: 4, attempted: true, selectedOption: 'D', timeTakenSeconds: 130 }, // Correct, overtime (130 > 120) -> Pacing flag
        { qno: 5, attempted: false, selectedOption: null, timeTakenSeconds: 0 }, // Unattempted -> Gap
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
    expect(result.levelOfPreparation).toBe('BASIC');

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

    // Flagged topics to revisit:
    // Q2: Pacing / Time Management (Correct, 50s > 45s)
    // Q3: Conceptual / Calculation Gap (Incorrect, 100s <= 120s)
    // Q4: Pacing / Time Management (Correct, 130s > 120s)
    // Q5: Conceptual / Calculation Gap (Unattempted)
    expect(result.topicsToRevisit.length).toBe(4);

    const q2Flag = result.topicsToRevisit.find((t) => t.qno === 2);
    expect(q2Flag?.category).toBe('Pacing / Time Management');

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
});
