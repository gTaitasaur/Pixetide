import JSZip from 'jszip';
import { TargetFormat, FallbackColor } from '../types/converter';
import { runMagickTask } from './magickEngine';

/**
 * Escanea la imagen usando el Worker de ImageMagick para determinar si
 * existe canal Alpha.
 */
export const detectTransparency = async (imageUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    
    // Transferimos el buffer al worker sin bloquear el hilo principal
    const hasAlpha = await runMagickTask('DETECT_TRANSPARENCY', { buffer }, [buffer]);
    return hasAlpha;
  } catch {
    return false;
  }
};

/**
 * Convierte un File a un Blob del formato destino usando el worker de ImageMagick.
 * Si se solicita un fallbackColor y hay transparencia, hace compositing nativo de alta calidad.
 */
export const convertImage = async (
  file: File, 
  targetFormat: TargetFormat, 
  fallbackColor: FallbackColor
): Promise<Blob> => {
  const buffer = await file.arrayBuffer();
  
  try {
    const outBuffer = await runMagickTask('CONVERT_IMAGE', {
      buffer,
      targetFormat,
      fallbackColor
    }, [buffer]);

    return new Blob([new Uint8Array(outBuffer)], { type: targetFormat });
  } catch (e) {
    throw e instanceof Error ? e : new Error("Fallo en la conversión con el Worker de ImageMagick");
  }
};

/**
 * Recibe una lista de blobs procesados con sus nombres de archivo
 * y los empaqueta en un ZIP listo para descarga.
 */
export const packageZip = async (files: { blob: Blob, filename: string }[]): Promise<Blob> => {
  const zip = new JSZip();
  
  files.forEach(({ blob, filename }) => {
    zip.file(filename, blob);
  });

  return zip.generateAsync({ type: 'blob' });
};
