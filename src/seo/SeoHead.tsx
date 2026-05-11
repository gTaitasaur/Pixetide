import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getSeoByPath,
  getLocaleFromPath,
  getCanonicalUrl,
  SITE_CONFIG,
  type SupportedLocale,
  type PageSeoEntry,
} from './seoConfig';

/**
 * SeoHead — Componente que gestiona todos los meta tags del <head>.
 *
 * ¿Por qué no usamos react-helmet?
 * Porque es una dependencia extra de ~10KB que solo necesitamos para algo que
 * podemos hacer con 50 líneas de código nativo. Manipulamos el DOM directamente
 * porque el <head> está fuera del árbol de React (#root vive en <body>).
 *
 * Este componente:
 * 1. Detecta la ruta actual y el idioma
 * 2. Busca la metadata en seoConfig.ts
 * 3. Actualiza title, description, canonical, hreflang, OG, lang del <html>
 * 4. Se limpia al desmontar para no dejar tags huérfanos
 */
export const SeoHead: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const locale = getLocaleFromPath(pathname);
    const seoEntry = getSeoByPath(pathname);

    // Si no hay entrada SEO para esta ruta, al menos ponemos un fallback
    const title = seoEntry
      ? seoEntry.title[locale]
      : `${SITE_CONFIG.siteName} — Free Online Image Tools`;

    const description = seoEntry
      ? seoEntry.description[locale]
      : 'Free browser-based image tools. Your files never leave your device.';

    // ── 1. Title ──
    document.title = title;

    // ── 2. Lang del <html> ──
    document.documentElement.lang = locale;

    // ── 3. Meta Description ──
    setMetaTag('name', 'description', description);

    // ── 4. Canonical ──
    setLinkTag('canonical', getCanonicalUrl(pathname));

    // ── 5. Hreflang ──
    const hreflangTags = createHreflangTags(seoEntry, locale);

    // ── 6. Open Graph ──
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:url', getCanonicalUrl(pathname));
    setMetaTag('property', 'og:site_name', SITE_CONFIG.siteName);
    setMetaTag('property', 'og:locale', locale === 'es' ? 'es_ES' : 'en_US');
    setMetaTag(
      'property',
      'og:image',
      `${SITE_CONFIG.canonicalOrigin}${SITE_CONFIG.defaultOgImage}`
    );

    // ── 7. Twitter Card ──
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag(
      'name',
      'twitter:image',
      `${SITE_CONFIG.canonicalOrigin}${SITE_CONFIG.defaultOgImage}`
    );

    // Cleanup: remover hreflang tags al cambiar de ruta
    return () => {
      hreflangTags.forEach((tag) => tag.remove());
    };
  }, [pathname]);

  // Este componente no renderiza nada visible
  return null;
};

// ────────────────────────────────────────────────────────────────
// Helpers internos para manipular el <head>
// ────────────────────────────────────────────────────────────────

/**
 * Crea o actualiza un <meta> tag en el <head>.
 * Usa un atributo data-seo="managed" para identificar los tags que gestiona.
 */
function setMetaTag(
  keyAttr: 'name' | 'property',
  keyValue: string,
  content: string
): void {
  const selector = `meta[${keyAttr}="${keyValue}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(keyAttr, keyValue);
    element.setAttribute('data-seo', 'managed');
    document.head.appendChild(element);
  }

  element.content = content;
}

/**
 * Crea o actualiza un <link> tag (canonical).
 */
function setLinkTag(rel: string, href: string): void {
  const selector = `link[rel="${rel}"]`;
  let element = document.head.querySelector<HTMLLinkElement>(selector);

  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    element.setAttribute('data-seo', 'managed');
    document.head.appendChild(element);
  }

  element.href = href;
}

/**
 * Crea los tags hreflang para la página actual.
 * Retorna un array de elementos para poder removerlos en el cleanup.
 *
 * Genera:
 * - <link rel="alternate" hreflang="en" href="..." />
 * - <link rel="alternate" hreflang="es" href="..." />
 * - <link rel="alternate" hreflang="x-default" href="..." /> (apunta a EN)
 */
function createHreflangTags(
  seoEntry: PageSeoEntry | undefined,
  _currentLocale: SupportedLocale
): HTMLLinkElement[] {
  // Primero limpiamos hreflang tags anteriores
  document.head
    .querySelectorAll<HTMLLinkElement>('link[data-seo="hreflang"]')
    .forEach((el) => el.remove());

  if (!seoEntry) return [];

  const tags: HTMLLinkElement[] = [];

  // Un tag por cada locale
  for (const locale of SITE_CONFIG.locales) {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = locale;
    link.href = getCanonicalUrl(seoEntry.path[locale]);
    link.setAttribute('data-seo', 'hreflang');
    document.head.appendChild(link);
    tags.push(link);
  }

  // x-default apunta al idioma por defecto (EN)
  const xDefault = document.createElement('link');
  xDefault.rel = 'alternate';
  xDefault.hreflang = 'x-default';
  xDefault.href = getCanonicalUrl(seoEntry.path[SITE_CONFIG.defaultLocale]);
  xDefault.setAttribute('data-seo', 'hreflang');
  document.head.appendChild(xDefault);
  tags.push(xDefault);

  return tags;
}
