import { Crop } from 'react-image-crop';

export interface AspectRatioPreset {
  id: string;
  ratio: number | null; // null for free/custom crop
  label: {
    en: string;
    es: string;
  };
  iconName: string;
  subLabel?: {
    en: string;
    es: string;
  };
}

export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  {
    id: 'free',
    ratio: null,
    label: { en: 'Free Crop', es: 'Recorte Libre' },
    iconName: 'Maximize2',
    subLabel: { en: 'Custom proportions', es: 'Proporciones personalizadas' }
  },
  {
    id: '1-1',
    ratio: 1,
    label: { en: '1:1 Square', es: '1:1 Cuadrado' },
    iconName: 'Square',
    subLabel: { en: 'Instagram, Facebook Post', es: 'Post de Instagram, Facebook' }
  },
  {
    id: '4-5',
    ratio: 0.8,
    label: { en: '4:5 Vertical', es: '4:5 Vertical' },
    iconName: 'RectangleVertical',
    subLabel: { en: 'Instagram Portrait', es: 'Retrato de Instagram' }
  },
  {
    id: '16-9',
    ratio: 16 / 9,
    label: { en: '16:9 Widescreen', es: '16:9 Panorámico' },
    iconName: 'Tv',
    subLabel: { en: 'YouTube, Facebook Cover', es: 'YouTube, Portada de Facebook' }
  },
  {
    id: '9-16',
    ratio: 9 / 16,
    label: { en: '9:16 Stories', es: '9:16 Historias' },
    iconName: 'Smartphone',
    subLabel: { en: 'Reels, TikTok, Shorts', es: 'Reels, TikTok, Shorts' }
  },
  {
    id: '4-3',
    ratio: 4 / 3,
    label: { en: '4:3 Standard', es: '4:3 Estándar' },
    iconName: 'Monitor',
    subLabel: { en: 'Classic Photo', es: 'Foto clásica' }
  }
];

export interface CropImageItem {
  id: string;
  file: File;
  previewUrl: string;
  selectedPreset: string; // id del preset seleccionado
  crop: Crop; // Guardado en porcentaje
  naturalWidth: number; // Dimensiones originales reales de la foto
  naturalHeight: number;
  zoom?: number;
  position?: { x: number; y: number };
}
