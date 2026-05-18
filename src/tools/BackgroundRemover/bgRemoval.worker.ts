import { removeBackground, preload, Config } from "@imgly/background-removal";

// Función de post-procesado para limpiar el canal alfa (ghosting/artefactos)
const postProcessMask = async (blob: Blob): Promise<Blob> => {
  try {
    // Si OffscreenCanvas no está soportado (Safari antiguo), devolvemos el original
    if (typeof OffscreenCanvas === 'undefined') return blob;

    const bmp = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return blob;

    ctx.drawImage(bmp, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Limpieza de bordes:
    // Elimina rastros tenues (alpha < 60) y solidifica opacos (alpha > 200)
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 60) {
        data[i + 3] = 0; // Transparencia total a sombras débiles
      } else if (a > 200) {
        data[i + 3] = 255; // Opacidad total al sujeto principal
      } else {
        // Suavizado (anti-aliasing) para los bordes medios
        data[i + 3] = Math.round(((a - 60) / 140) * 255);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return await canvas.convertToBlob({ type: 'image/png' });
  } catch (err) {
    console.error("Error en post-procesado, usando imagen original", err);
    return blob; // Fallback al original si algo falla
  }
};

// Manejador de mensajes desde el hilo principal
self.onmessage = async (e) => {
  const { action, file } = e.data;

  const config: Config = {
    model: 'isnet_fp16',
    progress: (key) => {
      // Si se están descargando modelos o binarios wasm, avisamos al hilo principal
      if (key.includes('model') || key.includes('wasm')) {
        self.postMessage({ type: 'progress', key });
      }
    }
  };

  if (action === 'preload') {
    try {
      await preload(config);
      self.postMessage({ type: 'preloaded' });
    } catch (err: any) {
      self.postMessage({ type: 'error', message: err.message || 'Error preloading' });
    }
  } 

  else if (action === 'remove') {
    try {
      const rawBlob = await removeBackground(file, config);
      const cleanedBlob = await postProcessMask(rawBlob);
      
      self.postMessage({ type: 'result', blob: cleanedBlob });
    } catch (err: any) {
      self.postMessage({ type: 'error', message: err.message || 'Error processing' });
    }
  }
};
