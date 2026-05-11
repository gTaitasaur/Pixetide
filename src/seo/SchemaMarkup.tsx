/**
 * SchemaMarkup.tsx — Datos estructurados JSON-LD para Google Rich Results.
 *
 * ¿Qué es JSON-LD y por qué importa?
 * Es un formato que le dice a Google exactamente QUÉ es tu página.
 * Sin JSON-LD, Google adivina: "parece un sitio web".
 * Con JSON-LD, Google sabe: "es una aplicación web gratuita de edición de imagen".
 *
 * Esto puede generar "rich snippets" en los resultados de búsqueda:
 * - Rating (si se agrega en el futuro)
 * - Precio: Gratis
 * - Tipo: Aplicación web
 * - FAQs (si se agregan)
 *
 * ¿Por qué un componente React y no inyección estática?
 * Porque necesitamos datos dinámicos según la ruta (title, description, url)
 * que ya están en seoConfig.ts. Un componente React los lee y genera el <script>.
 */

import { useLocation } from 'react-router-dom';
import {
  getSeoByPath,
  getLocaleFromPath,
  getCanonicalUrl,
  SITE_CONFIG,
} from './seoConfig';

/**
 * Inyecta un <script type="application/ld+json"> en el DOM con los datos
 * estructurados de la página actual.
 *
 * Genera dos schemas:
 * 1. WebApplication — describe Pixetide como aplicación web
 * 2. WebPage — describe la página actual con title, description, language
 */
export const SchemaMarkup: React.FC = () => {
  const { pathname } = useLocation();
  const locale = getLocaleFromPath(pathname);
  const seoEntry = getSeoByPath(pathname);

  if (!seoEntry) return null;

  const canonicalUrl = getCanonicalUrl(seoEntry.path[locale]);
  const title = seoEntry.title[locale];
  const description = seoEntry.description[locale];
  const ogImage = `${SITE_CONFIG.canonicalOrigin}${SITE_CONFIG.defaultOgImage}`;
  const inLanguage = locale === 'es' ? 'es-ES' : 'en-US';

  // Schema principal: WebApplication (describe la app entera)
  const webApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_CONFIG.siteName,
    url: SITE_CONFIG.canonicalOrigin,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: seoEntry.id === 'home'
      ? description
      : 'Free browser-based image tools. Compress, convert, crop, remove backgrounds & more. 100% private.',
    image: ogImage,
    inLanguage,
    featureList: [
      'Image Compression',
      'Image Format Conversion',
      'Image Cropping',
      'Image Rotation',
      'Watermark Addition',
      'Background Removal',
      'Color Palette Extraction',
      'Base64 Encoding',
    ],
  };

  // Schema de la página actual
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: canonicalUrl,
    inLanguage,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_CONFIG.siteName,
      url: SITE_CONFIG.canonicalOrigin,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
    </>
  );
};
