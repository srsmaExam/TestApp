import { requireTeacher } from '@/lib/auth';
import { TestAnalyticsClient } from '../tests/[id]/analytics/TestAnalyticsClient';

export async function TeacherTestAnalyticsView({ testId }: { testId: string }) {
  await requireTeacher();
  return <TestAnalyticsClient testId={testId} />;
}
