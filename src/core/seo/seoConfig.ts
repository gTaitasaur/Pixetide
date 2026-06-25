/**
 * seoConfig.ts — Fuente Única de Verdad SEO para Pixetide
 *
 * TODA la metadata del sitio vive aquí. Cuando agregas una herramienta nueva,
 * solo creas una entrada aquí y el resto (SeoHead, sitemap, hreflang) la consume
 * automáticamente. Esto evita tener titles/descriptions dispersos por 20 archivos.
 */

// ────────────────────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────────────────────

export type SupportedLocale = 'en' | 'es';

export interface LocalizedString {
  readonly en: string;
  readonly es: string;
}

export interface PageSeoEntry {
  /** Identificador interno (slug) para esta página */
  readonly id: string;
  /** Rutas por idioma (sin dominio). Ej: '/tools/compress-image' */
  readonly path: Readonly<Record<SupportedLocale, string>>;
  /** <title> de la página (max ~60 chars recomendado) */
  readonly title: LocalizedString;
  /** <meta name="description"> (max ~155 chars recomendado) */
  readonly description: LocalizedString;
  /** Heading H1 visible en la página */
  readonly h1: LocalizedString;
  /** Keywords de referencia para copywriting (no se inyectan como meta keywords) */
  readonly keywords: Readonly<Record<SupportedLocale, readonly string[]>>;
}

// ────────────────────────────────────────────────────────────────
// Configuración Global
// ────────────────────────────────────────────────────────────────

export const SITE_CONFIG = {
  /** Dominio canónico con protocolo. SIN trailing slash. */
  canonicalOrigin: 'https://pixetide.com',
  /** Nombre de la marca */
  siteName: 'Pixetide',
  /** Idioma por defecto (x-default) */
  defaultLocale: 'en' as SupportedLocale,
  /** Todos los idiomas soportados */
  locales: ['en', 'es'] as readonly SupportedLocale[],
  /** Twitter handle (sin @). Dejar vacío si no aplica */
  twitterHandle: '',
  /** Ruta de la imagen OG por defecto (relativa a public/) */
  defaultOgImage: '/og-image.png',
} as const;

// ────────────────────────────────────────────────────────────────
// Metadata por Página
// ────────────────────────────────────────────────────────────────

