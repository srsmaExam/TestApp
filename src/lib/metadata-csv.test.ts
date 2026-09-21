import { describe, expect, it } from 'vitest';
import {
  generateSampleMetadataCsv,
  parseDifficulty,
  parseExpectedTime,
  parseMetadataCsv,
} from './metadata-csv';

describe('metadata-csv', () => {
  it('parses difficulty accurately', () => {
    expect(parseDifficulty('Easy')).toEqual({ level: 1, label: 'Easy' });
    expect(parseDifficulty('1')).toEqual({ level: 1, label: 'Easy' });
    expect(parseDifficulty('Medium')).toEqual({ level: 2, label: 'Medium' });
    expect(parseDifficulty('Difficult')).toEqual({ level: 3, label: 'Difficult' });
    expect(parseDifficulty('Hard')).toEqual({ level: 3, label: 'Difficult' });
    expect(parseDifficulty('3')).toEqual({ level: 3, label: 'Difficult' });
    expect(parseDifficulty(null)).toEqual({ level: 2, label: 'Medium' });
  });

  it('parses expected time accurately', () => {
    expect(parseExpectedTime('45,60')).toEqual({ commaSeparated: '45,60', seconds: 53 });
    expect(parseExpectedTime('30-45')).toEqual({ commaSeparated: '30,45', seconds: 38 });
    expect(parseExpectedTime('90')).toEqual({ commaSeparated: '90', seconds: 90 });
    expect(parseExpectedTime(null)).toEqual({ commaSeparated: '60', seconds: 60 });
  });

  it('generates sample CSV template when no questions provided', () => {
    const csv = generateSampleMetadataCsv();
    expect(csv).toContain('Qno,Subject,Chapter,Topic,Difficulty');
    expect(csv).toContain('Real Numbers');
    expect(csv).toContain('Concept Application');
  });

  it('generates pre-filled CSV template for existing questions', () => {
    const questions = [
      {
        position: 1,
        subject: 'physics',
        chapter: 'Optics',
        topic: 'Mirrors',
        difficulty: 1,
        expectedTimeS: 45,
        metadata: {
          primarySkill: 'Concept Application',
          cognitiveLevel: 'Application',
          diagnosticWeight: 2,
        },
      },
    ];
    const csv = generateSampleMetadataCsv(questions);
    expect(csv).toContain('1,physics,Optics,Mirrors,Easy,Concept Application');
    expect(csv).toContain('2');
  });

  it('parses valid metadata CSV text', () => {
    const csv = `Qno,Subject,Chapter,Topic,Difficulty,Primary Skill,Secondary Skill,Cognitive Level,Concept Tested,Prerequisite Concept,Question Structure,Visual Dependency,Calculation Intensity,Expected Time,Diagnostic Weight
1,Maths,Real Numbers,HCF & LCM,Easy,Concept Application,Calculation,Application,HCF LCM property,Basic factors,Direct,None,Low,"45,60",1
2,Physics,Light,Reflection,Medium,Analytical Reasoning,Formula Recall,Analysis,Mirror formula,Sign convention,Multi-step,Low,Medium,"60,90",2`;

    const res = parseMetadataCsv(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.validRows).toHaveLength(2);
    expect(res.validRows[0].qno).toBe(1);
    expect(res.validRows[0].chapter).toBe('Real Numbers');
    expect(res.validRows[0].difficulty).toBe(1);
    expect(res.validRows[0].diagnosticWeight).toBe(1);

    expect(res.validRows[1].qno).toBe(2);
    expect(res.validRows[1].chapter).toBe('Light');
    expect(res.validRows[1].difficulty).toBe(2);
    expect(res.validRows[1].diagnosticWeight).toBe(2);
  });

  it('catches invalid or missing header errors', () => {
    const csv = `WrongHeader1,WrongHeader2\nfoo,bar`;
    const res = parseMetadataCsv(csv);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors[0].field).toBe('header');
  });

  it('catches invalid Qno format', () => {
    const csv = `Qno,Subject,Chapter\ninvalid_q,Maths,Real Numbers`;
    const res = parseMetadataCsv(csv);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors[0].field).toBe('Qno');
  });
});
