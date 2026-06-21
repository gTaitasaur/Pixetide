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
  const { action, id, file, crop } = e.data;

  if (action === 'init') {
    try {
      await getVips();
      self.postMessage({ type: 'initialized' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Vips initialization error in crop worker:', message);
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
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const isGif = extension === '.gif';
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
        console.warn('Failed to read n-pages or page-height metadata in crop worker', err);
      }

      // El crop viene en porcentajes (0-100)
      const { x: pctX, y: pctY, width: pctW, height: pctH } = crop;

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
          console.warn('Failed to read delay or loop metadata in crop worker', err);
        }

        // Calcular coordenadas en base al frame unitario (pageHeight)
        let realX = Math.round((pctX / 100) * image.width);
        let realY = Math.round((pctY / 100) * pageHeight);
        let realW = Math.round((pctW / 100) * image.width);
        let realH = Math.round((pctH / 100) * pageHeight);

        // Contención física para evitar errores Wasm en libvips
        realX = Math.max(0, Math.min(realX, image.width - 1));
        realY = Math.max(0, Math.min(realY, pageHeight - 1));
        realW = Math.max(1, Math.min(realW, image.width - realX));
        realH = Math.max(1, Math.min(realH, pageHeight - realY));

        const processedPages: InstanceType<VipsType['Image']>[] = [];
        for (let i = 0; i < nPages; i++) {
          const page = image.crop(0, i * pageHeight, image.width, pageHeight);
          const croppedPage = page.crop(realX, realY, realW, realH);
          page.delete();
          processedPages.push(croppedPage);
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
        // Calcular coordenadas reales en base al tamaño total
        let realX = Math.round((pctX / 100) * image.width);
        let realY = Math.round((pctY / 100) * image.height);
        let realW = Math.round((pctW / 100) * image.width);
        let realH = Math.round((pctH / 100) * image.height);

        // Contención física para evitar errores Wasm en libvips
        realX = Math.max(0, Math.min(realX, image.width - 1));
        realY = Math.max(0, Math.min(realY, image.height - 1));
        realW = Math.max(1, Math.min(realW, image.width - realX));
        realH = Math.max(1, Math.min(realH, image.height - realY));

        const cropped = image.crop(realX, realY, realW, realH);
        image.delete();
        image = cropped;
      }

      // Resolver formato final
      let format = '.png';
      let mimeType = 'image/png';
      
      if (['.jpg', '.jpeg'].includes(extension)) {
        format = '.jpg';
        mimeType = 'image/jpeg';
        // Aplanar transparencia para JPEG
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
      console.error('Image processing error in crop worker:', message);
      self.postMessage({ 
        type: 'process_error', 
        id, 
        code: 'UNKNOWN_ERROR', 
        message: 'Ocurrió un error desconocido al procesar la imagen.' 
      });
    }
  }
};
