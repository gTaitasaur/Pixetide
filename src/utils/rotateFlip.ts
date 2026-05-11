import { runMagickTask } from './magickEngine';

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
 * Aplica rotación y volteo a una imagen usando el Worker de ImageMagick WASM.
 * Mantiene el formato y la calidad original para evitar pérdida de datos.
 */
export async function processRotationAndFlip(
  originalFile: File,
  params: RotateFlipParams
): Promise<RotateFlipResult> {
  const buffer = await originalFile.arrayBuffer();

  try {
    const outBuffer = await runMagickTask('ROTATE_FLIP', {
      buffer,
      ...params
    }, [buffer]);

    const resultFile = new File([new Uint8Array(outBuffer)], originalFile.name, {
      type: originalFile.type,
    });

    return {
      file: resultFile,
      url: URL.createObjectURL(resultFile),
    };
  } catch (error) {
    console.error("Error al girar/voltear la imagen:", error);
    throw new Error('Fallo al procesar la imagen con el Worker de ImageMagick.');
  }
}
