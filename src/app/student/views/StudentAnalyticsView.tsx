import { requireStudent } from '@/lib/auth';
import { StudentAnalyticsClient } from '../analytics/StudentAnalyticsClient';

export async function StudentAnalyticsView() {
  const session = await requireStudent();
  return <StudentAnalyticsClient studentName={session.fullName} />;
}
