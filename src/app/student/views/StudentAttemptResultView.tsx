import { requireSession } from '@/lib/auth';
import { ResultReviewClient } from '../attempts/[id]/result/ResultReviewClient';

export async function StudentAttemptResultView({ attemptId }: { attemptId: string }) {
  const session = await requireSession();
  return <ResultReviewClient attemptId={attemptId} userRole={session.role} />;
}
