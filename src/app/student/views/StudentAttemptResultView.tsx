import { requireSession } from '@/lib/auth';
import { StudentChrome } from '../StudentChrome';
import { ResultReviewClient } from '../attempts/[id]/result/ResultReviewClient';

export async function StudentAttemptResultView({ attemptId }: { attemptId: string }) {
  const session = await requireSession();
  return (
    <StudentChrome session={session}>
      <ResultReviewClient attemptId={attemptId} userRole={session.role} />
    </StudentChrome>
  );
}
