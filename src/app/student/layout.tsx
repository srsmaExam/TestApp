import { requireSession } from '@/lib/auth';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
