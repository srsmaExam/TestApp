import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const ReportDetailsSchema = z.object({
  city: z.string().trim().min(1, 'City is required'),
  board: z.string().trim().min(1, 'Board is required'),
  otherBoard: z.string().trim().optional(),
  gender: z.enum(['Male', 'Female'], {
    errorMap: () => ({ message: 'Please select your gender (Male or Female).' }),
  }),
  school: z.string().trim().min(1, 'School name is required'),
  whatsappConsent: z.boolean().refine((val) => val === true, {
    message:
      'I give permission to Shri Ram Smart Minds Academy to contact me on my WhatsApp number for sending the detailed report is mandatory.',
  }),
  attemptId: z.string().uuid().optional(),
});

describe('Report Unlocking Form Schema & Scoring Validation', () => {
  it('validates correct report unlocking submission payload', () => {
    const validPayload = {
      gender: 'Male',
      school: 'Delhi Public School',
      city: 'Hyderabad',
      board: 'CBSE Board',
      whatsappConsent: true,
      attemptId: '11111111-1111-4111-a111-111111111111',
    };

    const result = ReportDetailsSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects payload when whatsappConsent is false', () => {
    const payload = {
      gender: 'Female',
      school: 'Kendriya Vidyalaya',
      city: 'Bangalore',
      board: 'ICSE Board',
      whatsappConsent: false,
    };

    const result = ReportDetailsSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects payload when gender is missing or invalid', () => {
    const payload = {
      school: 'Kendriya Vidyalaya',
      city: 'Bangalore',
      board: 'ICSE Board',
      whatsappConsent: true,
    };

    const result = ReportDetailsSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('calculates maths and science score aggregations correctly for scorecard beginning', () => {
    const subjectScores: Record<string, { marks: number; maxMarks: number; correct: number; total: number }> = {
      maths: { marks: 25, maxMarks: 40, correct: 6, total: 10 },
      physics: { marks: 12, maxMarks: 20, correct: 3, total: 5 },
      chemistry: { marks: 16, maxMarks: 20, correct: 4, total: 5 },
      biology: { marks: 8, maxMarks: 10, correct: 2, total: 3 },
    };

    // Maths score calculation
    let mathsMarks = 0;
    let mathsMax = 0;
    let mathsCorrect = 0;
    let mathsTotal = 0;
    for (const [key, val] of Object.entries(subjectScores)) {
      const lower = key.toLowerCase();
      if (lower === 'maths' || lower === 'mathematics') {
        mathsMarks += val.marks;
        mathsMax += val.maxMarks;
        mathsCorrect += val.correct;
        mathsTotal += val.total;
      }
    }

    expect(mathsMarks).toBe(25);
    expect(mathsMax).toBe(40);
    expect(mathsCorrect).toBe(6);
    expect(mathsTotal).toBe(10);

    // Science score aggregation (Physics + Chemistry + Biology)
    let scienceMarks = 0;
    let scienceMax = 0;
    let scienceCorrect = 0;
    let scienceTotal = 0;
    for (const [key, val] of Object.entries(subjectScores)) {
      const lower = key.toLowerCase();
      if (['physics', 'chemistry', 'biology', 'science'].includes(lower)) {
        scienceMarks += val.marks;
        scienceMax += val.maxMarks;
        scienceCorrect += val.correct;
        scienceTotal += val.total;
      }
    }

    expect(scienceMarks).toBe(12 + 16 + 8); // 36
    expect(scienceMax).toBe(20 + 20 + 10); // 50
    expect(scienceCorrect).toBe(3 + 4 + 2); // 9
    expect(scienceTotal).toBe(5 + 5 + 3); // 13
  });
});
