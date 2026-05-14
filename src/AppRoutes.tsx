/**
 * AppRoutes.tsx — Definición de rutas compartida entre cliente y servidor.
 *
 * ¿Por qué separar esto?
 * El cliente usa BrowserRouter (necesita window.history).
 * El servidor usa StaticRouter (no hay window).
 * Pero las rutas son LAS MISMAS. Este componente encapsula esa lógica
 * para que no se duplique.
 *
 * ¿Por qué React.lazy() para las herramientas?
 * Las herramientas usan APIs del navegador (canvas, Fabric.js, WASM, WebGL).
 * Si se importan estáticamente, el SSR crashea porque esas APIs no existen en Node.
 * Con React.lazy + Suspense:
 * - En el SERVIDOR: renderiza el fallback de Suspense (vacío) → está bien,
 *   Google no necesita ver el interior de la herramienta, solo los meta tags y el layout.
 * - En el CLIENTE: carga el componente normalmente → el usuario ve la herramienta completa.
 *
 * Bonus: React.lazy también mejora el rendimiento del cliente porque cada herramienta
 * se descarga solo cuando el usuario navega a ella (code splitting automático).
 */

import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/Layout/MainLayout';
import { Home } from './pages/Home/Home';
import { NotFound } from './components/Errors/NotFound';

// ────────────────────────────────────────────────────────────────
// Lazy imports: cada herramienta se carga bajo demanda.
// Esto permite SSR del layout + Home sin que canvas/Fabric/WASM crasheen.
// ────────────────────────────────────────────────────────────────

const AspectRatioTool = React.lazy(() =>
  import('./pages/Tools/AspectRatioTool/AspectRatioTool').then((m) => ({ default: m.AspectRatioTool }))
);
const OptimizerTool = React.lazy(() =>
  import('./pages/Tools/OptimizerTool/OptimizerTool').then((m) => ({ default: m.OptimizerTool }))
);
const ConverterTool = React.lazy(() =>
  import('./pages/Tools/ConverterTool/ConverterTool').then((m) => ({ default: m.ConverterTool }))
);
const RotateFlipTool = React.lazy(() =>
  import('./pages/Tools/RotateFlipTool/RotateFlipTool').then((m) => ({ default: m.RotateFlipTool }))
);
const WatermarkTool = React.lazy(() =>
  import('./pages/Tools/WatermarkTool/WatermarkTool').then((m) => ({ default: m.WatermarkTool }))
);
const ColorPaletteTool = React.lazy(() =>
  import('./pages/Tools/ColorPaletteTool/ColorPaletteTool').then((m) => ({ default: m.ColorPaletteTool }))
);
const Base64Tool = React.lazy(() =>
  import('./pages/Tools/Base64Tool/Base64Tool').then((m) => ({ default: m.Base64Tool }))
);
const BackgroundRemoverTool = React.lazy(() =>
  import('./pages/Tools/BackgroundRemoverTool/BackgroundRemoverTool').then((m) => ({ default: m.BackgroundRemoverTool }))
);

/** Wrapper que envuelve cada herramienta lazy en Suspense */
const LazyTool: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
    {children}
  </Suspense>
);

/** Definición de herramientas para evitar duplicar rutas */
const TOOL_ROUTES = [
  { en: 'tools/crop-image/',         es: 'herramientas/recortar-imagen/',      element: <LazyTool><AspectRatioTool /></LazyTool> },
  { en: 'tools/compress-image/',     es: 'herramientas/comprimir-imagen/',     element: <LazyTool><OptimizerTool /></LazyTool> },
  { en: 'tools/convert-image/',      es: 'herramientas/convertir-imagen/',     element: <LazyTool><ConverterTool /></LazyTool> },
  { en: 'tools/rotate-flip-image/',  es: 'herramientas/girar-voltear-imagen/', element: <LazyTool><RotateFlipTool /></LazyTool> },
  { en: 'tools/watermark-image/',    es: 'herramientas/marca-de-agua/',        element: <LazyTool><WatermarkTool /></LazyTool> },
  { en: 'tools/color-palette/',      es: 'herramientas/paleta-colores/',       element: <LazyTool><ColorPaletteTool /></LazyTool> },
  { en: 'tools/base64-converter/',   es: 'herramientas/convertidor-base64/',   element: <LazyTool><Base64Tool /></LazyTool> },
  { en: 'tools/remove-background/',  es: 'herramientas/quitar-fondo/',         element: <LazyTool><BackgroundRemoverTool /></LazyTool> },
] as const;

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ═══ RUTAS EN INGLÉS (raíz) ═══ */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        {TOOL_ROUTES.map(({ en, element }) => (
          <Route key={en} path={en} element={element} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ═══ RUTAS EN ESPAÑOL (/es/) ═══ */}
      <Route path="/es" element={<MainLayout />}>
        <Route index element={<Home />} />
        {TOOL_ROUTES.map(({ es, element }) => (
          <Route key={es} path={es} element={element} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ═══ REDIRECTS: URLs antiguas → nuevas ═══ */}
      <Route path="/herramientas/recorte-aspect-ratio" element={<Navigate to="/es/herramientas/recortar-imagen" replace />} />
      <Route path="/herramientas/optimizar-peso" element={<Navigate to="/es/herramientas/comprimir-imagen" replace />} />
      <Route path="/herramientas/cambiar-formato" element={<Navigate to="/es/herramientas/convertir-imagen" replace />} />
      <Route path="/herramientas/girar-voltear" element={<Navigate to="/es/herramientas/girar-voltear-imagen" replace />} />
      <Route path="/herramientas/marca-de-agua" element={<Navigate to="/es/herramientas/marca-de-agua" replace />} />
      <Route path="/herramientas/paleta-colores" element={<Navigate to="/es/herramientas/paleta-colores" replace />} />
      <Route path="/herramientas/base64" element={<Navigate to="/es/herramientas/convertidor-base64" replace />} />
      <Route path="/herramientas/quitar-fondo" element={<Navigate to="/es/herramientas/quitar-fondo" replace />} />
    </Routes>
  );
};
