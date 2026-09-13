import { Suspense } from 'react';
import { requireTeacher } from '@/lib/auth';
import { StudentsView } from '../students/StudentsView';

export async function TeacherStudentsView() {
  await requireTeacher();
  return (
    <div>
      <Suspense>
        <StudentsView />
      </Suspense>
    </div>
  );
}
