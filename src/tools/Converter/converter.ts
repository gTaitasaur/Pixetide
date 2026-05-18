export type TargetFormat = 
  | 'image/jpeg' 
  | 'image/png' 
  | 'image/webp'
  | 'image/avif'
  | 'image/bmp'
  | 'image/tiff'
  | 'image/vnd.adobe.photoshop' // PSD
  | 'application/postscript' // EPS
  | 'image/x-icon' // ICO
  | 'image/gif';

export type FallbackColor = '#FFFFFF' | '#000000' | 'transparent';

export interface ConverterFile {
  id: string; // Unique ID for React keys
  file: File;
  previewUrl: string;
  hasTransparency: boolean;
  targetFormat: TargetFormat;
  fallbackColor: FallbackColor;
  status: 'idle' | 'processing' | 'done' | 'error';
  resultBlob?: Blob;
  resultUrl?: string;
}

export const FORMAT_LABELS: Record<TargetFormat, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/avif': 'AVIF',
  'image/bmp': 'BMP',
  'image/tiff': 'TIFF',
  'image/vnd.adobe.photoshop': 'PSD',
  'application/postscript': 'EPS',
  'image/x-icon': 'ICO',
  'image/gif': 'GIF',
};
