import { AppShell, type NavItem } from '@/components/AppShell';
import type { Session } from '@/lib/session';

const NAV: NavItem[] = [
  { href: '/student', label: 'My tests', exact: true },
  { href: '/student/analytics', label: 'Report' },
];

/**
 * FBR-08: the exam runner used to be nested inside AppShell (via
 * student/layout.tsx), which meant the "My tests"/"Analytics" nav, the
 * Logout button, and the app header/footer chrome were all still on screen —
 * and reachable in one tap — during a live, timed exam, right next to a
 * (dead, see FBR-04) "enforced for academic integrity" fullscreen barrier.
 * The runner now renders bare; every other student page wraps itself in this
 * shared chrome instead of relying on the layout to do it for everyone.
 */
export function StudentChrome({ session, children }: { session: Session; children: React.ReactNode }) {
  return (
    <AppShell session={session} nav={NAV}>
      {children}
    </AppShell>
  );
}
