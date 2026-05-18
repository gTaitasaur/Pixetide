export type ColorFormat = 'HEX' | 'RGB' | 'HSL' | 'OKLCH';

/** Representa un swatch extraído de la imagen con todos sus formatos */
export interface ExtractedSwatch {
  name: string; // 'Vibrant', 'DarkVibrant', etc.
  hex: string;
  rgb: string;
  hsl: string;
  oklch: string;
  textColor: string; // '#fff' o '#333' dependiendo de la luminancia para buena lectura
}

export interface HarmonicColorScale {
  hex: string;
  rgb: string;
  hsl: string;
  oklch: string;
  textColor: string;
}

/** Representa un grupo de colores generados por armonía cromática (escala de 5 tonos) */
export interface HarmonicColor {
  type: string;
  colors: HarmonicColorScale[];
}
