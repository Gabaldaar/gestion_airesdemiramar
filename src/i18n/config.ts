/**
 * Configuración centralizada de idiomas soportados por la aplicación.
 */

export type Language = 'es' | 'en' | 'pt' | 'fr';

export interface LanguageInfo {
  code: Language;
  name: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' }
];

export const DEFAULT_LANGUAGE: Language = 'es';
