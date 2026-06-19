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
  const { action, id, file, angle, fineAngle, flipH, flipV } = e.data;

  if (action === 'init') {
    try {
      await getVips();
      self.postMessage({ type: 'initialized' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Vips initialization error:', message);
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
        console.error('File read error (possibly deleted from disk):', message);
        self.postMessage({ 
          type: 'process_error', 
          id, 
          code: 'FILE_NOT_FOUND', 
          message: 'No se pudo encontrar el archivo original sobre el que se está trabajando.' 
        });
        return;
      }

      const u8Array = new Uint8Array(arrayBuffer);
      const isGif = file.name.substring(file.name.lastIndexOf('.')).toLowerCase() === '.gif';
      let image = vips.Image.newFromBuffer(u8Array, isGif ? 'n=-1' : '');

      let nPages = 1;
      let pageHeight = image.height;
      try {
        if (image.getTypeof('n-pages') !== 0) {
          nPages = image.getInt('n-pages');
        }
        if (image.getTypeof('page-height') !== 0) {
          pageHeight = image.getInt('page-height');
        }
      } catch (err) {
        console.warn('Failed to read n-pages or page-height metadata', err);
      }

      if (nPages > 1) {
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
          console.warn('Failed to read delay or loop metadata', err);
        }

        const processedPages: any[] = [];
        for (let i = 0; i < nPages; i++) {
          let page = image.crop(0, i * pageHeight, image.width, pageHeight);
          
          // 1. Aplicar rotación rápida
          if (angle === 90) {
            const rotated = page.rot(vips.Angle.d90);
            page.delete();
            page = rotated;
          } else if (angle === 180) {
            const rotated = page.rot(vips.Angle.d180);
            page.delete();
            page = rotated;
          } else if (angle === 270) {
            const rotated = page.rot(vips.Angle.d270);
            page.delete();
            page = rotated;
          }

          // 2. Aplicar rotación fina
          if (fineAngle && fineAngle !== 0) {
            const hasAlpha = page.hasAlpha();
            let targetPage = page;
            if (!hasAlpha) {
              targetPage = page.addalpha();
              page.delete();
            }
            const rotated = targetPage.rotate(fineAngle);
            targetPage.delete();
            page = rotated;
          }

          // 3. Aplicar volteo
          if (flipH) {
            const flipped = page.flip(vips.Direction.horizontal);
            page.delete();
            page = flipped;
          }

          if (flipV) {
            const flipped = page.flip(vips.Direction.vertical);
            page.delete();
            page = flipped;
          }

          processedPages.push(page);
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
        // 1. Aplicar rotación rápida (lossless de 90/180/270 grados)
        if (angle === 90) {
          const rotated = image.rot(vips.Angle.d90);
          image.delete();
          image = rotated;
        } else if (angle === 180) {
          const rotated = image.rot(vips.Angle.d180);
          image.delete();
          image = rotated;
        } else if (angle === 270) {
          const rotated = image.rot(vips.Angle.d270);
          image.delete();
          image = rotated;
        }

        // 2. Aplicar rotación fina (ángulo arbitrario en grados)
        if (fineAngle && fineAngle !== 0) {
          const hasAlpha = image.hasAlpha();
          let targetImage = image;
          if (!hasAlpha) {
            targetImage = image.addalpha();
            image.delete();
          }
          const rotated = targetImage.rotate(fineAngle);
          targetImage.delete();
          image = rotated;
        }

        // 3. Aplicar volteo (horizontal y vertical)
        if (flipH) {
          const flipped = image.flip(vips.Direction.horizontal);
          image.delete();
          image = flipped;
        }

        if (flipV) {
          const flipped = image.flip(vips.Direction.vertical);
          image.delete();
          image = flipped;
        }
      }

      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      let format = '.png';
      let mimeType = 'image/png';
      
      if (['.jpg', '.jpeg'].includes(extension)) {
        format = '.jpg';
        mimeType = 'image/jpeg';
        // Si la imagen tiene transparencia (por ejemplo, después de una rotación fina), la aplanamos con fondo blanco para JPG
        if (image.hasAlpha()) {
          const flattened = image.flatten({ background: [255, 255, 255] });
          image.delete();
          image = flattened;
        }
      } else if (extension === '.webp') {
        format = '.webp';
        mimeType = 'image/webp';
      } else if (extension === '.gif') {
        format = '.gif';
        mimeType = 'image/gif';
      }

      const outBuffer = image.writeToBuffer(format) as Uint8Array;
      image.delete();

      const resultBlob = new Blob([outBuffer as BlobPart], { type: mimeType });
      self.postMessage({ type: 'result', id, blob: resultBlob });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Image processing error:', message);
      self.postMessage({ 
        type: 'process_error', 
        id, 
        code: 'UNKNOWN_ERROR', 
        message: 'Ocurrió un error desconocido al procesar la imagen.' 
      });
    }
  }
};
