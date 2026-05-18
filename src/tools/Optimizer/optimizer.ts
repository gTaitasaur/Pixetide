export interface OptimizationPreset {
  id: string;
  label: string;
  description: string;
  quality: number;
  maxWidthOrHeight: number;
  badge?: string;
}

export const OPTIMIZATION_PRESETS: OptimizationPreset[] = [
  {
    id: 'lossless',
    label: 'Sin pérdida (Lossless)',
    description: 'Elimina únicamente los metadatos ocultos. No comprime ni altera los píxeles de la foto.',
    quality: 1.0,
    maxWidthOrHeight: 99999, // Límite virtualmente infinito para preservar original
  },
  {
    id: 'normal',
    label: 'Normal',
    description: 'Aplica una compresión ligera. El ahorro de peso es notable y la pérdida visual es imperceptible al ojo humano.',
    quality: 0.85,
    maxWidthOrHeight: 2400,
    badge: 'Recomendado',
  },
  {
    id: 'aggressive',
    label: 'Agresiva',
    description: 'Aumenta la compresión para obtener un archivo liviano. Ideal para cargas web rápidas.',
    quality: 0.70,
    maxWidthOrHeight: 1920,
  },
  {
    id: 'extreme',
    label: 'Máxima',
    description: 'Prioriza de manera extrema el bajo peso por sobre la nitidez de los detalles. Puede presentar artefactos de compresión.',
    quality: 0.50,
    maxWidthOrHeight: 1200,
  }
];
