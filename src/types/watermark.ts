/**
 * Tipos para la herramienta de Marca de Agua avanzada con Fabric.js
 */

export type WatermarkType = 'text' | 'image';

export interface BaseWatermarkConfig {
  id: string;
  type: WatermarkType;
  /** Posición X central normalizada (0-1) */
  x: number;
  /** Posición Y central normalizada (0-1) */
  y: number;
  /** Escala relativa al ancho de la imagen base (ej: 0.25 = 25% del ancho) */
  scale: number;
  /** Ángulo en grados */
  rotation: number;
  /** Opacidad (0-1) */
  opacity: number;
}

export interface TextWatermarkConfig extends BaseWatermarkConfig {
  type: 'text';
  text: string;
  color: string; // HEX
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
}

export interface ImageWatermarkConfig extends BaseWatermarkConfig {
  type: 'image';
  /** URL Object de la imagen subida como marca de agua */
  url: string | null;
}

export type WatermarkConfig = TextWatermarkConfig | ImageWatermarkConfig;

export interface WatermarkFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  resultUrl?: string;
  resultBlob?: Blob;
}

export const DEFAULT_TEXT_CONFIG: TextWatermarkConfig = {
  id: '',
  type: 'text',
  text: 'Pixetide',
  color: '#ffffff',
  fontFamily: 'Inter',
  fontWeight: 'bold',
  x: 0.5,
  y: 0.5,
  scale: 0.3,
  rotation: 0,
  opacity: 0.8,
};

export const DEFAULT_IMAGE_CONFIG: ImageWatermarkConfig = {
  id: '',
  type: 'image',
  url: null,
  x: 0.5,
  y: 0.5,
  scale: 0.25,
  rotation: 0,
  opacity: 0.8,
};
