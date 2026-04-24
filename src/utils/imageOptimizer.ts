import { ImageMagick, MagickFormat, MagickGeometry } from '@imagemagick/magick-wasm';
import { initMagickEngine } from './magickEngine';
import { OptimizationPreset } from '../types/optimizer';

export interface OptimizationResult {
  file: File;
  url: string;
  originalSize: number;
  newSize: number;
  reductionPercentage: number;
}

/**
 * Determina si un formato es "sin pérdida" por naturaleza.
 * PNG, BMP, TIFF no usan calidad visual como JPG/WebP.
 */
const isLosslessFormat = (format: MagickFormat): boolean => {
  return format === MagickFormat.Png 
    || format === MagickFormat.Bmp 
    || format === MagickFormat.Tiff 
    || format === MagickFormat.Gif;
};

/**
 * Optimiza una imagen usando ImageMagick WASM.
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
  await initMagickEngine();
  const buffer = new Uint8Array(await originalFile.arrayBuffer());

  return new Promise((resolve, reject) => {
    try {
      ImageMagick.read(buffer, (img) => {
        const originalFormat = img.format;
        const targetFormat = useWebP ? MagickFormat.WebP : originalFormat;

        // ── Paso 1: Redimensionado condicional ──
        if (!preserveResolution) {
          const geom = new MagickGeometry(`${preset.maxWidthOrHeight}x${preset.maxWidthOrHeight}>`);
          img.resize(geom);
        }
        
        // ── Paso 2: Strip metadata (siempre, para bajar peso) ──
        img.strip();

        // ── Paso 3: Configurar compresión según el formato y el preset ──
        if (preset.id === 'lossless') {
          if (useWebP) {
            // WebP Lossless: compresión sin pérdida visual
            img.settings.setDefine(MagickFormat.WebP, 'lossless', 'true');
            img.quality = 100;
          } else if (isLosslessFormat(originalFormat)) {
            // PNG/BMP/TIFF/GIF: No tocamos la calidad.
            // Para PNG, quality controla zlib, no calidad visual.
            // Dejamos que Magick use su default interno para no inflar.
          } else {
            // JPG u otros formatos con pérdida: mantener calidad original
            // Si ImageMagick no puede leerla (devuelve 0), usamos 92 como tope seguro.
            const originalQuality = img.quality;
            img.quality = originalQuality > 0 ? originalQuality : 92;
          }
        } else {
          // Presets con compresión (Normal, Agresiva, Máxima)
          const targetQuality = Math.round(preset.quality * 100);

          if (useWebP) {
            img.settings.setDefine(MagickFormat.WebP, 'lossless', 'false');
            img.quality = targetQuality;
          } else if (isLosslessFormat(originalFormat)) {
            // Para PNG: no tiene sentido bajar "calidad visual" porque PNG es lossless.
            // Lo que sí podemos hacer es redimensionar (ya hecho arriba) y strip (ya hecho).
            // La compresión real viene del redimensionado, no de una variable quality.
          } else {
            // JPG: aplicar calidad del preset directamente
            img.quality = targetQuality;
          }
        }
        
        img.write(targetFormat, (outBuffer) => {
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
          // Si el resultado pesa más que el original, devolvemos el original.
          // Esto cubre TODOS los edge cases (PNG lossless, JPG ya muy comprimido, etc.)
          if (newSize > originalSize) {
            finalFile = originalFile;
            finalSize = originalSize;
          }

          const reductionPercentage = Math.max(0, ((originalSize - finalSize) / originalSize) * 100);

          resolve({
            file: finalFile,
            url: URL.createObjectURL(finalFile),
            originalSize,
            newSize: finalSize,
            reductionPercentage,
          });
        });
      });
    } catch (error) {
      console.error("Error optimizando imagen:", error);
      reject(new Error('Fallo al comprimir la imagen con ImageMagick.'));
    }
  });
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
