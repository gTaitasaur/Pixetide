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

self.onmessage = async (e: MessageEvent) => {
  const { action, id, file, presetId, quality, keepDimensions, webpFormat } = e.data;

  if (action === 'init') {
    try {
      await getVips();
      self.postMessage({ type: 'initialized' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Vips initialization error in optimizer worker:', message);
      self.postMessage({ 
        type: 'init_error', 
        message: 'Ocurrió un error desconocido.' 
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
        console.error('File read error in optimizer worker:', message);
        self.postMessage({ 
          type: 'process_error', 
          id, 
          code: 'FILE_NOT_FOUND', 
          message: 'No se pudo encontrar el archivo original sobre el que se está trabajando.' 
        });
        return;
      }

      const u8Array = new Uint8Array(arrayBuffer);
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      // Intentamos cargar la imagen
      let image: InstanceType<VipsType['Image']>;
      try {
        image = vips.Image.newFromBuffer(u8Array, extension === '.gif' ? 'n=-1' : '');
      } catch (loadErr) {
        console.error('Error loading image in Vips:', loadErr);
        self.postMessage({
          type: 'process_error',
          id,
          code: 'LOAD_ERROR',
          message: 'Error al abrir la imagen en el procesador.'
        });
        return;
      }

      const originalWidth = image.width;
      const originalHeight = image.height;

      // 1. Redimensionar si keepDimensions es falso y supera el límite de 1920px (Web standard optimization)
      if (!keepDimensions) {
        const maxDimension = 1920;
        let nPages = 1;
        try {
          if (image.getTypeof('n-pages') !== 0) {
            nPages = image.getInt('n-pages');
          }
        } catch (e) {
          // No es un GIF multi-página
        }

        const isAnimated = nPages > 1;
        const pageHeight = isAnimated ? image.getInt('page-height') : originalHeight;

        if (originalWidth > maxDimension || pageHeight > maxDimension) {
          const scale = maxDimension / Math.max(originalWidth, pageHeight);
          const targetH = Math.round(pageHeight * scale);

          if (isAnimated) {
            // Animaciones GIF con toilet roll format
            const processedPages: InstanceType<VipsType['Image']>[] = [];
            for (let i = 0; i < nPages; i++) {
              const page = image.crop(0, i * pageHeight, originalWidth, pageHeight);
              const resizedPage = page.resize(scale);
              page.delete();
              processedPages.push(resizedPage);
            }

            const joined = vips.Image.arrayjoin(processedPages, { across: 1 });
            processedPages.forEach(p => p.delete());

            // Reinyectar metadatos
            joined.setInt('page-height', targetH);
            joined.setInt('n-pages', nPages);
            try {
              if (image.getTypeof('delay') !== 0) joined.setArrayInt('delay', image.getArrayInt('delay'));
              if (image.getTypeof('loop') !== 0) joined.setInt('loop', image.getInt('loop'));
            } catch (metaErr) {
              console.warn('Failed to preserve animation metadata', metaErr);
            }

            image.delete();
            image = joined;
          } else {
            // Imagen estática común
            const resized = image.resize(scale);
            image.delete();
            image = resized;
          }
        }
      }

      // 2. Determinar formato de entrada y si es lossy por naturaleza
      const isSourceLossy = ['.jpg', '.jpeg'].includes(extension);

      // 3. Determinar formato final y opciones de compresión
      let format = '.png';
      let mimeType = 'image/png';
      let options: Record<string, any> = { strip: true };

      if (webpFormat) {
        // ─── Forzar WebP ───
        format = '.webp';
        mimeType = 'image/webp';
        options.effort = 4;

        if (presetId === 'lossless') {
          if (isSourceLossy) {
            // JPG → WebP: usar Q=100 "near-lossless" en vez de lossless verdadero.
            // ¿Por qué? Un JPG ya tiene artefactos de compresión con pérdida.
            // WebP lossless almacena CADA píxel de esos artefactos literalmente,
            // generando archivos enormes (a veces 3-4x el original) y tiempos
            // de cómputo excesivos. Q=100 lossy preserva la calidad visual al
            // 100% pero permite al codec WebP comprimir eficientemente.
            options.Q = 100;
          } else {
            // PNG, WebP u otros formatos sin pérdida: lossless verdadero es correcto
            options.lossless = true;
          }
        } else {
          options.Q = quality;
        }

        // Si la fuente es JPEG y tiene canal alfa (raro pero posible con formatos extendidos),
        // aplanar antes de convertir a WebP lossy para evitar artefactos de transparencia
        if (isSourceLossy && !options.lossless && image.hasAlpha()) {
          const flattened = image.flatten({ background: [255, 255, 255] });
          image.delete();
          image = flattened;
        }

      } else if (isSourceLossy) {
        // ─── Mantener formato JPEG ───
        format = '.jpg';
        mimeType = 'image/jpeg';
        options.Q = presetId === 'lossless' ? 100 : quality;

        // Aplanar transparencia para JPEG (no soporta canal alfa)
        if (image.hasAlpha()) {
          const flattened = image.flatten({ background: [255, 255, 255] });
          image.delete();
          image = flattened;
        }

      } else if (extension === '.webp') {
        // ─── WebP original sin forzar conversión ───
        format = '.webp';
        mimeType = 'image/webp';
        options.effort = 4;
        if (presetId === 'lossless') {
          options.lossless = true;
        } else {
          options.Q = quality;
        }

      } else if (extension === '.gif') {
        // ─── GIF ───
        format = '.gif';
        mimeType = 'image/gif';
        // Libvips no tiene cuantización directa para gif

      } else {
        // ─── PNG (formato por defecto) ───
        format = '.png';
        mimeType = 'image/png';
        if (presetId !== 'lossless') {
          // Cuantización de color para PNG (TinyPNG compression style)
          options.palette = true;
          options.Q = quality;
        } else {
          options.compression = 9;
        }
      }

      // 4. Escribir al buffer de salida
      let outBuffer: Uint8Array;
      try {
        outBuffer = image.writeToBuffer(format, options) as Uint8Array;
      } catch (writeErr) {
        console.error('Error writing buffer in optimizer worker:', writeErr);
        // Fallback: intentar sin opciones avanzadas
        try {
          const fallbackOptions: Record<string, any> = { strip: true };
          if (format === '.webp') {
            fallbackOptions.Q = 90;
            fallbackOptions.effort = 2;
          }
          outBuffer = image.writeToBuffer(format, fallbackOptions) as Uint8Array;
        } catch {
          // Último recurso: exportar en formato original sin opciones
          outBuffer = image.writeToBuffer(extension) as Uint8Array;
        }
      }
      
      image.delete();

      // 5. Comparar tamaños y decidir qué devolver
      const isOriginalWebp = extension === '.webp';
      let isSavingOriginal = false;
      let finalBlob: Blob;

      if (webpFormat) {
        if (isOriginalWebp) {
          // Si el original ya era WebP y no logramos bajar el peso, devolvemos el archivo original
          if (outBuffer.byteLength >= file.size) {
            finalBlob = file;
            isSavingOriginal = true;
          } else {
            finalBlob = new Blob([outBuffer as BlobPart], { type: 'image/webp' });
          }
        } else {
          // El original NO era WebP. Como el usuario forzó WebP, devolvemos obligatoriamente el buffer WebP
          finalBlob = new Blob([outBuffer as BlobPart], { type: 'image/webp' });
          // Informativo: si el WebP resultó más grande que el original
          isSavingOriginal = outBuffer.byteLength >= file.size;
        }
      } else {
        // Sin forzar WebP: si no mejoramos el peso, devolvemos el original
        if (outBuffer.byteLength >= file.size) {
          finalBlob = file;
          isSavingOriginal = true;
        } else {
          finalBlob = new Blob([outBuffer as BlobPart], { type: mimeType });
        }
      }

      self.postMessage({
        type: 'result',
        id,
        blob: finalBlob,
        size: finalBlob.size,
        isSavingOriginal
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Error processing image in optimizer worker:', message);
      self.postMessage({ 
        type: 'process_error', 
        id, 
        code: 'UNKNOWN_ERROR', 
        message: 'Ocurrió un error desconocido al optimizar la imagen.' 
      });
    }
  }
};
