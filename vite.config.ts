import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  server: {
    host: true,
    allowedHosts: true,
  },
  /**
   * Configuración SSR para prerendering.
   *
   * ¿Por qué externalizar estos paquetes?
   * Durante el SSR build, Vite intenta bundlear todo en un solo archivo.
   * Pero estos paquetes tienen dependencias nativas (.node bindings) o
   * usan APIs del navegador (canvas, WebGL, WASM) que no existen en Node.js.
   *
   * Al externalizarlos, Vite los deja como `require()` en vez de bundlearlos.
   * Como el prerender script tiene try/catch, si un componente intenta usarlos
   * y falla, simplemente genera un HTML con solo los meta tags.
   */
  ssr: {
    noExternal: [],
    external: [
      'canvas',           // Binding nativo de Fabric.js — no existe en Node
      '@imagemagick/magick-wasm', // WASM — solo funciona en el navegador
      '@imgly/background-removal', // Modelo de IA — solo navegador
    ],
  },
})
