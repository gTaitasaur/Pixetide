/**
 * entry-server.tsx — Punto de entrada para Server-Side Rendering (SSR).
 *
 * ¿Cómo funciona el prerendering?
 * 1. Vite compila este archivo como un módulo Node.js
 * 2. El script prerender.ts lo importa y llama a render(url)
 * 3. React renderiza la app como string HTML
 * 4. El script inyecta ese HTML dentro del template index.html
 * 5. El resultado es un archivo HTML estático con contenido real
 *
 * ¿Por qué esto es crítico para SEO?
 * Sin prerendering, Google ve: <div id="root"></div> (vacío)
 * Con prerendering, Google ve: <div id="root"><nav>...<h1>...<a>...</div>
 * Eso significa títulos, descripciones, links internos — todo indexable.
 *
 * Usamos StaticRouter en vez de BrowserRouter porque no hay window/history
 * en el servidor. StaticRouter recibe la URL como prop y renderiza la ruta
 * correspondiente.
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { AppRoutes } from './AppRoutes';
import { ErrorBoundary } from './components/Errors/ErrorBoundary';
import { ToastProvider } from './components/Errors/ToastContext';
import { SchemaMarkup } from './seo/SchemaMarkup';

/**
 * Renderiza la app para una URL dada y retorna el HTML como string.
 *
 * @param url - La ruta a renderizar (ej: '/tools/compress-image')
 * @returns HTML string del contenido de la app
 */
export function render(url: string): string {
  return renderToString(
    <React.StrictMode>
      <StaticRouter location={url}>
        <ToastProvider>
          <ErrorBoundary>
            <SchemaMarkup />
            <AppRoutes />
          </ErrorBoundary>
        </ToastProvider>
      </StaticRouter>
    </React.StrictMode>
  );
}
