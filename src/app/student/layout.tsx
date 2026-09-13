import { requireStudent } from '@/lib/auth';

/**
 * FBR-08: this layout used to also wrap every /student/* page in AppShell —
 * including the exam runner, which put "My tests"/"Analytics" nav and a
 * Logout button one tap away from a live, timed exam. It now only guards the
 * route (redirecting anyone who isn't a signed-in student); each page decides
 * for itself whether it needs app chrome via <StudentChrome>. See
 * src/app/student/StudentChrome.tsx.
 */
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireStudent();
  return <>{children}</>;
}
