/**
 * useLocale.ts — Hook para internacionalización (i18n)
 *
 * ¿Por qué un hook propio y no i18next o react-intl?
 * Porque solo tenemos 2 idiomas y ~50 strings. Usar una librería i18n completa
 * (i18next = ~40KB) para esto es overkill. Este hook pesa 0KB extra porque es
 * código nativo de la app.
 *
 * Estrategia: el idioma se detecta EXCLUSIVAMENTE desde la URL.
 * - /es/* → español
 * - todo lo demás → inglés (idioma por defecto)
 * No usamos cookies, localStorage ni navigator.language porque queremos que
 * Google indexe cada versión por su URL, no por el estado del cliente.
 */

import { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getLocaleFromPath, type SupportedLocale } from '../seo/seoConfig';
import { translations, type TranslationKey } from './translations';

interface UseLocaleReturn {
  /** Locale actual: 'en' | 'es' */
  locale: SupportedLocale;
  /** Función para obtener un texto traducido por su key */
  t: (key: TranslationKey) => string;
  /** Prefijo de ruta para el locale actual. '' para EN, '/es' para ES */
  pathPrefix: string;
  /** Genera la ruta equivalente en el otro idioma */
  getAlternateUrl: (currentPath: string) => string;
}

export function useLocale(): UseLocaleReturn {
  const { pathname } = useLocation();
  const locale = getLocaleFromPath(pathname);

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
    getAlternateUrl 
  }), [locale, t, pathPrefix, getAlternateUrl]);
}
