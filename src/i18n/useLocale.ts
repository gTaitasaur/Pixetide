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

  const t = (key: TranslationKey): string => {
    const localeTranslations = translations[locale];
    if (localeTranslations[key]) return localeTranslations[key];
    // Fallback al inglés si una key no existe en el locale actual
    return translations['en'][key];
  };

  const pathPrefix = locale === 'es' ? '/es' : '';

  const getAlternateUrl = (currentPath: string): string => {
    if (locale === 'en') {
      // Estamos en EN → generar ruta ES
      return `/es${currentPath}`;
    }
    // Estamos en ES → generar ruta EN (quitar /es del inicio)
    return currentPath.replace(/^\/es/, '') || '/';
  };

  return { locale, t, pathPrefix, getAlternateUrl };
}