export const SEO_PAGES: readonly PageSeoEntry[] = [
  // ─── Home ───
  {
    id: 'home',
    path: { en: '/', es: '/es/' },
    title: {
      en: 'Pixetide — Free Online Image Tools | 100% Private, No Upload',
      es: 'Pixetide — Herramientas de Imagen Gratis | 100% Privado, Sin Subir Archivos',
    },
    description: {
      en: 'Free browser-based image tools. Compress, convert, crop, remove backgrounds & more. Your files never leave your device. No signup required.',
      es: 'Suite de herramientas de imagen en tu navegador. Comprime, convierte, recorta y más. Tus archivos nunca salen de tu dispositivo. Sin registro.',
    },
    h1: {
      en: 'Pixetide: Your Private, Fast & Free Image Editing Suite',
      es: 'Pixetide: Tu Suite de Edición Local, Rápida y Privada',
    },
    keywords: {
      en: ['free image tools', 'online image editor', 'private image processing', 'no upload image tools', 'browser image tools'],
      es: ['herramientas de imagen gratis', 'editor de imágenes online', 'procesamiento privado de imágenes', 'sin subir archivos'],
    },
  },

  // ─── Compress / Comprimir Imágenes ───
  {
    id: 'compress',
    path: { en: '/tools/compress-image/', es: '/es/herramientas/comprimir-imagen/' },
    title: {
      en: 'Compress Images Online Free | Pixetide',
      es: 'Comprimir Imágenes Online Gratis | Pixetide',
    },
    description: {
      en: 'Compress JPG, PNG, or WebP images online without losing quality. Fast, private, and 100% browser-based. No uploads required.',
      es: 'Comprime imágenes JPG, PNG o WebP online sin perder calidad. Rápido, privado y 100% en tu navegador. Sin subir archivos.',
    },
    h1: {
      en: 'Compress Images Without Quality Loss',
      es: 'Comprimir Imágenes sin Perder Calidad',
    },
    keywords: {
      en: ['compress image', 'reduce image size', 'optimize image', 'compress png', 'compress jpeg'],
      es: ['comprimir imagen', 'reducir peso imagen', 'optimizar imagen', 'comprimir png', 'comprimir jpeg'],
    },
  },

  // ─── Convert / Convertidor de Formato ───
  {
    id: 'convert',
    path: { en: '/tools/convert-image/', es: '/es/herramientas/convertir-imagen/' },
    title: {
      en: 'Convert Image Format Online Free | Pixetide',
      es: 'Convertidor de Formatos de Imagen Online Gratis | Pixetide',
    },
    description: {
      en: 'Convert your images to PNG, JPG, WebP, or GIF in bulk. 100% private, fast, and local in your browser. No files are uploaded.',
      es: 'Convierte tus imágenes a PNG, JPG, WebP o GIF por lotes. 100% privado, rápido y local en tu navegador. Sin subir archivos.',
    },
    h1: {
      en: 'Convert Image Formats — Free & Private',
      es: 'Convertidor de Formatos de Imagen — Gratis y Privado',
    },
    keywords: {
      en: ['convert image format', 'convert jpg to png', 'convert png to webp', 'bulk image converter', 'image format changer'],
      es: ['convertir formato imagen', 'convertir jpg a png', 'convertir png a webp', 'convertidor masivo de imagenes', 'cambiar formato de foto'],
    },
  },

  // ─── Rotate & Flip / Girar y Voltear ───
  {
    id: 'rotate-flip',
    path: { en: '/tools/rotate-flip-image/', es: '/es/herramientas/girar-voltear-imagen/' },
    title: {
      en: 'Rotate & Flip Images Online Free | Pixetide',
      es: 'Girar y Voltear Imágenes Online Gratis | Pixetide',
    },
    description: {
      en: 'Rotate photos any angle or mirror flip them. Quick, private, browser-based. No upload needed. Supports JPG, PNG, WebP.',
      es: 'Rota fotos a cualquier ángulo o aplica efecto espejo. Rápido, privado, en tu navegador. Sin subir archivos.',
    },
    h1: {
      en: 'Rotate & Flip Images — Free & Private',
      es: 'Girar y Voltear Imágenes — Gratis y Privado',
    },
    keywords: {
      en: ['rotate image online', 'flip image', 'mirror image', 'rotate photo'],
      es: ['girar imagen online', 'voltear imagen', 'efecto espejo imagen', 'rotar foto'],
    },
  },

  // ─── Watermark / Marca de Agua ───
  {
    id: 'watermark',
    path: { en: '/tools/watermark-image/', es: '/es/herramientas/marca-de-agua/' },
    title: {
      en: 'Add Watermark to Images Free — Logo & Text | Pixetide',
      es: 'Poner Marca de Agua a Imágenes Gratis — Logo y Texto | Pixetide',
    },
    description: {
      en: 'Protect your photos with custom text or logo watermarks. Batch processing, 100% private, no upload required.',
      es: 'Protege tus fotos con marcas de agua de texto o logo. Procesamiento masivo, 100% privado, sin subir archivos.',
    },
    h1: {
      en: 'Add Watermark to Your Images — Free & Private',
      es: 'Poner Marca de Agua a tus Imágenes — Gratis y Privado',
    },
    keywords: {
      en: ['add watermark to image', 'watermark photo online', 'logo watermark', 'protect photos'],
      es: ['poner marca de agua', 'marca de agua online', 'proteger fotos con logo'],
    },
  },

  // ─── Remove Background / Quitar Fondo ───
  {
    id: 'remove-bg',
    path: { en: '/tools/remove-background/', es: '/es/herramientas/quitar-fondo/' },
    title: {
      en: 'Remove Background from Image Free — AI Powered | Pixetide',
      es: 'Quitar Fondo de Imagen Gratis — Con IA | Pixetide',
    },
    description: {
      en: 'Remove image backgrounds instantly using AI. Runs 100% in your browser. No upload, no signup, no watermark on results.',
      es: 'Elimina fondos de imágenes con IA directamente en tu navegador. Sin subir archivos, sin registro, sin marca de agua.',
    },
    h1: {
      en: 'Remove Background from Images — AI-Powered, Free & Private',
      es: 'Quitar Fondo de Imágenes — Con IA, Gratis y Privado',
    },
    keywords: {
      en: ['remove background', 'background remover', 'remove bg online', 'transparent background'],
      es: ['quitar fondo', 'eliminar fondo imagen', 'fondo transparente', 'quitar fondo online'],
    },
  },

  // ─── Color Palette / Paleta de Colores ───
  {
    id: 'color-palette',
    path: { en: '/tools/color-palette/', es: '/es/herramientas/paleta-colores/' },
    title: {
      en: 'Extract Color Palette from Image Free | Pixetide',
      es: 'Extraer Paleta de Colores de Imagen Gratis | Pixetide',
    },
    description: {
      en: 'Extract dominant colors from any image. Get HEX codes instantly. Perfect for designers and developers. Runs locally in your browser.',
      es: 'Extrae colores dominantes de cualquier imagen. Códigos HEX al instante. Ideal para diseñadores. Procesamiento local.',
    },
    h1: {
      en: 'Extract Color Palette from Any Image — Free & Private',
      es: 'Extraer Paleta de Colores de Cualquier Imagen — Gratis y Privado',
    },
    keywords: {
      en: ['extract color palette', 'color picker from image', 'get hex colors', 'image color extractor'],
      es: ['extraer paleta de colores', 'colores de imagen', 'obtener código hex', 'extractor de colores'],
    },
  },

  // ─── Base64 Converter / Convertidor Base64 ───
  {
    id: 'base64',
    path: { en: '/tools/base64-converter/', es: '/es/herramientas/convertidor-base64/' },
    title: {
      en: 'Image to Base64 Converter Free — Encode & Decode | Pixetide',
      es: 'Convertidor de Imagen a Base64 Gratis — Codificar y Decodificar | Pixetide',
    },
    description: {
      en: 'Convert images to Base64 for HTML/CSS embedding or decode Base64 to image. Bidirectional, instant, 100% private.',
      es: 'Convierte imágenes a Base64 para HTML/CSS o decodifica Base64 a imagen. Bidireccional, instantáneo, 100% privado.',
    },
    h1: {
      en: 'Image to Base64 Converter — Free & Private',
      es: 'Convertidor de Imagen a Base64 — Gratis y Privado',
    },
    keywords: {
      en: ['image to base64', 'base64 encoder', 'base64 to image', 'base64 converter'],
      es: ['imagen a base64', 'codificador base64', 'base64 a imagen', 'convertidor base64'],
    },
  },

  // ─── Crop / Recortar Fotos ───
  {
    id: 'crop',
    path: { en: '/tools/crop-image/', es: '/es/herramientas/recortar-imagen/' },
    title: {
      en: 'Crop & Resize Images Online Free | Pixetide',
      es: 'Recortar y Redimensionar Imágenes Online Gratis | Pixetide',
    },
    description: {
      en: 'Crop photos to the perfect aspect ratio for Instagram, Facebook, or Pinterest. Free, private, browser-based. No registration needed.',
      es: 'Recorta fotos a las medidas ideales para Instagram, Facebook o Pinterest. Gratis, privado y local. Sin subir archivos.',
    },
    h1: {
      en: 'Crop & Resize Images — Free & Private',
      es: 'Recortar y Redimensionar Imágenes — Gratis y Privado',
    },
    keywords: {
      en: ['crop image online', 'resize photo', 'aspect ratio crop', 'social media crop'],
      es: ['recortar imagen online', 'redimensionar foto', 'relacion de aspecto', 'recortar para instagram'],
    },
  },

  // ─── Tools Dashboard ───
  {
    id: 'tools-dashboard',
    path: { en: '/tools/', es: '/es/herramientas/' },
    title: {
      en: 'Pixetide — Private & Free Image Tools Workspace',
      es: 'Pixetide — Área de Trabajo de Herramientas de Imagen Privada y Gratis',
    },
    description: {
      en: 'Explore and use our complete suite of browser-based image editing tools. 100% private and free.',
      es: 'Explora y utiliza nuestra suite completa de herramientas de edición de imágenes en el navegador. 100% privado y gratis.',
    },
    h1: {
      en: 'Tools Workspace',
      es: 'Área de Trabajo',
    },
    keywords: {
      en: ['image tools', 'online image editor', 'workspace'],
      es: ['herramientas de imagen', 'editor online', 'área de trabajo'],
    },
  },
] as const;

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

