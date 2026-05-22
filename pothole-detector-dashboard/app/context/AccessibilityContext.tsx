'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type Contrast = 'normal' | 'high';
export type TextSize = 'sm' | 'md' | 'lg' | 'xl';

interface A11ySettings {
  theme: Theme;
  contrast: Contrast;
  textSize: TextSize;
  setTheme: (t: Theme) => void;
  setContrast: (c: Contrast) => void;
  setTextSize: (s: TextSize) => void;
}

const AccessibilityContext = createContext<A11ySettings>({
  theme: 'dark',
  contrast: 'normal',
  textSize: 'md',
  setTheme: () => {},
  setContrast: () => {},
  setTextSize: () => {},
});

export function useAccessibility() {
  return useContext(AccessibilityContext);
}

export const STORAGE_KEY = 'potholeiq-a11y';

export type Saved = { theme: Theme; contrast: Contrast; textSize: TextSize };
export const DEFAULTS: Saved = { theme: 'dark', contrast: 'normal', textSize: 'md' };

function readStorage(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function resolveTheme(theme: Theme): 'dark' | 'light' {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyToHtml({ theme, contrast, textSize }: Saved) {
  const html = document.documentElement;
  html.setAttribute('data-theme', resolveTheme(theme));
  html.setAttribute('data-contrast', contrast);
  html.setAttribute('data-text-size', textSize);
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Saved>(DEFAULTS);
  const settingsRef = useRef<Saved>(DEFAULTS);

  useEffect(() => {
    const saved = readStorage();
    setSettings(saved);
    settingsRef.current = saved;
    applyToHtml(saved);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => {
      if (settingsRef.current.theme === 'system') {
        applyToHtml(settingsRef.current);
      }
    };
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  function update(patch: Partial<Saved>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    settingsRef.current = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    applyToHtml(next);
  }

  return (
    <AccessibilityContext.Provider value={{
      ...settings,
      setTheme: (t) => update({ theme: t }),
      setContrast: (c) => update({ contrast: c }),
      setTextSize: (s) => update({ textSize: s }),
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}
