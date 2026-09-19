import { Suspense } from 'react';
import { requireTeacher } from '@/lib/auth';
import { Spinner } from '@/components/ui';
import { ResultReviewClient } from '@/app/student/attempts/[id]/result/ResultReviewClient';

export async function TeacherStudentAttemptView({
  attemptId,
  studentId,
}: {
  attemptId: string;
  studentId?: string;
}) {
  await requireTeacher();
  return (
    <div className="py-2">
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <Spinner className="size-8 text-brand-600" />
          </div>
        }
      >
        <ResultReviewClient
          attemptId={attemptId}
          userRole="teacher"
          backUrl={studentId ? `/teacher/students/${studentId}?tab=responses` : '/teacher/students'}
        />
      </Suspense>
    </div>
  );
}
