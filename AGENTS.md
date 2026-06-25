# AGENTS.md — Pixetide Project Guide

> **¿Para quién es este documento?** Para cualquier desarrollador o agente AI que se incorpore al proyecto. Define el stack real, la arquitectura simplificada, reglas críticas y estándares de desarrollo de Pixetide.

---

## 1. ¿Qué es Pixetide?
Pixetide es una **suite web de herramientas de edición de imágenes** gratuita y enfocada en privacidad. El procesamiento ocurre 100% en el navegador (client-side) mediante WebAssembly y Workers; los archivos nunca se suben a ningún servidor.

*   **Dominio en producción**: `https://pixetide.com`
*   **Prioridades**: 1. Privacidad, 2. Estabilidad/Aislamiento, 3. UX/Rendimiento/A11y, 4. Mantenibilidad, 5. SEO.

---

## 2. Stack Técnico Real

| Categoría | Tecnología | Notas |
|---|---|---|
| **Bundler & Server** | Vite 5 + React 18 | Config en `vite.config.ts`. SPA con SSR/SSG híbrido. |
| **Enrutador & SEO** | React Router v7 + Custom SEO | Rutas localizadas (EN/ES) en `AppRoutes.tsx`. SEO en `core/seo/`. |
| **Estilos & UI** | Tailwind CSS v4 + shadcn/ui | Componentes shadcn en `ui/`, propios en `UI/`. |
| **i18n** | Custom Provider | Contexto e idiomas en `core/i18n/`. No es i18next. |
| **Procesamiento** | `wasm-vips` + `@imgly/background-removal` | libvips en WebAssembly. Remoción de fondo con IA local. |
| **Librerías Aux** | `fabric` v5, `heic2any`, `jspdf`, `jszip` | Fabric (Watermark), heic2any/jspdf (Converter), jszip (Descargas masivas). |
| **Paquetes** | `pnpm` exclusivamente | Mantener lockfile consistente. Nunca usar npm. |

*Nota: Los archivos `.wasm` de libvips se sirven desde la raíz de `public/` (`vips.wasm`, `vips-heif.wasm`, `vips-jxl.wasm`, `vips-resvg.wasm`).*

---

## 3. Arquitectura y Directorios

```
src/
├── main.tsx                  ← Entrada cliente
├── entry-server.tsx          ← Entrada SSR
├── App.tsx                   ← Providers (Router, Locale, SEO)
├── AppRoutes.tsx             ← Rutas localizadas (Dashboard y MainLayout)
├── index.css                 ← Tailwind v4 + Fuentes locales
│
├── core/                     ← Configuración transversal (NO UI)
│   ├── seo/                  ← seoConfig.ts (Fuente de verdad), SeoHead.tsx, SchemaMarkup.tsx
│   ├── i18n/                 ← LocaleProvider.tsx, useLocale.ts, translations.ts
│   └── tools/                ← toolsConfig.ts (Registro de herramientas)
│
├── tools/                     ← Herramientas aisladas y autocontenidas
│   ├── <NombreTool>/
│   │   ├── <NombreTool>Tool.tsx      ← Página pública (SEO Head + Workspace)
│   │   ├── <NombreTool>Module.tsx    ← Lógica interactiva y UI del módulo
│   │   ├── <NombreTool>Module.css    ← Estilos encapsulados
│   │   ├── *.worker.ts               ← Web Worker dedicado (si aplica)
│   │   └── *.ts                      ← Tipos y constantes específicas
│
├── shared/                    ← Código reutilizable y común
│   ├── components/
│   │   ├── ui/                ← Primitivas shadcn/ui (átomos: button, sheet...)
│   │   ├── UI/                ← Componentes compuestos (Workspace, Card, Toast...)
│   │   ├── Layout/            ← Layout general (Navbar, Footer, MainLayout)
│   │   ├── DragAndDrop/       ← Inputs de arrastrar y soltar
│   │   └── Errors/            ← ErrorBoundary, NotFound, ToastContext
│   └── utils/
│       ├── cn.ts              ← Utility para clases de Tailwind
│       └── fileUpload.ts      ← Validación multinivel de archivos
│
├── pages/
│   ├── Home/                  ← Home general
│   └── ToolsDashboard/        ← Layout de Dashboard colapsable (ToolsHub + herramientas internas)
```

---

## 4. Web Workers y Procesamiento de Imágenes
Para mantener la UI fluida y evitar bloqueos, las tareas de procesamiento de imágenes se delegan a **Workers dedicados** ubicados dentro de la carpeta de la herramienta correspondiente.

### Resumen de Workers Dedicados
1.  **Girar y Voltear** (`tools/RotateFlip/vips.worker.ts`): Usa `wasm-vips` para rotaciones (rápidas y finas) y volteos.
2.  **Recortar** (`tools/AspectRatio/crop.worker.ts`): Usa `wasm-vips` para recortes con aspect ratios.
3.  **Compresor** (`tools/Optimizer/optimizer.worker.ts`): Usa `wasm-vips` para reducir peso de imágenes.
4.  **Convertidor** (`tools/Converter/converter.worker.ts`): Usa `wasm-vips` para cambiar formatos de exportación.
5.  **Quitar Fondo** (`tools/BackgroundRemover/bgRemoval.worker.ts`): Usa `@imgly/background-removal`.

