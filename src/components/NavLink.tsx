'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/cn';

export function NavLink({
  href,
  exact = false,
  isLocked = false,
  lockKey,
  children,
}: {
  href: string;
  exact?: boolean;
  isLocked?: boolean;
  lockKey?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const [locked, setLocked] = useState(isLocked);

  useEffect(() => {
    setLocked(isLocked);
  }, [isLocked]);

  useEffect(() => {
    if (!lockKey) return;
    if (typeof window !== 'undefined') {
      const isSavedUnlocked = localStorage.getItem(`srsma_${lockKey}_unlocked`) === 'true';
      if (isSavedUnlocked) {
        setLocked(false);
      }
    }

    const handleUnlocked = () => {
      setLocked(false);
    };

    window.addEventListener(`srsma_${lockKey}_unlocked`, handleUnlocked);
    return () => {
      window.removeEventListener(`srsma_${lockKey}_unlocked`, handleUnlocked);
    };
  }, [lockKey]);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
      )}
    >
      <span>{children}</span>
      {locked && (
        <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
          <Lock className="size-2.5" />
          Locked
        </span>
      )}
    </Link>
  );
}
