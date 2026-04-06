import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface AppSettings {
  fontSize: 'normal' | 'large' | 'xlarge';
  theme: 'light' | 'dark' | 'system';
  speechRate: number;
  highContrast: boolean;
  autoSpeak: boolean;
}

const SETTINGS_KEY = 'noongil_settings';

const DEFAULT_SETTINGS: AppSettings = {
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
  updateSettings: () => { },
  resetSettings: () => { },
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
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

    // Apply font size class
    root.classList.remove('text-normal', 'text-large', 'text-xlarge');
    root.classList.add(`text-${s.fontSize}`);
  };

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...partial };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));

      // Handle theme change if needed
      if (partial.theme !== undefined || partial.highContrast !== undefined || partial.fontSize !== undefined) {
        applyTheme(updated);
      }

      return updated;
    });
  }, []);

  // Initial theme application
  useEffect(() => {
    applyTheme(settings);
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(SETTINGS_KEY);
    applyTheme(DEFAULT_SETTINGS);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
