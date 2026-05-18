import { PixelCrop } from 'react-image-crop';
import { runMagickTask } from './magickEngine';

/**
 * Función asíncrona para recortar una imagen usando el Worker de ImageMagick.
 * Al usar el binario original en lugar de redibujar sobre un Canvas,
 * garantizamos cero pérdida de calidad (Zero generation loss).
 */
export const exportCroppedImage = async (
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<string> => {
  // Obtenemos el binario puro de la imagen desde su URL montada
  const response = await fetch(image.src);
  const buffer = await response.arrayBuffer();

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const cropX = Math.round(crop.x * scaleX);
  const cropY = Math.round(crop.y * scaleY);
  const cropWidth = Math.max(1, Math.round(crop.width * scaleX));
  const cropHeight = Math.max(1, Math.round(crop.height * scaleY));

  try {
    const { buffer: outBuffer, format } = await runMagickTask('CROP_IMAGE', {
      buffer,
      cropX,
      cropY,
      cropWidth,
      cropHeight
    }, [buffer]);

    const blob = new Blob([new Uint8Array(outBuffer)], { type: `image/${format.toLowerCase()}` });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(error);
    throw new Error('Fallo al recortar la imagen con el motor profesional');
  }
};
