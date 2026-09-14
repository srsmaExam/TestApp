import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { profiles } from '@/db/schema';
import { AppShell, type NavItem } from '@/components/AppShell';
import type { Session } from '@/lib/session';

/**
 * FBR-08: the exam runner used to be nested inside AppShell (via
 * student/layout.tsx), which meant the "My tests"/"Analytics" nav, the
 * Logout button, and the app header/footer chrome were all still on screen —
 * and reachable in one tap — during a live, timed exam, right next to a
 * (dead, see FBR-04) "enforced for academic integrity" fullscreen barrier.
 * The runner now renders bare; every other student page wraps itself in this
 * shared chrome instead of relying on the layout to do it for everyone.
 */
export async function StudentChrome({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  let isReportUnlocked = false;
  try {
    const db = await getDb();
    const [profile] = await db
      .select({
        whatsappConsent: profiles.whatsappConsent,
        city: profiles.city,
        isProvisional: profiles.isProvisional,
      })
      .from(profiles)
      .where(eq(profiles.id, session.userId));

    isReportUnlocked = Boolean(
      profile && (!profile.isProvisional || (profile.whatsappConsent && profile.city)),
    );
  } catch {
    // If db fails, default to locked
    isReportUnlocked = false;
  }

  const nav: NavItem[] = [
    { href: '/student', label: 'My tests', exact: true },
    {
      href: '/student/analytics',
      label: 'Report',
      isLocked: !isReportUnlocked,
      lockKey: 'report',
    },
  ];

  return (
    <AppShell session={session} nav={nav}>
      {children}
    </AppShell>
  );
}
