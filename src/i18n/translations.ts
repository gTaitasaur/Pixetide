/**
 * translations/index.ts — Todos los textos de la UI por idioma.
 *
 * IMPORTANTE: Estos son solo textos de la interfaz (botones, labels, navegación).
 * Los títulos SEO, meta descriptions y H1 viven en seoConfig.ts.
 * Esta separación es intencional: el copy SEO necesita control fino por página,
 * mientras que estos textos son genéricos y compartidos.
 */

import type { SupportedLocale } from '../seo/seoConfig';

// ────────────────────────────────────────────────────────────────
// Definición de keys disponibles
// ────────────────────────────────────────────────────────────────

export type TranslationKey = keyof typeof en;

// ────────────────────────────────────────────────────────────────
// Inglés (idioma base)
// ────────────────────────────────────────────────────────────────

const en = {
  // ─── Navbar ───
  'nav.home': 'Home',
  'nav.tools': 'Tools',
  'nav.about': 'About',
  'nav.openMenu': 'Open menu',
  'nav.closeMenu': 'Close menu',
  'nav.support': 'Support Pixetide ☕',
  'nav.supportMicrocopy': 'No ads, no subscriptions. Help me keep it that way.',

  // ─── Language Switcher ───
  'lang.switch': 'ES',
  'lang.switchLabel': 'Cambiar a español',

  // ─── Footer ───
  'footer.tagline': 'Pixetide — 100% browser-powered. Your images never leave your device.',
  'footer.privacy': 'Privacy',
  'footer.tools': 'All Tools',
  'footer.about': 'About',
  'footer.rights': 'All rights reserved.',

  // ─── Home Hero ───
  'home.heroTitle': 'Pixetide: Your Private, Fast & Free Image Editing Suite',
  'home.heroSubtitle': 'Edit, compress, and convert your images without uploading anything. All processing runs locally in your browser to guarantee your privacy. A suite built with care to save you hours of work.',

  // ─── Home Cards ───
  'card.crop.title': 'Crop Images for Social Media',
  'card.crop.desc': 'Resize your photos to the perfect aspect ratio for Instagram, Facebook, or Pinterest. Crop images online easily without losing quality.',
  'card.compress.title': 'Compress Images Without Quality Loss',
  'card.compress.desc': 'Reduce the size of your JPG, PNG, or WebP images by up to 80% so your website loads faster. Smart, secure, and instant compression.',
  'card.convert.title': 'Convert Image Format',
  'card.convert.desc': 'Convert images to WebP, AVIF, JPG, or PNG in bulk. The ideal format to optimize your SEO and improve user experience.',
  'card.rotateFlip.title': 'Rotate & Flip Images',
  'card.rotateFlip.desc': 'Rotate your photos or apply a mirror effect easily. Ideal for straightening crooked images or creating symmetric compositions — 100% private.',
  'card.watermark.title': 'Add Watermark to Photos',
  'card.watermark.desc': 'Protect your photographs by adding your logo or text as a watermark. Everything is processed locally in your browser for maximum privacy.',
  'card.upscale.title': 'Enhance Image Quality',
  'card.upscale.desc': 'Increase the resolution of blurry or old photos. Enlarge images without pixelation using advanced upscaling technology — right in your browser. (Coming Soon)',
  'card.removeBg.title': 'Remove Background',
  'card.removeBg.desc': 'Magically remove the background from any image using AI directly in your browser. Compare before and after instantly.',
  'card.colorPalette.title': 'Extract Color Palette',
  'card.colorPalette.desc': 'Extract the dominant colors from any image and get their HEX codes. The ideal tool for web designers and creatives. Instant and local processing.',
  'card.photoEditor.title': 'Online Photo Editor',
  'card.photoEditor.desc': 'Adjust brightness, contrast, and apply professional filters for free. Fast and private photo editing from the comfort of your screen. (Coming Soon)',
  'card.base64.title': 'Base64 Converter',
  'card.base64.desc': 'Encode your images to Base64 for embedding in HTML or CSS, or decode Base64 back to an image. Bidirectional, instant, and 100% private.',
  'card.favicon.title': 'Favicon ICO Generator',
  'card.favicon.desc': 'Create the perfect icon for your website. Upload your logo and convert it to .ico and other standardized formats ready to use. (Coming Soon)',

  // ─── 404 ───
  'notFound.title': 'Oops! 404',
  'notFound.message': "This photo got lost in development. The page you're looking for doesn't exist or has been moved.",
  'notFound.backHome': 'Back to Home',
} as const;

// ────────────────────────────────────────────────────────────────
// Español
// ────────────────────────────────────────────────────────────────

