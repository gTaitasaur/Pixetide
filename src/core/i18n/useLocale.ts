/**
 * useLocale.ts — Hook para internacionalización (i18n)
 *
 * ¿Por qué un hook propio y no i18next o react-intl?
 * Porque solo tenemos 2 idiomas y ~50 strings. Usar una librería i18n completa
 * (i18next = ~40KB) para esto es overkill. Este hook pesa 0KB extra porque es
 * código nativo de la app.
 *
 * Estrategia:
 * - El idioma se persiste en localStorage para mantener la preferencia del usuario.
 * - En primera visita, se detecta desde la URL (/es/* → español, resto → inglés).
 * - Al cambiar de idioma se actualiza localStorage y la URL (sin crear historial).
 * - Los componentes SEO (SeoHead, SchemaMarkup) siguen usando la URL para
 *   canonical/hreflang, asegurando indexación correcta por Google.
 */

import { useCallback, useMemo } from 'react';
import { type SupportedLocale } from '../seo/seoConfig';
import { translations, type TranslationKey } from './translations';
import { useLocaleContext } from './LocaleProvider';

export interface UseLocaleReturn {
  /** Locale actual: 'en' | 'es' */
  locale: SupportedLocale;
  /** Función para obtener un texto traducido por su key */
  t: (key: TranslationKey) => string;
  /** Prefijo de ruta para el locale actual. '' para EN, '/es' para ES */
  pathPrefix: string;
  /** Genera la ruta equivalente en el otro idioma */
  getAlternateUrl: (currentPath: string) => string;
  /** Cambia el idioma y persiste la preferencia en localStorage */
  setLocale: (locale: SupportedLocale) => void;
}

export function useLocale(): UseLocaleReturn {
  const { locale, setLocale } = useLocaleContext();

  const t = useCallback((key: TranslationKey): string => {
    const localeTranslations = translations[locale];
    if (localeTranslations[key]) return localeTranslations[key];
    return translations['en'][key];
  }, [locale]);

  const pathPrefix = useMemo(() => locale === 'es' ? '/es' : '', [locale]);

  const getAlternateUrl = useCallback((currentPath: string): string => {
    if (locale === 'en') {
      return `/es${currentPath}`;
    }
    return currentPath.replace(/^\/es/, '') || '/';
  }, [locale]);

  return useMemo(() => ({ 
    locale, 
    t, 
    pathPrefix, 
    getAlternateUrl,
    setLocale,
  }), [locale, t, pathPrefix, getAlternateUrl, setLocale]);
}