---

## 5. Estándares de Robustez y UX

### 5.1 Manejo de Workers y Fugas de Memoria
*   **Inicialización:** Instanciar el worker usando la sintaxis de Vite: `import MyWorker from './my.worker?worker'; const worker = new MyWorker();`.
*   **Ciclo de vida:** Limpiar y terminar el worker (`worker.terminate()`) al desmontar el componente (`useEffect` cleanup) o al restablecer la galería para evitar fugas de memoria.
*   **Evitar Loaders Infinitos:** Controlar errores globales con `worker.onerror` y bloques `try/catch`. En caso de error, actualizar el estado de carga para mostrar un botón de reintento.

### 5.2 Gestión de Errores y Privacidad Técnica (OWASP)
*   **Archivos eliminados en disco:** Capturar `NotFoundError` y `DataCloneError` si el usuario elimina el archivo original de su dispositivo durante el procesamiento. La UI debe detectar el código `FILE_NOT_FOUND`, detener los loaders, mostrar una advertencia clara y ofrecer un botón de *"Eliminar imagen"*.
*   **Mensajes de error genéricos:** Por seguridad, nunca expongas detalles del stack interno (nombres de archivos, "wasm-vips", "WebAssembly", etc.) en la UI. Informar fallas críticas como: *"Ocurrió un error desconocido. Por favor, intenta de nuevo."*

### 5.3 Procesamiento de GIFs en libvips
Al procesar GIFs con `wasm-vips`, libvips carga las páginas en formato "toilet roll" (tira vertical de `width x (pageHeight * nPages)`).
1.  Obtener `n-pages` y `page-height` de la imagen.
2.  Extraer metadatos de la animación (`delay` y `loop`).
3.  Iterar sobre cada fotograma mediante `.crop(0, i * pageHeight, width, pageHeight)`, aplicar transformaciones y guardarlos en una lista.
4.  Concatenar verticalmente con `vips.Image.arrayjoin(processedPages, { across: 1 })`.
5.  Reinyectar metadatos (`page-height`, `n-pages`, `delay`, `loop`) antes de exportar.

### 5.4 Gestión de Galerías Multitarea
*   **Aislamiento:** Cada imagen de la galería mantiene sus propios parámetros. Evitar actualizaciones en tiempo real del estado de la galería global en parámetros de alta frecuencia (como zoom o paneo) para no causar lag; persistirlos sólo al cambiar la imagen activa (`activeIndex`).
*   **Descargas:** Si hay una sola imagen, descargar directamente. Si hay múltiples, generar un archivo `.zip` utilizando `jszip`. Usar la nomenclatura: `"DESCARGAR"` (para una imagen) y `"DESCARGAR (.zip)"` (para múltiples).

---

## 6. Routing, SEO e i18n
*   **Enrutado Híbrido:** `AppRoutes.tsx` define dos esquemas de layouts:
    1.  `MainLayout` (Navbar y Footer globales): Usado en Home, Marca de agua, Paleta de colores, Base64 y Quitar fondo.
    2.  `ToolsDashboard` (Sidebar colapsable para desktop y mobile-friendly): Usado para las herramientas de edición recurrente (Girar, Recortar, Comprimir, Convertir).
*   **SEO Centralizado:** Toda la metadata SEO está en `core/seo/seoConfig.ts`. `SeoHead.tsx` inyecta las etiquetas dinámicamente. El script `scripts/prerender.ts` genera HTML estático por ruta para indexación rápida.
*   **i18n Local:** Las traducciones en EN/ES viven en `core/i18n/translations.ts`. Consumir mediante el hook `useLocale()`, el cual expone `locale`, `t(key)`, `pathPrefix` y `setLocale()`.

---

## 7. Agregar una Herramienta Nueva (Checklist)

1.  Crear la carpeta en `src/tools/NuevoTool/` con `*Tool.tsx`, `*Module.tsx` y `*Module.css`.
2.  Registrar en `core/tools/toolsConfig.ts` (`TOOLS_CONFIG`).
3.  Agregar traducciones en `core/i18n/translations.ts` (en los objetos `en` y `es`).
4.  Agregar metadata SEO en `core/seo/seoConfig.ts` (`SEO_PAGES`).
5.  Registrar las rutas localizadas (EN y ES) en `src/AppRoutes.tsx` (usar `React.lazy()` para evitar romper SSR).
6.  Ejecutar validaciones (`pnpm lint` y `pnpm build`).

---

## 8. Reglas de Trabajo
*   **Idioma:** Responder y documentar en **español**. Explicar siempre el "porqué" de las decisiones técnicas.
*   **Cambios pequeños:** Preferir cambios incrementales, modulares y reversibles. Evitar refactorizaciones masivas sin justificación.
*   **Aislamiento:** Las herramientas no deben importarse entre sí. Mantener las dependencias pesadas encapsuladas dentro del dominio de su respectiva herramienta.
*   **SSR Friendly:** No importar APIs del navegador (`window`, `document`, `canvas`, etc.) estáticamente en archivos de primer nivel. Usar imports dinámicos o componentes lazy.
*   **Calidad Visual & A11y:** Mobile-first, colores sofisticados, accesibilidad WCAG 2.1 AA (foco visible, contraste, navegación por teclado).