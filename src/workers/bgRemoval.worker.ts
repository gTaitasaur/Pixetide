import { removeBackground, preload, Config } from "@imgly/background-removal";

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
      const blob = await removeBackground(file, config);
      self.postMessage({ type: 'result', blob });
    } catch (err: any) {
      self.postMessage({ type: 'error', message: err.message || 'Error processing' });
    }
  }
};
