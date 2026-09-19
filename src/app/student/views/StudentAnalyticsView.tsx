import { Suspense } from 'react';
import { requireStudent } from '@/lib/auth';
import { Spinner } from '@/components/ui';
import { StudentChrome } from '../StudentChrome';
import { StudentAnalyticsClient } from '../analytics/StudentAnalyticsClient';

export async function StudentAnalyticsView() {
  const session = await requireStudent();
  return (
    <StudentChrome session={session}>
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <Spinner className="size-8 text-brand-700" />
          </div>
        }
      >
        <StudentAnalyticsClient studentName={session.fullName} />
      </Suspense>
    </StudentChrome>
  );
}
