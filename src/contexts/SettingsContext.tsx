import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
// BUG FIX: Import setSpeechRate so the speech module stays in sync whenever
// settings change. Previously the speech module always used rate=1.0.
import { setSpeechRate } from '@/utils/speech';

export interface AppSettings {
  fontSize: 'normal' | 'large' | 'xlarge';
  theme: 'light' | 'dark' | 'system';
  speechRate: number;
  highContrast: boolean;
  autoSpeak: boolean;
}

const SETTINGS_KEY = 'noongil_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 'normal',
  theme: 'system',
  speechRate: 1.0,
  highContrast: false,
  autoSpeak: true,
};

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  resetSettings: () => {},
});

const applyTheme = (s: AppSettings) => {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');

  let actualTheme = s.theme;
  if (s.theme === 'system') {
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.classList.add(actualTheme);

  if (s.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }

  root.classList.remove('text-normal', 'text-large', 'text-xlarge');
  root.classList.add(`text-${s.fontSize}`);
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // BUG FIX: applyTheme was defined inside the component, causing it to be recreated
  // on every render and also making it inaccessible from the module-level. Moved out.
  // BUG FIX: setSpeechRate was never called. Do it on mount and whenever speechRate changes.
  useEffect(() => {
    applyTheme(settings);
    setSpeechRate(settings.speechRate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...partial };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));

      if (
        partial.theme !== undefined ||
        partial.highContrast !== undefined ||
        partial.fontSize !== undefined
      ) {
        applyTheme(updated);
      }

      // BUG FIX: speechRate change must propagate to the speech module immediately.
      if (partial.speechRate !== undefined) {
        setSpeechRate(updated.speechRate);
      }

      return updated;
    });
  }, []);

  // BUG FIX: system theme changes (e.g. user toggles OS dark mode) were never picked up.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      setSettings(prev => {
        if (prev.theme === 'system') applyTheme(prev);
        return prev;
      });
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(SETTINGS_KEY);
    applyTheme(DEFAULT_SETTINGS);
    setSpeechRate(DEFAULT_SETTINGS.speechRate);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
