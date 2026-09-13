import { requireTeacher } from '@/lib/auth';
import { TeacherCohortAnalyticsClient } from '../analytics/TeacherCohortAnalyticsClient';

export async function TeacherCohortAnalyticsView() {
  await requireTeacher();
  return <TeacherCohortAnalyticsClient />;
}
