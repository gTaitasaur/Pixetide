/**
 * generate-sitemap.ts — Genera sitemap.xml desde seoConfig.ts
 *
 * Se ejecuta automáticamente en cada `npm run build`.
 * Lee las rutas de seoConfig.ts (fuente única de verdad) y genera
 * un sitemap XML con anotaciones hreflang para Google.
 *
 * ¿Por qué un script y no un sitemap estático?
 * Porque cada vez que agregas una herramienta nueva a seoConfig.ts,
 * el sitemap se regenera automáticamente sin editar nada más.
 *
 * Uso: npx tsx scripts/generate-sitemap.ts
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SEO_PAGES, SITE_CONFIG } from '../src/seo/seoConfig';

const ORIGIN = SITE_CONFIG.canonicalOrigin;
const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

/**
 * Genera un bloque <url> con anotaciones xhtml:link para hreflang.
 *
 * Cada URL incluye:
 * - <loc> con la URL canónica
 * - <lastmod> con la fecha de build
 * - <xhtml:link> para cada idioma (en, es) + x-default
 *
 * Google requiere que TODAS las versiones se listen recíprocamente.
 */
function generateUrlBlock(page: typeof SEO_PAGES[number], locale: 'en' | 'es'): string {
  const loc = `${ORIGIN}${page.path[locale]}`;
  const enUrl = `${ORIGIN}${page.path.en}`;
  const esUrl = `${ORIGIN}${page.path.es}`;

  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="es" href="${esUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />
  </url>`;
}

function generateSitemap(): string {
  const urlBlocks: string[] = [];

  for (const page of SEO_PAGES) {
    // Generar bloque para la versión EN
    urlBlocks.push(generateUrlBlock(page, 'en'));
    // Generar bloque para la versión ES
    urlBlocks.push(generateUrlBlock(page, 'es'));
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${urlBlocks.join('\n')}
</urlset>
`;
}

// ── Ejecutar ──
const sitemap = generateSitemap();
const outputPath = resolve(import.meta.dirname, '..', 'public', 'sitemap.xml');

writeFileSync(outputPath, sitemap, 'utf-8');

const urlCount = SEO_PAGES.length * 2; // EN + ES por página
console.log(`✅ sitemap.xml generado con ${urlCount} URLs → ${outputPath}`);
