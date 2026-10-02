import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { DELETE } from './feedback';

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/db/client', () => ({
  getDb: vi.fn(),
}));

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

describe('Student Feedback DELETE Endpoint', () => {
  it('rejects non-teacher sessions', async () => {
    const { getSession } = await import('@/lib/auth');
    vi.mocked(getSession).mockResolvedValueOnce({
      userId: 'student-123',
      role: 'student',
    } as any);

    const req = new Request('http://localhost:3000/api/student/feedback?id=fb-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req, {} as any);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toContain('Only teachers can delete');
  });

  it('deletes feedback when caller is a teacher', async () => {
    const { getSession } = await import('@/lib/auth');
    const { getDb } = await import('@/db/client');

    vi.mocked(getSession).mockResolvedValueOnce({
      userId: 'teacher-123',
      role: 'teacher',
    } as any);

    const deleteMock = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(true),
    });

    vi.mocked(getDb).mockResolvedValueOnce({
      delete: deleteMock,
    } as any);

    const req = new Request('http://localhost:3000/api/student/feedback?id=fb-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req, {} as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.deleted).toBe(true);
    expect(deleteMock).toHaveBeenCalled();
  });
});