const es: Record<TranslationKey, string> = {
  // ─── Navbar ───
  'nav.home': 'Inicio',
  'nav.tools': 'Herramientas',
  'nav.about': 'Acerca de',
  'nav.openMenu': 'Abrir menú',
  'nav.closeMenu': 'Cerrar menú',
  'nav.support': 'Apoya a Pixetide ☕',
  'nav.supportMicrocopy': 'Sin anuncios, sin suscripciones. Ayúdame a que siga así.',

  // ─── Language Switcher ───
  'lang.switch': 'EN',
  'lang.switchLabel': 'Switch to English',

  // ─── Footer ───
  'footer.tagline': 'Pixetide — Rendimiento 100% en tu navegador. Tus imágenes nunca salen de tu dispositivo.',
  'footer.privacy': 'Privacidad',
  'footer.tools': 'Herramientas',
  'footer.about': 'Información',
  'footer.rights': 'Todos los derechos reservados.',

  // ─── Home Hero ───
  'home.heroTitle': 'Pixetide: Tu Suite de Edición Local, Rápida y Privada',
  'home.heroSubtitle': 'Edita, comprime y convierte tus fotos sin subir nada a internet. Todo el procesamiento se realiza localmente en tu navegador para garantizar tu privacidad y ahorrarte horas de trabajo. Una suite creada con dedicación para hacerte la vida más fácil.',

  // ─── Home Cards ───
  'card.crop.title': 'Recortar Fotos para Redes',
  'card.crop.desc': 'Adapta tus imágenes al tamaño perfecto para Instagram, Facebook o Pinterest. Recorta fotos online fácilmente y sin perder calidad.',
  'card.compress.title': 'Comprimir Imágenes sin Perder Calidad',
  'card.compress.desc': 'Reduce el peso de tus fotos JPG, PNG o WebP hasta en un 80% para que tu web cargue más rápido. Compresión inteligente, segura y al instante.',
  'card.convert.title': 'Convertir Formato de Imagen',
  'card.convert.desc': 'Convierte fotos a WebP, AVIF, JPG o PNG de forma masiva. El formato ideal para optimizar tu SEO y mejorar la experiencia de tus usuarios.',
  'card.rotateFlip.title': 'Girar y Voltear Imágenes',
  'card.rotateFlip.desc': 'Rota tus fotos o aplícales un efecto espejo fácilmente. Ideal para enderezar imágenes torcidas o crear composiciones simétricas de forma 100% privada.',
  'card.watermark.title': 'Poner Marca de Agua a Fotos',
  'card.watermark.desc': 'Protege tus fotografías añadiendo tu logo o texto como marca de agua. Todo se procesa localmente en tu navegador para garantizar tu privacidad.',
  'card.upscale.title': 'Mejorar Calidad de Imagen',
  'card.upscale.desc': 'Aumenta la resolución de fotos borrosas o antiguas. Agranda imágenes sin pixelarlas usando tecnología de escalado avanzada desde tu navegador. (Próximamente)',
  'card.removeBg.title': 'Quitar Fondo',
  'card.removeBg.desc': 'Elimina el fondo de cualquier imagen mágicamente usando IA directamente en tu navegador. Compara el antes y después al instante.',
  'card.colorPalette.title': 'Extraer Paleta de Colores',
  'card.colorPalette.desc': 'Saca los colores predominantes de cualquier imagen y obtén sus códigos HEX. La herramienta ideal para diseñadores web y creativos. Procesamiento instantáneo y local.',
  'card.photoEditor.title': 'Editor de Fotos Online',
  'card.photoEditor.desc': 'Ajusta el brillo, contraste y aplica filtros profesionales gratis. Edición fotográfica rápida y privada desde la comodidad de tu pantalla. (Próximamente)',
  'card.base64.title': 'Convertidor Base64',
  'card.base64.desc': 'Codifica tus imágenes a Base64 para incrustarlas en HTML o CSS, o decodifica un código Base64 a imagen. Bidireccional, instantáneo y 100% privado.',
  'card.favicon.title': 'Generador de Favicon ICO',
  'card.favicon.desc': 'Crea el icono perfecto para tu página web. Sube tu logo y conviértelo a .ico y otros formatos estandarizados listos para usar. (Próximamente)',

  // ─── 404 ───
  'notFound.title': '¡Ups! 404',
  'notFound.message': 'Esta foto se nos ha perdido en el revelado. La página que buscas no existe o ha sido movida a otro álbum.',
  'notFound.backHome': 'Volver al Inicio',
};

// ────────────────────────────────────────────────────────────────
// Export
// ────────────────────────────────────────────────────────────────

export const translations: Record<SupportedLocale, Record<TranslationKey, string>> = {
  en,
  es,
};
