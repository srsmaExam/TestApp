import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const FeedbackSchema = z.object({
  attemptId: z.string().uuid().optional().nullable(),
  testId: z.string().uuid().optional().nullable(),
  testRating: z.number().int().min(1).max(5).optional().nullable(),
  reportRating: z.number().int().min(1).max(5).optional().nullable(),
  feedbackText: z.string().max(2000).optional().nullable(),
  sourceTab: z.enum(['report', 'solutions']).optional().nullable(),
});

describe('Student Feedback Schema & Validation', () => {
  it('validates a complete feedback payload with ratings and comments', () => {
    const payload = {
      attemptId: '11111111-1111-4111-a111-111111111111',
      testId: '22222222-2222-4222-a222-222222222222',
      testRating: 5,
      reportRating: 4,
      feedbackText: 'The 5-page report gave incredible clarity on my calculation gaps in Trigonometry.',
      sourceTab: 'report' as const,
    };

    const result = FeedbackSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('validates rating-only feedback', () => {
    const payload = {
      testRating: 4,
      reportRating: 5,
      sourceTab: 'solutions' as const,
    };

    const result = FeedbackSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects ratings outside 1 to 5', () => {
    const payload = {
      testRating: 6,
      reportRating: 0,
    };

    const result = FeedbackSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects feedback comments longer than 2000 characters', () => {
    const payload = {
      feedbackText: 'a'.repeat(2001),
    };

    const result = FeedbackSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
