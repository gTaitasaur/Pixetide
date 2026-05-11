/// <reference lib="webworker" />
declare const self: DedicatedWorkerGlobalScope;

import { 
  initializeImageMagick, 
  ImageMagick, 
  MagickFormat, 
  MagickColor, 
  AlphaAction,
  MagickGeometry
} from '@imagemagick/magick-wasm';
// @ts-ignore
import magickWasmUrl from '@imagemagick/magick-wasm/magick.wasm?url';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

const initMagick = async (): Promise<void> => {
  if (isInitialized) return Promise.resolve();
  
  if (!initPromise) {
    const wasmUrl = new URL(magickWasmUrl, self.location.origin);
    initPromise = initializeImageMagick(wasmUrl)
      .then(() => {
        isInitialized = true;
      })
      .catch((err) => {
        console.error("Error crítico al cargar ImageMagick WASM en Worker:", err);
        throw err;
      });
  }
  
  return initPromise;
};

// Utilidad local para formatos
const mimeToMagickFormat = (mime: string): MagickFormat => {
  switch(mime) {
    case 'image/jpeg': return MagickFormat.Jpeg;
    case 'image/png': return MagickFormat.Png;
    case 'image/webp': return MagickFormat.WebP;
    case 'image/avif': return MagickFormat.Avif;
    case 'image/bmp': return MagickFormat.Bmp;
    case 'image/tiff': return MagickFormat.Tiff;
    case 'image/vnd.adobe.photoshop': return MagickFormat.Psd;
    case 'application/postscript': return MagickFormat.Eps;
    case 'image/x-icon': return MagickFormat.Ico;
    case 'image/gif': return MagickFormat.Gif;
    default: return MagickFormat.Png;
  }
};

const isLosslessFormat = (format: MagickFormat): boolean => {
  return format === MagickFormat.Png 
    || format === MagickFormat.Bmp 
    || format === MagickFormat.Tiff 
    || format === MagickFormat.Gif;
};

self.onmessage = async (e) => {
  const { id, action, payload } = e.data;
  
  try {
    await initMagick();

    switch (action) {
      case 'DETECT_TRANSPARENCY': {
        const { buffer } = payload;
        let hasAlpha = false;
        try {
          ImageMagick.read(new Uint8Array(buffer), (img) => {
            hasAlpha = img.hasAlpha;
          });
        } catch {
          hasAlpha = false;
        }
        self.postMessage({ id, result: hasAlpha });
        break;
      }

      case 'CONVERT_IMAGE': {
        const { buffer, targetFormat, fallbackColor } = payload;
        ImageMagick.read(new Uint8Array(buffer), (img) => {
          if (img.hasAlpha && fallbackColor !== 'transparent') {
            img.backgroundColor = new MagickColor(fallbackColor);
            img.alpha(AlphaAction.Remove);
          }
          img.quality = img.quality && img.quality > 0 ? img.quality : 92;
          const outFormat = mimeToMagickFormat(targetFormat);
          
          img.write(outFormat, (outBuffer) => {
            // Pasamos el buffer resultante devolviéndolo como un ArrayBuffer
            const returnBuffer = new Uint8Array(outBuffer).buffer;
            self.postMessage({ id, result: returnBuffer }, [returnBuffer]);
          });
        });
        break;
      }

      case 'OPTIMIZE_IMAGE': {
        const { buffer, preset, preserveResolution, useWebP } = payload;
        ImageMagick.read(new Uint8Array(buffer), (img) => {
          const originalFormat = img.format;
          const targetFormat = useWebP ? MagickFormat.WebP : originalFormat;

          if (!preserveResolution) {
            const geom = new MagickGeometry(`${preset.maxWidthOrHeight}x${preset.maxWidthOrHeight}>`);
            img.resize(geom);
          }
          img.strip();

          if (preset.id === 'lossless') {
            if (useWebP) {
              img.settings.setDefine(MagickFormat.WebP, 'lossless', 'true');
              img.quality = 100;
            } else if (!isLosslessFormat(originalFormat)) {
              const originalQuality = img.quality;
              img.quality = originalQuality > 0 ? originalQuality : 92;
            }
          } else {
            const targetQuality = Math.round(preset.quality * 100);
            if (useWebP) {
              img.settings.setDefine(MagickFormat.WebP, 'lossless', 'false');
              img.quality = targetQuality;
            } else if (!isLosslessFormat(originalFormat)) {
              img.quality = targetQuality;
            }
          }
          
          img.write(targetFormat, (outBuffer) => {
            const returnBuffer = new Uint8Array(outBuffer).buffer;
            self.postMessage({ id, result: returnBuffer }, [returnBuffer]);
          });
        });
        break;
      }

      case 'ROTATE_FLIP': {
        const { buffer, rotation, flipHorizontal, flipVertical } = payload;
        ImageMagick.read(new Uint8Array(buffer), (img) => {
          if (rotation !== 0) {
            img.rotate(rotation);
          }
          if (flipHorizontal) {
            img.flop();
          }
          if (flipVertical) {
            img.flip();
          }
          const format = img.format;
          if (!isLosslessFormat(format) && (!img.quality || img.quality <= 0)) {
            img.quality = 92;
          }
          img.write(format, (outBuffer) => {
            const returnBuffer = new Uint8Array(outBuffer).buffer;
            // Además del buffer, indicamos el mimeType resultante si es necesario
            self.postMessage({ id, result: returnBuffer }, [returnBuffer]);
          });
        });
        break;
      }

      case 'CROP_IMAGE': {
        const { buffer, cropX, cropY, cropWidth, cropHeight } = payload;
        ImageMagick.read(new Uint8Array(buffer), (img) => {
          const geometry = new MagickGeometry(cropX, cropY, cropWidth, cropHeight);
          img.crop(geometry);
          img.quality = img.quality && img.quality > 0 ? img.quality : 92;
          img.write(img.format, (outBuffer) => {
            const returnBuffer = new Uint8Array(outBuffer).buffer;
            self.postMessage({ id, result: { buffer: returnBuffer, format: img.format } }, [returnBuffer]);
          });
        });
        break;
      }

      default:
        throw new Error(`Acción desconocida: ${action}`);
    }
  } catch (error: any) {
    self.postMessage({ id, error: error.message || 'Error en el worker de ImageMagick' });
  }
};
