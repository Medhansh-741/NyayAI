'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';
type ThemePreference = Theme | 'system';

interface ThemeContextType {
  theme: Theme; // resolved/applied theme
  preference: ThemePreference; // user preference
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const STORAGE_KEY = 'theme-preference';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(preference: ThemePreference): Theme {
  return preference === 'system' ? getSystemTheme() : preference;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

function safeGetStoredPreference(): ThemePreference | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
    return null;
  } catch {
    return null;
  }
}

function safeSetStoredPreference(value: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // First client sync
  useEffect(() => {
    const stored = safeGetStoredPreference() ?? 'system';
    const resolved = resolveTheme(stored);

    setPreferenceState(stored);
    setTheme(resolved);
    applyTheme(resolved);
    setMounted(true);
  }, []);

  // Apply whenever preference changes
  useEffect(() => {
    if (!mounted) return;
    const resolved = resolveTheme(preference);
    setTheme(resolved);
    applyTheme(resolved);
    safeSetStoredPreference(preference);
  }, [preference, mounted]);

  // Follow system changes only in "system" mode
  useEffect(() => {
    if (!mounted || preference !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next = media.matches ? 'dark' : 'light';
      setTheme(next);
      applyTheme(next);
    };

    if (media.addEventListener) {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    } else {
      media.addListener(onChange);
      return () => media.removeListener(onChange);
    }
  }, [preference, mounted]);

  // Cross-tab sync
  useEffect(() => {
    if (!mounted) return;

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const v = e.newValue;
      if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v);
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [mounted]);

  const setPreference = (next: ThemePreference) => setPreferenceState(next);

  const toggleTheme = () => {
    setPreferenceState((prev) => (resolveTheme(prev) === 'dark' ? 'light' : 'dark'));
  };

  const value = useMemo(
    () => ({ theme, preference, setPreference, toggleTheme, mounted }),
    [theme, preference, mounted]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}