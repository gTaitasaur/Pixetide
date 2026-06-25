import Vips from 'wasm-vips';

type VipsType = Awaited<ReturnType<typeof Vips>>;
let vipsInstance: VipsType | null = null;

async function getVips(): Promise<VipsType> {
  if (!vipsInstance) {
    vipsInstance = await Vips({
      locateFile: (fileName: string) => {
        if (fileName.endsWith('.wasm')) {
          return `/${fileName}`;
        }
        return fileName;
      }
    });
  }
  return vipsInstance;
}

// Codificador BMP de 24 bits manual en JS (Plan de respaldo ante falta de bmpsave en wasm-vips)
function encodeBMP(image: any): Uint8Array {
  let workingImg = image;
  if (workingImg.bands !== 3 && workingImg.bands !== 4) {
    workingImg = workingImg.colourspace('srgb');
  }
  
  const width = workingImg.width;
  const height = workingImg.height;
  const bands = workingImg.bands;
  
  const rawBytes = workingImg.writeToBuffer('.raw') as Uint8Array;
  
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;
  
  const fileBuffer = new Uint8Array(fileSize);
  const view = new DataView(fileBuffer.buffer);
  
  // Cabecera de Archivo BMP (14 bytes)
  fileBuffer[0] = 0x42; // 'B'
  fileBuffer[1] = 0x4D; // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, 54, true);
  
  // DIB Header (BITMAPINFOHEADER - 40 bytes)
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // Alto (positivo = de abajo hacia arriba)
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);    // 24 bits por píxel (RGB)
  view.setUint32(30, 0, true);     // Sin compresión
  view.setUint32(34, pixelDataSize, true);
  view.setInt32(38, 2835, true);   // 72 DPI
  view.setInt32(42, 2835, true);   // 72 DPI
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);
  
  // Escribir datos BGR de abajo hacia arriba
  for (let y = 0; y < height; y++) {
    const fileRow = (height - 1) - y;
    const rowOffset = 54 + fileRow * rowSize;
    let colOffset = 0;
    
    for (let x = 0; x < width; x++) {
      const rawIdx = (y * width + x) * bands;
      const r = rawBytes[rawIdx];
      const g = rawBytes[rawIdx + 1];
      const b = rawBytes[rawIdx + 2];
      
      const writeIdx = rowOffset + colOffset;
      fileBuffer[writeIdx] = b;
      fileBuffer[writeIdx + 1] = g;
      fileBuffer[writeIdx + 2] = r;
      colOffset += 3;
    }
  }
  
  if (workingImg !== image) {
    workingImg.delete();
  }
  
  return fileBuffer;
}

// Empaquetador ICO manual en JS dinámico que genera un archivo .ico a partir de una lista personalizada de buffers y tamaños PNG
function encodeICO(pngs: Uint8Array[], sizes: number[]): Uint8Array {
  const headerSize = 6;
  const directorySize = 16 * pngs.length;
  
  // Calcular offsets
  const offsets: number[] = [];
  let currentOffset = headerSize + directorySize;
  for (let i = 0; i < pngs.length; i++) {
    offsets.push(currentOffset);
    currentOffset += pngs[i].length;
  }
  
  const totalSize = currentOffset;
  const fileBuffer = new Uint8Array(totalSize);
  const view = new DataView(fileBuffer.buffer);
  
  // Cabecera (6 bytes)
  view.setUint16(0, 0, true);           // Reservado
  view.setUint16(2, 1, true);           // Tipo (1 = ICO)
  view.setUint16(4, pngs.length, true); // Número de imágenes
  
  // Directorio de imágenes (16 bytes por entrada)
  for (let i = 0; i < pngs.length; i++) {
    const entryOffset = headerSize + i * 16;
    
    // Si la dimensión es >= 256, se escribe 0 en el campo de 1 byte de ancho/alto
    fileBuffer[entryOffset + 0] = sizes[i] >= 256 ? 0 : sizes[i]; 
    fileBuffer[entryOffset + 1] = sizes[i] >= 256 ? 0 : sizes[i];
    fileBuffer[entryOffset + 2] = 0;        // Cantidad de colores (0 = TrueColor)
    fileBuffer[entryOffset + 3] = 0;        // Reservado
    view.setUint16(entryOffset + 4, 1, true);   // Planos de color (1)
    view.setUint16(entryOffset + 6, 32, true);  // Bits por píxel (32 = RGBA)
    view.setUint32(entryOffset + 8, pngs[i].length, true); // Tamaño de datos PNG
    view.setUint32(entryOffset + 12, offsets[i], true);    // Desplazamiento
  }
  
  // Escribir datos binarios PNG
  for (let i = 0; i < pngs.length; i++) {
    fileBuffer.set(pngs[i], offsets[i]);
  }
  
  return fileBuffer;
}

