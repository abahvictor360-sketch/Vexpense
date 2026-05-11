import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

// --- Tiny vanilla store (no Zustand needed for a simple value) ---
let _theme: Theme = (() => {
  try {
    const s = localStorage.getItem('vexpense-theme');
    if (s === 'light' || s === 'dark' || s === 'system') return s as Theme;
  } catch { /* noop */ }
  return 'system';
})();

type Listener = () => void;
const _listeners = new Set<Listener>();

export const themeStore = {
  get: (): Theme => _theme,
  set: (theme: Theme) => {
    _theme = theme;
    try { localStorage.setItem('vexpense-theme', theme); } catch { /* noop */ }
    applyTheme(theme);
    _listeners.forEach(fn => fn());
  },
  subscribe: (fn: Listener): (() => void) => {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};

export function applyTheme(theme: Theme) {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

/** React hook — returns current theme and a setter */
export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setLocal] = useState<Theme>(themeStore.get);
  useEffect(() => themeStore.subscribe(() => setLocal(themeStore.get())), []);
  return [theme, themeStore.set];
}

// ── Apply saved theme immediately on module load ──────────────────────
applyTheme(_theme);

// ── Re-apply when OS preference changes (for 'system' mode) ──────────
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (themeStore.get() === 'system') applyTheme('system');
    });
}
