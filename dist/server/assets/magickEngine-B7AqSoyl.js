let worker = null;
let messageIdCounter = 0;
const callbacks = /* @__PURE__ */ new Map();
const getWorker = () => {
  if (!worker) {
    worker = new Worker(new URL("../workers/magick.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e) => {
      const { id, result, error } = e.data;
      if (callbacks.has(id)) {
        const { resolve, reject } = callbacks.get(id);
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
const runMagickTask = (action, payload, transferables = []) => {
  return new Promise((resolve, reject) => {
    const id = ++messageIdCounter;
    callbacks.set(id, { resolve, reject });
    const w = getWorker();
    w.postMessage({ id, action, payload }, transferables);
  });
};
export {
  runMagickTask as r
};