/**
 * Umbral máximo de megapíxeles para AVIF antes de reducir resolución.
 * El codificador AVIF consume ~50x los píxeles en memoria de trabajo,
 * por lo que 8 MP (~3264×2448) es un límite seguro para entornos WASM de 32 bits.
 */
const AVIF_MAX_MEGAPIXELS = 8;

/**
 * Normaliza la imagen a un espacio de color adecuado para la exportación.
 * Evita problemas con imágenes indexadas (paletizadas) o en CMYK.
 */
function ensureExportableColorspace(img: any): any {
  const interp = img.interpretation;
  // Imágenes paletizadas, CMYK o con interpretación inválida
  // se convierten a sRGB para que los codificadores funcionen correctamente.
  if (
    interp === 'srgb' ||
    interp === 'scrgb' ||
    interp === 'rgb' ||
    interp === 'rgb16' ||
    interp === 'b-w' ||
    interp === 'grey16'
  ) {
    return img;
  }
  const converted = img.colourspace('srgb');
  if (converted !== img) {
    img.delete();
  }
  return converted;
}

self.onmessage = async (e: MessageEvent) => {
  const { action, id, file, targetFormat, bgColor, icoSizes } = e.data;

  if (action === 'init') {
    try {
      await getVips();
      self.postMessage({ type: 'initialized' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Vips initialization error in converter worker:', message);
      self.postMessage({ 
        type: 'init_error', 
        message: 'Ocurrió un error desconocido al inicializar el procesador de imágenes.' 
      });
    }
    return;
  }

  if (action === 'process') {
    try {
      const vips = await getVips();
      
      let arrayBuffer: ArrayBuffer;
      try {
        arrayBuffer = await file.arrayBuffer() as ArrayBuffer;
      } catch (fileErr) {
        const message = fileErr instanceof Error ? fileErr.message : String(fileErr);
        console.error('File read error in converter worker:', message);
        self.postMessage({ 
          type: 'process_error', 
          id, 
          code: 'FILE_NOT_FOUND', 
          message: 'No se pudo encontrar el archivo original sobre el que se está trabajando.' 
        });
        return;
      }

      const u8Array = new Uint8Array(arrayBuffer);
      const srcExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const isGifSrc = srcExt === '.gif';
      
      let extension = targetFormat.toLowerCase();
      if (!extension.startsWith('.')) {
        extension = `.${extension}`;
      }
      if (extension === '.jpeg') {
        extension = '.jpg';
      }

      const isGifDest = extension === '.gif';
      // Solo mantenemos la animación si el origen Y destino son GIF
      const keepAnimation = isGifSrc && isGifDest;

      // ─── CARGA DE LA IMAGEN ───
      // Si es GIF animado y el destino es GIF, cargamos todos los frames con n=-1.
      // En cualquier otro caso, cargamos solo el primer frame (comportamiento por defecto).
      let image = vips.Image.newFromBuffer(u8Array, keepAnimation ? 'n=-1' : '');

      // Normalizar espacio de color para evitar problemas con imágenes
      // paletizadas (GIF), CMYK u otros espacios incompatibles con los codificadores
      image = ensureExportableColorspace(image);

      let nPages = 1;
      let pageHeight = image.height;
      if (keepAnimation) {
        try {
          if (image.getTypeof('n-pages') !== 0) {
            nPages = image.getInt('n-pages');
          }
          if (image.getTypeof('page-height') !== 0) {
            pageHeight = image.getInt('page-height');
          }
        } catch (err) {
          console.warn('Failed to read n-pages or page-height metadata in converter', err);
        }
      }

      let mimeType = 'image/png';
      if (extension === '.jpg') {
        mimeType = 'image/jpeg';
      } else if (extension === '.webp') {
        mimeType = 'image/webp';
      } else if (extension === '.gif') {
        mimeType = 'image/gif';
      } else if (extension === '.png') {
        mimeType = 'image/png';
      } else if (extension === '.avif') {
        mimeType = 'image/avif';
      } else if (extension === '.tiff' || extension === '.tif') {
        mimeType = 'image/tiff';
      } else if (extension === '.bmp') {
        mimeType = 'image/bmp';
      } else if (extension === '.ico') {
        mimeType = 'image/x-icon';
      }


      // Función helper para procesar transparencias por página
      const processAlphaAndFormat = (img: any): any => {
        let current = img;
        // JPG y BMP no soportan transparencia — aplanamos con color de fondo
        if (extension === '.jpg' || extension === '.bmp') {
          if (current.hasAlpha()) {
            const bgPixel = bgColor === 'black' ? [0, 0, 0] : [255, 255, 255];
            const flattened = current.flatten({ background: bgPixel });
            current.delete();
            current = flattened;
          }
        }
        // GIF no soporta semitransparencia (solo 1 bit de alfa).
        // Para obtener mejores resultados al convertir a GIF desde formatos RGBA,
        // aplanamos la transparencia con fondo blanco o el color seleccionado.
        if (isGifDest && !isGifSrc) {
          if (current.hasAlpha()) {
            const bgPixel = bgColor === 'black' ? [0, 0, 0] : [255, 255, 255];
            const flattened = current.flatten({ background: bgPixel });
            current.delete();
            current = flattened;
          }
        }
        return current;
      };

      if (keepAnimation && nPages > 1) {
        // ─── PROCESAMIENTO DE GIF ANIMADO (GIF→GIF) ───
        let delayArray: number[] | null = null;
        let loopCount: number | null = null;
        try {
          if (image.getTypeof('delay') !== 0) {
            delayArray = image.getArrayInt('delay');
          }
          if (image.getTypeof('loop') !== 0) {
            loopCount = image.getInt('loop');
          }
        } catch (err) {
          console.warn('Failed to read delay or loop metadata in converter', err);
        }

        const processedPages: any[] = [];
        for (let i = 0; i < nPages; i++) {
          const page = image.crop(0, i * pageHeight, image.width, pageHeight);
          const processedPage = processAlphaAndFormat(page);
          processedPages.push(processedPage);
        }

        const joined = vips.Image.arrayjoin(processedPages, { across: 1 });
        const newPageHeight = processedPages[0].height;
        processedPages.forEach(p => p.delete());

        joined.setInt('page-height', newPageHeight);
        joined.setInt('n-pages', nPages);
        if (delayArray) {
          joined.setArrayInt('delay', delayArray);
        }
        if (loopCount !== null) {
          joined.setInt('loop', loopCount);
        }

        image.delete();
        image = joined;
      } else {
        // ─── PROCESAMIENTO DE IMAGEN ESTÁTICA (cualquier combinación no-animada) ───
        image = processAlphaAndFormat(image);
      }

      // ─── EXPORTACIÓN ───
      let outBuffer: Uint8Array;
      if (extension === '.bmp') {
        outBuffer = encodeBMP(image);
      } else if (extension === '.ico') {
        let icoImg = image;
        let createdAlpha = false;
        
        // 1. Garantizar canal alfa para soportar transparencias en favicon
        if (!icoImg.hasAlpha()) {
          const alpha = vips.Image.black(icoImg.width, icoImg.height).add(255);
          try {
            icoImg = icoImg.bandjoin(alpha);
            createdAlpha = true;
          } finally {
            alpha.delete();
          }
        }
        
        try {
          const sizes = (Array.isArray(icoSizes) && icoSizes.length > 0) ? icoSizes : [16, 32, 48];
          const pngBuffers: Uint8Array[] = [];
          
          for (const size of sizes) {
            const scale = Math.min(size / icoImg.width, size / icoImg.height);
            const resized = icoImg.resize(scale);
            
            try {
              const left = Math.floor((size - resized.width) / 2);
              const top = Math.floor((size - resized.height) / 2);
              
              const embedded = resized.embed(left, top, size, size, {
                extend: 'background',
                background: [0, 0, 0, 0]
              });
              
              try {
                const pngBuf = embedded.writeToBuffer('.png') as Uint8Array;
                pngBuffers.push(pngBuf);
              } finally {
                embedded.delete();
              }
            } finally {
              resized.delete();
            }
          }
          
          outBuffer = encodeICO(pngBuffers, sizes);
        } finally {
          if (createdAlpha) {
            icoImg.delete();
          }
        }
      } else if (extension === '.avif') {
        // AVIF: El codificador AV1 consume mucha memoria (~50× megapíxeles).
        // Para imágenes muy grandes, reducimos resolución para evitar OOM.
        const megapixels = (image.width * image.height) / 1_000_000;
        let avifImage = image;
        if (megapixels > AVIF_MAX_MEGAPIXELS) {
          const scale = Math.sqrt(AVIF_MAX_MEGAPIXELS / megapixels);
          const resized = image.resize(scale);
          image.delete();
          avifImage = resized;
          image = avifImage; // Actualizar referencia para limpieza posterior
        }

        try {
          // Primer intento: calidad 65, velocidad 7 (balance calidad/rendimiento)
          outBuffer = avifImage.writeToBuffer('.avif', { Q: 65, speed: 7 }) as Uint8Array;
        } catch (avifErr) {
          console.warn('AVIF encoding failed with Q:65 speed:7, retrying with lower settings:', avifErr);
          try {
            // Segundo intento: calidad reducida, velocidad máxima (mínimo consumo de memoria)
            outBuffer = avifImage.writeToBuffer('.avif', { Q: 50, speed: 9 }) as Uint8Array;
          } catch (avifErr2) {
            console.error('AVIF encoding failed on retry:', avifErr2);
            avifImage.delete();
            self.postMessage({
              type: 'process_error',
              id,
              code: 'ENCODING_FAILED',
              message: 'No se pudo codificar la imagen en formato AVIF. La imagen puede ser demasiado grande.'
            });
            return;
          }
        }
      } else if (isGifDest && !isGifSrc) {
        // Conversión de formato estático → GIF
        // GIF encoding (cgif) consume mucha memoria y puede causar OOM en WASM
        // Limitamos a ~3 megapíxeles para conversiones estáticas a GIF
        const megapixels = (image.width * image.height) / 1_000_000;
        let gifImage = image;
        if (megapixels > 3) {
          const scale = Math.sqrt(3 / megapixels);
          const resized = gifImage.resize(scale);
          gifImage = resized;
          image.delete(); // limpiamos la original
          image = gifImage;
        }

        // Aseguramos que no tenga alfa (aplanamos con el fondo)
        if (gifImage.hasAlpha()) {
          const bgPixel = bgColor === 'black' ? [0, 0, 0] : [255, 255, 255];
          const flattened = gifImage.flatten({ background: bgPixel });
          gifImage.delete();
          gifImage = flattened;
          image = gifImage;
        }

        try {
          outBuffer = gifImage.writeToBuffer('.gif') as Uint8Array;
        } catch (gifErr) {
          console.warn('GIF encode failed, attempting fallback (uchar/srgb):', gifErr);
          let safeGif = gifImage;
          if (safeGif.format !== 'uchar') {
            const casted = safeGif.cast('uchar');
            safeGif = casted;
          }
          if (safeGif.interpretation !== 'srgb' && safeGif.interpretation !== 'b-w') {
            const converted = safeGif.colourspace('srgb');
            if (safeGif !== gifImage) safeGif.delete();
            safeGif = converted;
          }
          
          outBuffer = safeGif.writeToBuffer('.gif') as Uint8Array;
          
          if (safeGif !== gifImage) {
            safeGif.delete();
          }
        }
      } else {
        outBuffer = image.writeToBuffer(extension) as Uint8Array;
      }
      image.delete();

      const resultBlob = new Blob([outBuffer as BlobPart], { type: mimeType });
      
      self.postMessage({ 
        type: 'result', 
        id, 
        blob: resultBlob,
        size: resultBlob.size
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Image processing error in converter worker:', message);
      self.postMessage({ 
        type: 'process_error', 
        id, 
        code: 'UNKNOWN_ERROR', 
        message: 'Ocurrió un error desconocido al convertir la imagen.' 
      });
    }
  }
};

