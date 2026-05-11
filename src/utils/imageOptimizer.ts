import { runMagickTask } from './magickEngine';
import { OptimizationPreset } from '../types/optimizer';

export interface OptimizationResult {
  file: File;
  url: string;
  originalSize: number;
  newSize: number;
  reductionPercentage: number;
}

/**
 * Optimiza una imagen usando el Worker de ImageMagick WASM.
 * 
 * Casos de uso cubiertos:
 * 1. Lossless + preservar resolución + formato nativo → Solo strip metadata
 * 2. Lossless + WebP → WebP Lossless (compresión sin pérdida visual)
 * 3. Normal/Agresiva/Máxima + formato nativo → Recompresión con calidad del preset
 * 4. Cualquier preset + WebP → Conversión a WebP con calidad del preset
 * 5. Sin preservar resolución → Redimensionar + comprimir
 * 
 * Mecanismo de Defensa: Si el resultado pesa más que el original,
 * devolvemos el original intacto para no perjudicar al usuario.
 */
export async function rawOptimizeImage(
  originalFile: File,
  preset: OptimizationPreset,
  preserveResolution: boolean,
  useWebP: boolean
): Promise<OptimizationResult> {
  const buffer = await originalFile.arrayBuffer();

  try {
    const outBuffer = await runMagickTask('OPTIMIZE_IMAGE', {
      buffer,
      preset,
      preserveResolution,
      useWebP
    }, [buffer]);

    const mimeType = useWebP ? 'image/webp' : originalFile.type;
    const newFileName = useWebP 
      ? originalFile.name.replace(/\.[^/.]+$/, "") + ".webp"
      : originalFile.name;
      
    const compressedFile = new File([new Uint8Array(outBuffer)], newFileName, {
      type: mimeType,
    });

    const originalSize = originalFile.size;
    const newSize = compressedFile.size;
    
    let finalFile = compressedFile;
    let finalSize = newSize;

    // ── Mecanismo de Defensa Universal ──
    if (newSize > originalSize) {
      finalFile = originalFile;
      finalSize = originalSize;
    }

    const reductionPercentage = Math.max(0, ((originalSize - finalSize) / originalSize) * 100);

    return {
      file: finalFile,
      url: URL.createObjectURL(finalFile),
      originalSize,
      newSize: finalSize,
      reductionPercentage,
    };
  } catch (error) {
    console.error("Error optimizando imagen:", error);
    throw new Error('Fallo al comprimir la imagen con el Worker de ImageMagick.');
  }
}

/**
 * Convierte bytes a formato humano (ej: 2.4 MB)
 */
export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Lee la imagen del usuario para recuperar su archivo original si solo tenemos URL
 */
export const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: mimeType });
};
