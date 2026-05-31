'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Language, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './config';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as Language;
    const supportedCodes = SUPPORTED_LANGUAGES.map(l => l.code);
    
    if (savedLang && supportedCodes.includes(savedLang)) {
      setLanguageState(savedLang);
    } else {
      const browserLang = navigator.language.split('-')[0] as Language;
      if (supportedCodes.includes(browserLang)) {
        setLanguageState(browserLang);
      }
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
