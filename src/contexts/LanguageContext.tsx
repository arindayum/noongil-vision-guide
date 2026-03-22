import React, { createContext, useContext, useState, useCallback } from 'react';

export type AppLanguage = 'en' | 'hi' | 'mr';

export interface LanguageConfig {
  code: AppLanguage;
  label: string;
  voiceLang: string; // BCP-47 for SpeechRecognition + TTS
  geminiInstruction: string; // Injected into Gemini prompt
}

export const LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    label: 'English',
    voiceLang: 'en-US',
    geminiInstruction: 'Respond in English.',
  },
  {
    code: 'hi',
    label: 'हिंदी',
    voiceLang: 'hi-IN',
    geminiInstruction: 'अपना जवाब हिंदी में दें।',
  },
  {
    code: 'mr',
    label: 'मराठी',
    voiceLang: 'mr-IN',
    geminiInstruction: 'तुमचे उत्तर मराठीत द्या.',
  },
];

const LANG_KEY = 'noongil_language';

interface LanguageContextValue {
  language: LanguageConfig;
  setLanguage: (code: AppLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: LANGUAGES[0],
  setLanguage: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageConfig>(() => {
    const saved = localStorage.getItem(LANG_KEY) as AppLanguage | null;
    return LANGUAGES.find(l => l.code === saved) ?? LANGUAGES[0];
  });

  const setLanguage = useCallback((code: AppLanguage) => {
    const config = LANGUAGES.find(l => l.code === code) ?? LANGUAGES[0];
    setLanguageState(config);
    localStorage.setItem(LANG_KEY, code);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
