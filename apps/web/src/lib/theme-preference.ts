const THEME_KEY = 'hudu-theme';

export type HuduTheme = 'light' | 'soft-dark';

export function getStoredTheme(): HuduTheme {
  if (typeof window === 'undefined') return 'light';
  const value = localStorage.getItem(THEME_KEY);
  return value === 'soft-dark' ? 'soft-dark' : 'light';
}

export function applyTheme(theme: HuduTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('soft-dark', theme === 'soft-dark');
  localStorage.setItem(THEME_KEY, theme);
}

export function initTheme() {
  applyTheme(getStoredTheme());
}
