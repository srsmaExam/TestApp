import { requireStudent } from '@/lib/auth';
import { StudentChrome } from '../StudentChrome';
import { StudentAnalyticsClient } from '../analytics/StudentAnalyticsClient';

export async function StudentAnalyticsView() {
  const session = await requireStudent();
  return (
    <StudentChrome session={session}>
      <StudentAnalyticsClient studentName={session.fullName} />
    </StudentChrome>
  );
}
