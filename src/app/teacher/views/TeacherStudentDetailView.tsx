import { Suspense } from 'react';
import { requireTeacher } from '@/lib/auth';
import { TeacherStudentDetailClient } from './TeacherStudentDetailClient';

export async function TeacherStudentDetailView({
  studentId,
  initialTab,
}: {
  studentId: string;
  initialTab?: 'analytics' | 'responses';
}) {
  await requireTeacher();
  return (
    <Suspense>
      <TeacherStudentDetailClient studentId={studentId} initialTab={initialTab} />
    </Suspense>
  );
}
