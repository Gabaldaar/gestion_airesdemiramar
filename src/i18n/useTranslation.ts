
'use client';

import { useContext, useCallback, useMemo } from 'react';
import { LanguageContext } from './LanguageContext';
import { Language } from './config';
import es from './locales/es.json';
import en from './locales/en.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';
import helpEs from './locales/help-es.json';
import helpEn from './locales/help-en.json';
import helpPt from './locales/help-pt.json';
import helpFr from './locales/help-fr.json';

// Combinamos los archivos de etiquetas de UI con los de contenido de Ayuda
const locales: Record<Language, any> = { 
  es: { ...es, ...helpEs }, 
  en: { ...en, ...helpEn }, 
  pt: { ...pt, ...helpPt }, 
  fr: { ...fr, ...helpFr } 
};

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  const { language, setLanguage } = context;

  const t = useCallback((path: string) => {
    const keys = path.split('.');
    let value = locales[language];

    for (const key of keys) {
      if (!value || value[key] === undefined) {
        return path; 
      }
      value = value[key];
    }

    return value;
  }, [language]);

  return useMemo(() => ({ t, language, setLanguage }), [t, language, setLanguage]);
}
