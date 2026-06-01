import { SEO_PAGES } from './seoConfig';

/**
 * Obtiene la ruta localizada de una herramienta a partir de su ID.
 * Permite el encapsulamiento limpio y tree-shaking del archivo principal de configuración SEO.
 * 
 * @param id Identificador único de la herramienta (ej. 'compress', 'remove-bg')
 * @param locale Código del idioma actual ('en' | 'es')
 * @returns Ruta relativa de navegación
 */
export function getToolPath(id: string, locale: 'en' | 'es'): string {
  const page = SEO_PAGES.find((p) => p.id === id);
  return page?.path[locale] ?? '/';
}
