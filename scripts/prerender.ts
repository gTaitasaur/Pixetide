/**
 * prerender.ts — Genera HTML estático para cada ruta del sitio.
 *
 * Este es el corazón del SSG (Static Site Generation).
 *
 * Flujo:
 * 1. Lee dist/index.html como template
 * 2. Importa el módulo SSR compilado (dist/server/entry-server.js)
 * 3. Para cada ruta en seoConfig.ts:
 *    a. Renderiza la app React como string HTML
 *    b. Genera los meta tags específicos de esa ruta
 *    c. Inyecta ambos en el template
 *    d. Guarda como dist/[ruta]/index.html
 *
 * ¿Por qué no usamos Puppeteer/Playwright?
 * Porque pesan ~300MB y lanzan un navegador real.
 * renderToString de React cuesta ~0MB extra y genera el mismo resultado.
 *
 * ¿Qué pasa si un componente de herramienta falla en SSR?
 * Las herramientas usan canvas, Fabric.js, ImageMagick — APIs del navegador.
 * Si alguna crashea, el try/catch genera un HTML mínimo con solo los meta tags.
 * Google sigue pudiendo indexar la página gracias a title, description y canonical.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SEO_PAGES,
  SITE_CONFIG,
  getLocaleFromPath,
  type SupportedLocale,
  type PageSeoEntry,
} from '../src/core/seo/seoConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIST_DIR = resolve(__dirname, '..', 'dist');

/**
 * Genera las meta tags HTML para una página y locale específicos.
 * Esto reemplaza lo que SeoHead hace dinámicamente en el cliente.
 */
function generateHeadTags(page: PageSeoEntry, locale: SupportedLocale): string {
  const title = page.title[locale];
  const description = page.description[locale];
  const canonicalUrl = `${SITE_CONFIG.canonicalOrigin}${page.path[locale]}`;
  const ogImage = `${SITE_CONFIG.canonicalOrigin}${SITE_CONFIG.defaultOgImage}`;
  const ogLocale = locale === 'es' ? 'es_ES' : 'en_US';

  const tags: string[] = [
    // Canonical
    `<link rel="canonical" href="${canonicalUrl}" />`,

    // Hreflang
    `<link rel="alternate" hreflang="en" href="${SITE_CONFIG.canonicalOrigin}${page.path.en}" />`,
    `<link rel="alternate" hreflang="es" href="${SITE_CONFIG.canonicalOrigin}${page.path.es}" />`,
    `<link rel="alternate" hreflang="x-default" href="${SITE_CONFIG.canonicalOrigin}${page.path[SITE_CONFIG.defaultLocale]}" />`,

    // Open Graph
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${canonicalUrl}" />`,
    `<meta property="og:site_name" content="${SITE_CONFIG.siteName}" />`,
    `<meta property="og:locale" content="${ogLocale}" />`,
    `<meta property="og:image" content="${ogImage}" />`,

    // Twitter Card
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
  ];

  return tags.map((t) => `    ${t}`).join('\n');
}

async function prerender(): Promise<void> {
  console.log('\n🔨 Iniciando prerendering...\n');

  // 1. Leer el template HTML generado por Vite
  const templatePath = resolve(DIST_DIR, 'index.html');
  const template = readFileSync(templatePath, 'utf-8');

  // 2. Importar el módulo SSR compilado
  let render: ((url: string) => string) | null = null;
  try {
    const ssrModule = await import(resolve(DIST_DIR, 'server', 'entry-server.js'));
    render = ssrModule.render;
  } catch (err) {
    console.warn(`  ⚠️  No se pudo cargar el módulo SSR: ${(err as Error).message?.slice(0, 80)}`);
    console.warn('     Se generarán HTMLs con meta tags pero sin contenido React prerendereado.\n');
  }

  let successCount = 0;
  let fallbackCount = 0;

  // 3. Prerenderizar cada ruta
  for (const page of SEO_PAGES) {
    for (const locale of SITE_CONFIG.locales) {
      const url = page.path[locale];
      const headTags = generateHeadTags(page, locale);
      const lang = getLocaleFromPath(url);

      let appHtml = '';

      if (render) {
        try {
          appHtml = render(url);
          successCount++;
        } catch (err) {
          // Si el componente usa APIs del navegador, generamos HTML mínimo
          console.warn(`  ⚠️  ${url} — SSR fallback (${(err as Error).message?.slice(0, 60)})`);
          fallbackCount++;
        }
      } else {
        fallbackCount++;
      }

      // 4. Inyectar en el template
      let html = template;

      // Reemplazar lang del <html>
      html = html.replace('<html lang="en">', `<html lang="${lang}">`);

      // Reemplazar el title y description del fallback con los específicos
      html = html.replace(
        /<title>.*?<\/title>/,
        `<title>${page.title[locale]}</title>`
      );
      html = html.replace(
        /<meta name="description" content=".*?" \/>/,
        `<meta name="description" content="${page.description[locale]}" />`
      );

      // Inyectar head tags adicionales
      html = html.replace('<!--head-tags-->', headTags);

      // Inyectar contenido de la app
      html = html.replace('<!--app-html-->', appHtml);

      // 5. Determinar la ruta de salida
      //    /                → dist/index.html (ya existe, lo sobreescribimos)
      //    /tools/compress  → dist/tools/compress/index.html
      //    /es/             → dist/es/index.html
      let outputPath: string;
      const cleanUrl = url.replace(/\/$/, '') || '/';

      if (cleanUrl === '/') {
        outputPath = resolve(DIST_DIR, 'index.html');
      } else {
        outputPath = resolve(DIST_DIR, cleanUrl.slice(1), 'index.html');
      }

      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, html, 'utf-8');

      console.log(`  ✅ ${url} → ${outputPath.replace(DIST_DIR, 'dist')}`);
    }
  }

  // 4. Generar 404.html (crítico para Cloudflare Pages/Hosting)
  // Usamos una ruta inexistente para que React renderice el componente NotFound
  if (render) {
    const url404 = '/404-fallback';
    const outputPath404 = resolve(DIST_DIR, '404.html');
    const appHtml404 = render(url404);
    
    // Para el 404 usamos el template base pero inyectamos el noindex manualmente
    // ya que no hay seoEntry para /404-fallback
    const noIndexTag = '    <meta name="robots" content="noindex, nofollow" />';
    
    let html404 = template;
    html404 = html404.replace('<!--head-tags-->', noIndexTag);
    html404 = html404.replace('<!--app-html-->', appHtml404);
    
    writeFileSync(outputPath404, html404, 'utf-8');
    console.log(`  ✅ 404.html → dist/404.html (Fallback)`);
  }

  console.log(`\n📊 Prerendering completado: ${successCount} OK, ${fallbackCount} fallbacks`);
  console.log(`📁 Total archivos HTML: ${successCount + fallbackCount + (render ? 1 : 0)}\n`);
}

prerender().catch((err) => {
  console.error('❌ Error fatal durante prerendering:', err);
  process.exit(1);
});