/** Busca la entrada SEO por su ID (ej: 'compress', 'home') */
export function getSeoById(id: string): PageSeoEntry | undefined {
  return SEO_PAGES.find((p) => p.id === id);
}

/**
 * Busca la entrada SEO a partir de un pathname del router.
 * Busca coincidencia exacta en cualquier idioma.
 * Para la raíz '/' y '/es/' usa trailing slash exacto.
 */
export function getSeoByPath(pathname: string): PageSeoEntry | undefined {
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;

  return SEO_PAGES.find((page) => {
    for (const locale of SITE_CONFIG.locales) {
      const pagePath = page.path[locale];
      const normalizedPagePath = pagePath.endsWith('/') ? pagePath : `${pagePath}/`;
      if (normalizedPagePath === normalized) return true;
    }
    return false;
  });
}

/**
 * Detecta el locale a partir del pathname.
 * Si empieza con /es/ → 'es', en cualquier otro caso → 'en'.
 */
export function getLocaleFromPath(pathname: string): SupportedLocale {
  return pathname.startsWith('/es/') || pathname === '/es' ? 'es' : 'en';
}

/** Genera la URL canónica completa para una ruta y locale dados */
export function getCanonicalUrl(path: string): string {
  return `${SITE_CONFIG.canonicalOrigin}${path}`;
}
