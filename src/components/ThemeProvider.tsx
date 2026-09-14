'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBoardChallenge = pathname ? pathname.toLowerCase().startsWith('/boardchallenge') : false;

  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or default to dark
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initialTheme: Theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
    setThemeState(initialTheme);
    setMounted(true);
  }, []);

  // Update DOM and resolved theme whenever theme changes or route changes
  useEffect(() => {
    if (!mounted) return;

    function applyTheme() {
      // /boardChallenge must always be in dark theme
      const isDark = isBoardChallenge ? true : theme === 'dark';

      setResolvedTheme(isDark ? 'dark' : 'light');

      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    applyTheme();
  }, [theme, mounted, isBoardChallenge]);

  // Synchronize across tabs if another tab updates the theme
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        const val = e.newValue as Theme | null;
        if (val === 'light' || val === 'dark') {
          setThemeState(val);
        }
      }
    }

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // ignore storage errors in restricted contexts
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: isBoardChallenge ? 'dark' : theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
