import { Suspense } from 'react';
import { requireSession } from '@/lib/auth';
import { Spinner } from '@/components/ui';
import { StudentChrome } from '../StudentChrome';
import { ResultReviewClient } from '../attempts/[id]/result/ResultReviewClient';

export async function StudentAttemptResultView({ attemptId }: { attemptId: string }) {
  const session = await requireSession();
  return (
    <StudentChrome session={session}>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <Spinner className="size-8 text-brand-600" />
          </div>
        }
      >
        <ResultReviewClient attemptId={attemptId} userRole={session.role} />
      </Suspense>
    </StudentChrome>
  );
}
