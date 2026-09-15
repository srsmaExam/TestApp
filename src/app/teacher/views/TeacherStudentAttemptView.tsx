import { requireTeacher } from '@/lib/auth';
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
      <ResultReviewClient
        attemptId={attemptId}
        userRole="teacher"
        backUrl={studentId ? `/teacher/students/${studentId}?tab=responses` : '/teacher/students'}
      />
    </div>
  );
}
