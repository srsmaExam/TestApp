import fs from 'node:fs';
import path from 'node:path';
import {
  evaluateDiagnosticReport,
  type QuestionMetadataItem,
  type StudentQuestionResponse,
} from '../src/lib/diagnostic-evaluator';

const paperRaw = fs.readFileSync(path.join(process.cwd(), 'LocalPaper', 'paper.json'), 'utf-8');
const paperData = JSON.parse(paperRaw);

const metadataList: QuestionMetadataItem[] = paperData.questions.map((q: any, idx: number) => {
  const m = q.metadata || {};
  return {
    qno: q.sourceQno || idx + 1,
    subject: q.subject === 'maths' ? 'Maths' : q.subject.charAt(0).toUpperCase() + q.subject.slice(1),
    chapter: q.chapter || 'General',
    topic: q.topic || 'General',
    conceptTested: m.conceptTested || null,
    prerequisiteConcept: m.prerequisiteConcept || null,
    difficulty: m.difficultyLabel || 'Medium',
    primarySkill: m.primarySkill || 'Concept Application',
    secondarySkill: m.secondarySkill || null,
    questionStructure: m.questionStructure || 'Direct',
    visualDependency: m.visualDependency || 'None',
    expectedTime: m.expectedTime || `${q.expectedTimeS || 60}`,
    answer: q.answer?.key || 'A',
    diagnosticWeight: Number(m.diagnosticWeight || 1),
  };
});

// Create a realistic student response payload
// 20 questions: 14 attempted, 11 correct, 3 wrong, 6 unattempted, some overtime
const responses: StudentQuestionResponse[] = metadataList.map((m, idx) => {
  // Q1-Q10: High attempt rate
  if (idx < 5) {
    return {
      qno: m.qno,
      attempted: true,
      selectedOption: m.answer, // Correct
      timeTakenSeconds: 40,
    };
  }
  if (idx === 5) {
    // Pacing gap (correct but took 90s vs expected 60s)
    return {
      qno: m.qno,
      attempted: true,
      selectedOption: m.answer,
      timeTakenSeconds: 95,
    };
  }
  if (idx === 6) {
    // Conceptual gap (incorrect within time)
    return {
      qno: m.qno,
      attempted: true,
      selectedOption: m.answer === 'A' ? 'B' : 'A',
      timeTakenSeconds: 45,
    };
  }
  if (idx === 7) {
    // High friction gap (incorrect AND overtime)
    return {
      qno: m.qno,
      attempted: true,
      selectedOption: m.answer === 'C' ? 'D' : 'C',
      timeTakenSeconds: 130,
    };
  }
  if (idx < 12) {
    return {
      qno: m.qno,
      attempted: true,
      selectedOption: m.answer,
      timeTakenSeconds: 50,
    };
  }
  if (idx === 12) {
    // skipped / unattempted
    return {
      qno: m.qno,
      attempted: false,
      selectedOption: null,
      timeTakenSeconds: 10,
    };
  }
  if (idx < 16) {
    return {
      qno: m.qno,
      attempted: true,
      selectedOption: m.answer,
      timeTakenSeconds: 55,
    };
  }
  // remaining skipped
  return {
    qno: m.qno,
    attempted: false,
    selectedOption: null,
    timeTakenSeconds: 5,
  };
});

const report = evaluateDiagnosticReport(metadataList, {
  studentName: 'Aarav Sharma',
  responses,
});

console.log('=== EVALUATION SUMMARY ===');
console.log(`Student: ${report.studentName}`);
console.log(`Raw Score: ${report.totalRawScore}/${report.totalQuestions}`);
console.log(`Weighted Score: ${report.totalWeightedScore}/${report.totalDiagnosticWeight}`);
console.log(`BRI: ${report.briScore}% (${report.levelOfPreparation})`);
console.log(`Topics to Revisit Count: ${report.topicsToRevisit.length}`);
console.log('\n' + report.plainTextReport);
