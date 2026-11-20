import { useCallback, useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
const isDark = () => document.documentElement.classList.contains('dark');

export function setTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  try {
    localStorage.setItem('medmap-theme', dark ? 'dark' : 'light');
  } catch {
    /* storage may be unavailable */
  }
  listeners.forEach((l) => l());
}

export function useTheme() {
  const dark = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    isDark,
  );
  const toggle = useCallback(() => setTheme(!isDark()), []);
  return { dark, toggle };
}
