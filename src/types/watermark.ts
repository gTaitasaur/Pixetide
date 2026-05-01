/**
 * Tipos para la herramienta de Marca de Agua.
 * 
 * Usamos coordenadas normalizadas (0–1) para la posición de la marca,
 * garantizando que la ubicación sea relativa al tamaño de cada imagen
 * y se mantenga consistente entre fotos de distintas dimensiones.
 */

/** Configuración de posición, escala, rotación y opacidad de la marca */
export interface WatermarkConfig {
  /** Posición X del centro de la marca (0 = izquierda, 1 = derecha) */
  x: number;
  /** Posición Y del centro de la marca (0 = arriba, 1 = abajo) */
  y: number;
  /** Escala relativa al ancho de la imagen base (ej: 0.25 = 25% del ancho) */
  scale: number;
  /** Rotación en grados (-180 a 180) */
  rotation: number;
  /** Opacidad (0 = invisible, 1 = totalmente opaco) */
  opacity: number;
}

/** Estado de procesamiento de cada imagen del lote */
export interface WatermarkFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  resultUrl?: string;
  resultBlob?: Blob;
}

/** Valores por defecto de la configuración de marca de agua */
export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  x: 0.5,
  y: 0.5,
  scale: 0.25,
  rotation: 0,
  opacity: 0.7,
};
