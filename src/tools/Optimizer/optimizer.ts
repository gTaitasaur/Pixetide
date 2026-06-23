export type CompressionPresetId = 'lossless' | 'normal' | 'aggressive' | 'maximum';

export interface CompressionPreset {
  id: CompressionPresetId;
  label: {
    en: string;
    es: string;
  };
  subLabel: {
    en: string;
    es: string;
  };
  description: {
    en: string;
    es: string;
  };
  quality: number; // 0-100
}

export const COMPRESSION_PRESETS: CompressionPreset[] = [
  {
    id: 'lossless',
    label: { en: 'Lossless', es: 'Sin pérdida' },
    subLabel: { en: 'Original', es: 'Original' },
    description: {
      en: '100% quality. Preserves metadata and pixel structure without additional compression.',
      es: 'Calidad 100%. Mantiene los metadatos y la estructura de píxeles sin compresión adicional.'
    },
    quality: 100
  },
  {
    id: 'normal',
    label: { en: 'Normal', es: 'Normal' },
    subLabel: { en: 'Balanced', es: 'Equilibrado' },
    description: {
      en: '82% quality. Lossy compression optimized for standard rendering with zero perceptual loss.',
      es: 'Calidad 82%. Compresión con pérdida optimizada para visualización estándar sin pérdidas perceptuales.'
    },
    quality: 82
  },
  {
    id: 'aggressive',
    label: { en: 'Aggressive', es: 'Agresivo' },
    subLabel: { en: 'For Web', es: 'Para Web' },
    description: {
      en: '70% quality. Optimized compression to improve web loading speed by significantly reducing weight.',
      es: 'Calidad 70%. Compresión optimizada para mejorar la velocidad de carga web reduciendo significativamente el peso.'
    },
    quality: 70
  },
  {
    id: 'maximum',
    label: { en: 'Maximum', es: 'Máximo' },
    subLabel: { en: 'Smallest size', es: 'Mínimo peso' },
    description: {
      en: '55% quality. High-ratio compression for maximum weight reduction, sacrificing texture detail and gradients.',
      es: 'Calidad 55%. Compresión agresiva para máxima reducción de peso, sacrificando detalles en texturas y gradientes.'
    },
    quality: 55
  }
];

export interface OptimizerImageItem {
  id: string;
  file: File;
  previewUrl: string;
  selectedPreset: CompressionPresetId;
  keepDimensions: boolean;
  webpFormat: boolean;
  optimizedBlob: Blob | null;
  optimizedSize: number | null;
  isSavingOriginal: boolean; // Si es verdadero, indica que el archivo original es más óptimo y no se puede comprimir más.
  isProcessing: boolean;
}
