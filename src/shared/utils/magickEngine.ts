let worker: Worker | null = null;
let messageIdCounter = 0;
const callbacks = new Map<number, { resolve: (val: any) => void, reject: (err: any) => void }>();

/**
 * Inicializa el Worker si no existe.
 */
const getWorker = (): Worker => {
  if (!worker) {
    worker = new Worker(new URL('../workers/magick.worker.ts', import.meta.url), { type: 'module' });
    
    worker.onmessage = (e) => {
      const { id, result, error } = e.data;
      if (callbacks.has(id)) {
        const { resolve, reject } = callbacks.get(id)!;
        if (error) reject(new Error(error));
        else resolve(result);
        callbacks.delete(id);
      }
    };

    worker.onerror = (e) => {
      console.error("Worker Error:", e);
    };
  }
  return worker;
};

/**
 * Ejecuta una tarea en el worker de ImageMagick.
 * @param action Acción a realizar (ej. 'CONVERT_IMAGE')
 * @param payload Datos necesarios para la acción
 * @param transferables (Opcional) ArrayBuffers para transferir (zero-copy)
 */
export const runMagickTask = (action: string, payload: any, transferables: Transferable[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    const id = ++messageIdCounter;
    callbacks.set(id, { resolve, reject });
    
    const w = getWorker();
    w.postMessage({ id, action, payload }, transferables);
  });
};

/**
 * Pre-inicializa el Worker si es necesario (opcional)
 */
export const initMagickEngine = async (): Promise<void> => {
  getWorker();
  return Promise.resolve();
};
