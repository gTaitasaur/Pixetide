import { ImageMagick, MagickFormat } from '@imagemagick/magick-wasm';
import { initMagickEngine } from './magickEngine';

export interface RotateFlipParams {
  rotation: number; // 0, 90, 180, 270
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface RotateFlipResult {
  file: File;
  url: string;
}

/**
 * Aplica rotación y volteo a una imagen usando ImageMagick WASM.
 * Mantiene el formato y la calidad original para evitar pérdida de datos.
 */
export async function processRotationAndFlip(
  originalFile: File,
  params: RotateFlipParams
): Promise<RotateFlipResult> {
  await initMagickEngine();
  const buffer = new Uint8Array(await originalFile.arrayBuffer());

  return new Promise((resolve, reject) => {
    try {
      ImageMagick.read(buffer, (img) => {
        // 1. Aplicar Rotación (en grados horarios)
        if (params.rotation !== 0) {
          img.rotate(params.rotation);
        }

        // 2. Aplicar Volteo Horizontal (Efecto Espejo)
        // Nota: flop() es para horizontal, flip() es para vertical en ImageMagick
        if (params.flipHorizontal) {
          img.flop();
        }

        // 3. Aplicar Volteo Vertical
        if (params.flipVertical) {
          img.flip();
        }

        // Para formatos que no son Lossless, intentamos preservar la calidad original
        // para que no se re-comprima agresivamente (ej: si era un JPG al 95%, mantenerlo)
        const format = img.format;
        const isLosslessFormat = format === MagickFormat.Png || 
                                 format === MagickFormat.Bmp || 
                                 format === MagickFormat.Tiff || 
                                 format === MagickFormat.Gif;
        
        if (!isLosslessFormat && img.quality && img.quality > 0) {
          // Mantener la calidad original
        } else if (!isLosslessFormat) {
          img.quality = 92; // default seguro para formatos con pérdida que no reportan calidad
        }

        img.write(format, (outBuffer) => {
          const resultFile = new File([new Uint8Array(outBuffer)], originalFile.name, {
            type: originalFile.type,
          });

          resolve({
            file: resultFile,
            url: URL.createObjectURL(resultFile),
          });
        });
      });
    } catch (error) {
      console.error("Error al girar/voltear la imagen:", error);
      reject(new Error('Fallo al procesar la imagen con ImageMagick.'));
    }
  });
}
