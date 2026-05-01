import { ImageMagick, MagickFormat, MagickGeometry, CompositeOperator, Point, Channels, EvaluateOperator } from '@imagemagick/magick-wasm';
import { initMagickEngine } from './magickEngine';
import { WatermarkConfig } from '../types/watermark';

export interface WatermarkResult {
  file: File;
  url: string;
  blob: Blob;
}

/**
 * Aplica una marca de agua sobre una imagen base usando ImageMagick WASM.
 *
 * ¿Por qué usamos coordenadas normalizadas?
 * Porque la marca se posiciona como porcentaje (0–1) del ancho/alto de la imagen,
 * permitiendo que la misma configuración funcione en imágenes de distintas dimensiones.
 *
 * Pasos internos:
 * 1. Redimensionar la marca al tamaño relativo configurado (config.scale × ancho base).
 * 2. Rotar la marca si config.rotation ≠ 0.
 * 3. Ajustar opacidad multiplicando el canal alfa.
 * 4. Calcular posición en píxeles a partir de las coordenadas normalizadas.
 * 5. Componer con CompositeOperator.Over.
 * 6. Escribir resultado preservando formato y calidad original.
 */
export async function applyWatermark(
  baseFile: File,
  watermarkFile: File,
  config: WatermarkConfig
): Promise<WatermarkResult> {
  await initMagickEngine();

  const baseBuffer = new Uint8Array(await baseFile.arrayBuffer());
  const wmBuffer = new Uint8Array(await watermarkFile.arrayBuffer());

  return new Promise((resolve, reject) => {
    try {
      ImageMagick.read(baseBuffer, (baseImg) => {
        ImageMagick.read(wmBuffer, (wmImg) => {
          // 1. Redimensionar marca de agua al tamaño relativo configurado
          // Usamos el LADO MENOR como referencia para que la escala sea
          // visualmente consistente entre fotos horizontales y verticales
          const refDimension = Math.min(baseImg.width, baseImg.height);
          const targetWmWidth = Math.round(refDimension * config.scale);
          // Mantener aspect ratio de la marca
          const targetWmHeight = Math.round(
            targetWmWidth * (wmImg.height / wmImg.width)
          );
          wmImg.resize(new MagickGeometry(targetWmWidth, targetWmHeight));

          // 2. Rotar la marca si es necesario
          if (config.rotation !== 0) {
            wmImg.rotate(config.rotation);
          }

          // 3. Ajustar opacidad multiplicando el canal alfa
          // Esto hace la marca semi-transparente si opacity < 1
          if (config.opacity < 1) {
            wmImg.evaluate(Channels.Alpha, EvaluateOperator.Multiply, config.opacity);
          }

          // 4. Calcular posición en píxeles desde coordenadas normalizadas
          // Usamos el centro de la marca como punto de referencia
          const posX = Math.round(
            (config.x * baseImg.width) - (wmImg.width / 2)
          );
          const posY = Math.round(
            (config.y * baseImg.height) - (wmImg.height / 2)
          );

          // 5. Componer la marca sobre la imagen base
          baseImg.composite(wmImg, CompositeOperator.Over, new Point(posX, posY));

          // 6. Preservar formato y calidad original
          const format = baseImg.format;
          const isLosslessFormat =
            format === MagickFormat.Png ||
            format === MagickFormat.Bmp ||
            format === MagickFormat.Tiff ||
            format === MagickFormat.Gif;

          if (!isLosslessFormat && baseImg.quality && baseImg.quality > 0) {
            // Mantener calidad original
          } else if (!isLosslessFormat) {
            baseImg.quality = 92;
          }

          baseImg.write(format, (outBuffer) => {
            const resultBlob = new Blob([new Uint8Array(outBuffer)], {
              type: baseFile.type,
            });
            const resultFile = new File([resultBlob], baseFile.name, {
              type: baseFile.type,
            });

            resolve({
              file: resultFile,
              url: URL.createObjectURL(resultBlob),
              blob: resultBlob,
            });
          });
        });
      });
    } catch (error) {
      console.error('Error al aplicar marca de agua:', error);
      reject(new Error('Fallo al procesar la marca de agua con ImageMagick.'));
    }
  });
}
