# AGENTS.md — Pixetide Project Guide

> **¿Para quién es este documento?** Para cualquier desarrollador o agente AI que se incorpore al proyecto. Al terminar de leerlo debes saber: qué es Pixetide, cómo está organizado, qué archivo tocar para cada tarea, y qué reglas respetar.

---

## 1. ¿Qué es Pixetide?

Pixetide es una **suite web de herramientas de edición de imágenes**, gratuita y enfocada en privacidad. Todo el procesamiento ocurre en el navegador del usuario — los archivos nunca salen del dispositivo.

**Modelo de negocio:** open source, sostenido por tráfico orgánico (SEO) y donaciones. Por eso el código debe ser claro, mantenible y auditable.

**Dominio en producción:** `https://pixetide.com`

---

## 2. Prioridades (en orden de importancia)

Cuando dos decisiones entren en conflicto, resolver en este orden:

1. **Privacidad** del usuario
2. **Estabilidad** y aislamiento entre herramientas
3. **UX**, rendimiento y accesibilidad
4. **Claridad** arquitectónica y mantenibilidad
5. **SEO** y tráfico orgánico
6. **Velocidad** de implementación (sin sacrificar lo anterior)

---

## 3. Stack técnico real

| Categoría | Tecnología | Notas |
|---|---|---|
| Bundler | Vite 5 | Config en `vite.config.ts` |
| Framework | React 18 | Sin RSC — es una SPA con SSR/SSG |
| Lenguaje | TypeScript strict | `tsconfig.json` → `strict: true` |
| Estilos | Tailwind CSS v4 | Plugin `@tailwindcss/vite` — sin `tailwind.config.js` |
| Componentes UI | shadcn/ui (estilo New York) + Radix UI | Config en `components.json` |
| Iconos | `lucide-react` | — |
| Router | React Router v7 | `react-router-dom` |
| i18n | Custom (`LocaleProvider` / `useLocale`) | **No es i18next** |
| SEO | Custom (`SeoHead` / `seoConfig`) | **No es react-helmet** |
| Paquetes | `pnpm` exclusivamente | **Nunca npm** |
| Linting | ESLint | No hay Prettier |
| Deploy | Cloudflare Pages | Headers en `public/_headers` |
| Fuentes | `@fontsource` (Geist, Geist Mono, Playfair Display) | Self-hosted, sin CDN |

### Procesamiento de imágenes (todo client-side)

| Librería | Uso | Carga |
|---|---|---|
| `@imagemagick/magick-wasm` | Compress, convert | Web Worker compartido |
| `wasm-vips` | Rotate & Flip, Crop | Workers dedicados (`vips.worker.ts`, `crop.worker.ts`) |
| `@imgly/background-removal` | Quitar fondo con IA | Worker dedicado en la herramienta |
| `fabric.js` v5 | Watermark (canvas) | Lazy-loaded |
| `node-vibrant` + `culori` + `chroma-js` | Extracción de paletas de color | Import dinámico |
| `react-image-crop` | Crop visual interactivo | Lazy-loaded |
| `jszip` | Descarga masiva en ZIP | Import directo |

---

## 4. Mapa de arquitectura

```
src/
├── main.tsx                  ← Punto de entrada cliente (BrowserRouter)
├── entry-server.tsx          ← Punto de entrada SSR (StaticRouter)
├── App.tsx                   ← Wrapper: Router → LocaleProvider → SeoHead → AppRoutes
├── AppRoutes.tsx             ← Todas las rutas (EN + ES) + lazy imports de tools
├── index.css                 ← Tailwind v4 + @theme tokens + @fontsource + estilos globales
│
├── core/                     ← Configuración transversal (NO componentes de UI)
│   ├── seo/
│   │   ├── seoConfig.ts      ← ★ Fuente Única de Verdad SEO (rutas, titles, descriptions)
│   │   ├── SeoHead.tsx        ← Manipula <head> dinámicamente en el cliente
│   │   ├── SchemaMarkup.tsx   ← JSON-LD (datos estructurados para Google)
│   │   └── getToolPath.ts     ← Helper: obtener ruta localizada por tool ID
│   ├── i18n/
│   │   ├── LocaleProvider.tsx ← Context para idioma actual (lee URL + localStorage)
│   │   ├── useLocale.ts       ← Hook principal: locale, t(), pathPrefix, setLocale
│   │   └── translations.ts   ← ★ Todos los textos UI en EN/ES (~580 líneas)
│   ├── tools/
│   │   └── toolsConfig.ts    ← ★ Registro de herramientas (id, ícono, keys i18n)
│   └── styles/
│       └── variables.css      ← Variables CSS heredadas (mapeo semántico)
│
├── tools/                     ← ★ Herramientas: dominios aislados y autocontenidos
│   ├── AspectRatio/           ← Crop con aspect ratios para redes sociales
│   ├── BackgroundRemover/     ← Quitar fondo con IA (worker propio)
│   ├── Base64/                ← Codificador/decodificador Base64
│   ├── ColorPalette/          ← Extractor de paleta de colores
│   ├── Converter/             ← Conversión masiva de formatos
│   ├── Optimizer/             ← Compresor de imágenes
│   ├── RotateFlip/            ← Rotación y efecto espejo
│   └── Watermark/             ← Marca de agua (texto/logo)
│
├── shared/                    ← Código genuinamente reutilizado entre tools/pages
│   ├── components/
│   │   ├── ui/                ← Primitivas shadcn/ui (átomos: sheet, button, etc.)
│   │   ├── UI/                ← Compuestos propios (moléculas: Card, Workspace, Loader, Toast...)
│   │   ├── Layout/            ← MainLayout, Navbar, Footer
│   │   ├── DragAndDrop/       ← Drag & Drop single + multi
│   │   └── Errors/            ← ErrorBoundary, NotFound, ToolError, ToastContext
│   ├── utils/
│   │   ├── cn.ts              ← clsx + tailwind-merge (helper de classes)
│   │   ├── fileUpload.ts      ← Validación de archivos
│   │   ├── imageExport.ts     ← Descarga de imágenes procesadas
│   │   └── magickEngine.ts    ← API para comunicarse con el worker de ImageMagick
│   ├── workers/
│   │   └── magick.worker.ts   ← Web Worker compartido (WASM ImageMagick)
│   └── types/                 ← (vacío por ahora)
│
├── pages/
│   └── Home/                  ← Página principal (hero, cards de herramientas)
│
scripts/
├── generate-sitemap.ts        ← Genera sitemap.xml desde seoConfig
└── prerender.ts               ← SSG: renderiza cada ruta a HTML estático

public/
├── _headers                   ← Headers de seguridad (Cloudflare)
├── _redirects                 ← Redirects de Cloudflare
├── robots.txt
├── sitemap.xml                ← Generado automáticamente
├── favicon.svg
├── og-image.png
└── magick.wasm                ← Binario WASM de ImageMagick
```

---

## 5. Anatomía de una herramienta

Cada herramienta vive en `src/tools/<NombreHerramienta>/` y sigue este patrón:

```
src/tools/Optimizer/
├── OptimizerTool.tsx          ← Página pública (header SEO + Workspace + Module)
├── OptimizerModule.tsx        ← Lógica + UI completa de la herramienta
├── OptimizerModule.css        ← Estilos encapsulados (solo esta herramienta)
├── optimizer.ts               ← Tipos / constantes específicas
├── imageOptimizer.ts          ← Lógica de procesamiento (llama a magickEngine)
└── PresetSelector.tsx         ← Subcomponente interno (opcional)
```

### Convenciones dentro de cada tool:

| Archivo | Propósito |
|---|---|
| `*Tool.tsx` | Componente-página. Usa `Workspace` y `useLocale`. Renderiza header con h1 SEO + subtítulo. |
| `*Module.tsx` | Toda la UI interactiva + estado + lógica de procesamiento. |
| `*Module.css` | CSS encapsulado. **Nunca clases genéricas globales**. |
| `*.ts` | Tipos, constantes, helpers de la herramienta. |
| `*.worker.ts` | Web Worker propio (solo si la herramienta lo necesita, ej: BackgroundRemover). |

### Patrón de un ToolPage:

```tsx
export const OptimizerTool: React.FC = () => {
  const { locale, t } = useLocale();
  const seo = getSeoById('compress');  // ← ID del tool en seoConfig.ts
  return (
    <div className="home-container">
      <header className="tool-header">
        <h1 className="tool-title">
          {seo?.h1[locale].split('—')[0]} <span>...</span>
        </h1>
        <p className="tool-subtitle">{t('tool.compress.subtitle')}</p>
      </header>
      <Workspace>
        <OptimizerModule ... />
      </Workspace>
    </div>
  );
};
```

---

## 6. Sistemas transversales

### 6.1 Routing e Internacionalización (i18n)

- **Dos grupos de rutas**: inglés (raíz `/`) y español (`/es/`).
- Las rutas se definen en `AppRoutes.tsx` → array `TOOL_ROUTES` con slugs propios por idioma.
- El idioma se detecta por URL y se persiste en `localStorage`.
- Las traducciones están en `core/i18n/translations.ts`. **No se usa i18next**.
- El hook `useLocale()` provee: `locale`, `t(key)`, `pathPrefix`, `setLocale()`.

### 6.2 SEO

El SEO es **custom y centralizado**:

- **Fuente de verdad**: `core/seo/seoConfig.ts` → array `SEO_PAGES`.
- Cada entrada tiene: `id`, `path.{en,es}`, `title.{en,es}`, `description.{en,es}`, `h1.{en,es}`, `keywords`.
- **SeoHead.tsx**: manipula `<head>` dinámicamente en el cliente (title, canonical, hreflang, OG, Twitter Cards).
- **SchemaMarkup.tsx**: inyecta JSON-LD (`WebApplication` + `WebPage`).
- **prerender.ts**: genera HTML estático con meta tags para cada ruta de `SEO_PAGES`.
- **generate-sitemap.ts**: genera `public/sitemap.xml` desde `SEO_PAGES`.

### 6.3 SSR/SSG híbrido

El pipeline de build (`pnpm build`):

```
1. generate-sitemap.ts    → sitemap.xml
2. tsc -b                 → typecheck
3. vite build             → bundle cliente (dist/)
4. vite build --ssr       → bundle servidor (dist/server/)
5. prerender.ts           → HTML estático por ruta (dist/[ruta]/index.html)
```

**Reglas críticas de SSR:**
- Las herramientas usan canvas/WASM/WebGL → **no pueden importarse estáticamente**.
- Se cargan con `React.lazy()` → en SSR renderizan el fallback vacío de `Suspense`.
- Los paquetes `canvas`, `@imagemagick/magick-wasm`, `@imgly/background-removal` están externalizados en `vite.config.ts → ssr.external`.
- Si una herramienta falla en SSR, `prerender.ts` genera HTML mínimo con solo meta tags.

### 6.4 Web Workers

- **Worker compartido** (`shared/workers/magick.worker.ts`): ImageMagick WASM. Soporta acciones `CONVERT_IMAGE`, `OPTIMIZE_IMAGE`, `CROP_IMAGE`, `DETECT_TRANSPARENCY`. (Nota: Girar y Voltear migró a wasm-vips).
- Se comunica vía `shared/utils/magickEngine.ts` → `runMagickTask(action, payload)`.
- **Worker dedicado (wasm-vips)** (`tools/RotateFlip/vips.worker.ts`): Worker dedicado para la herramienta Girar y Voltear. Realiza rotaciones rápidas de 90/180/270 grados (lossless), rotaciones finas de ángulos arbitrarios y volteos.
- **Worker dedicado (Background Remover)** (`tools/BackgroundRemover/bgRemoval.worker.ts`): para `@imgly/background-removal`.
- Workers usan `{ type: 'module' }` y format `es` (configurado en `vite.config.ts → worker.format`).

### 6.5 Estándares de Robustez, Privacidad Técnica y Manejo de Errores

#### 6.5.1 Manejo de Archivos Eliminados o Bloqueados en Disco
*   **Problema:** Si el usuario sube un archivo a la galería, lo modifica y luego elimina el archivo físico de su disco duro antes de procesarlo o descargarlo, el navegador lanzará un error de tipo `NotFoundError` (al leer `.arrayBuffer()` en el worker) o un `DataCloneError` (al serializar el `File` en `postMessage` en el hilo principal).
*   **Solución Estándar:** Capturar ambos tipos de errores:
    1.  **Síncrono (Hilo Principal):** Envolver el `postMessage` en un bloque `try/catch` para interceptar el `DataCloneError` si el archivo ya no existe.
    2.  **Asíncrono (Worker):** Capturar excepciones dentro de la lectura del buffer del archivo en el worker.
    3.  **UI de Recuperación:** Transformar estos errores en un código unificado `FILE_NOT_FOUND`. Al recibirlo, la UI debe detener de inmediato el loader de procesamiento, ocultar el visor principal y mostrar un panel de advertencia: `"Archivo no disponible / No se pudo encontrar el archivo original sobre el que se está trabajando..."`. Debe ofrecerse un botón de `"Eliminar imagen"` para permitir al usuario purgar el elemento roto de la galería y continuar editando otras imágenes.

#### 6.5.2 Resiliencia frente a Fallos de Carga del Worker y Evitar Loaders Infinitos
*   **Problema:** Si la inicialización del worker de WebAssembly falla (por ejemplo, debido a políticas CORS del navegador, cabeceras COOP/COEP mal configuradas o bloqueos del sandbox), el hilo principal puede quedarse esperando la respuesta de carga del worker de forma indefinida, provocando un spinner de carga infinito.
*   **Solución Estándar:**
    1.  Escuchar el evento `worker.onerror` en el hilo principal para capturar fallos globales del script del worker.
    2.  Envolver la instanciación (`new Worker()`) y los primeros `postMessage` en bloques `try/catch` para capturar excepciones síncronas.
    3.  En caso de error, mostrar un toast genérico y actualizar el estado de carga (`vipsState` o equivalente) a `'error'` para que renderice un panel de reintento.
    4.  Al dar clic en "Reintentar", asegurarse de limpiar el worker antiguo (`worker.terminate(); worker = null`) antes de reconstruir para que no herede estados rotos.

#### 6.5.3 Privacidad Técnica en Mensajes de Error (OWASP)
*   **Regla:** Nunca exponer detalles técnicos del stack interno, librerías Wasm, nombres de archivos de desarrollo ni palabras como "wasm-vips" o "motor de procesamiento" en mensajes visibles del frontend.
*   **Solución Estándar:** Los fallos técnicos del worker o inicialización se informan de forma genérica como `"Error desconocido"` y `"Ocurrió un error desconocido. Por favor, intenta de nuevo."`. Esto previene fugas de información sobre vulnerabilidades o tecnologías internas de Pixetide.

#### 6.5.4 Procesamiento por Fotogramas de GIFs Animados en libvips
*   **Formato "toilet roll":** Al cargar un GIF usando `n: -1` en `newFromBuffer`, libvips concatena todos los fotogramas en una tira vertical larga de dimensiones `width x (pageHeight * nPages)`.
*   **Procesamiento:** Para procesar animaciones, se debe:
    1.  Determinar la cantidad de páginas con `image.getInt('n-pages')` y el alto de página con `image.getInt('page-height')`.
    2.  Extraer los metadatos de la animación `delay` (arreglo de enteros) y `loop` (entero).
    3.  Iterar sobre cada fotograma mediante `.crop(0, i * pageHeight, width, pageHeight)`.
    4.  Procesar cada fotograma individualmente aplicando transformaciones y guardarlo en una lista.
    5.  Concatenarlos de nuevo verticalmente mediante `vips.Image.arrayjoin(processedPages, { across: 1 })`.
    6.  Reinyectar en la imagen resultante los metadatos `page-height` (la nueva altura de página unitaria), `n-pages`, `delay` y `loop` antes de llamar a `writeToBuffer('.gif')`.

#### 6.5.5 Gestión de Galerías con Múltiples Imágenes
*   **Aislamiento y Persistencia de Estado:** Al manejar varias imágenes de forma simultánea, cada imagen en la galería debe mantener sus propios parámetros y transformaciones de forma independiente. Para parámetros con actualizaciones de alta frecuencia (como zoom o coordenadas de desplazamiento/paneo), se debe evitar actualizar el array global de imágenes en tiempo real para no causar lag en la UI por re-renders repetitivos del listado de miniaturas. En su lugar, mantener estados locales de UI sincronizados con refs en cada render y persistirlos en el listado global de imágenes de forma diferida y atómica únicamente en el cambio de imagen activa (`activeIndex`).
*   **Adición Incremental:** Al subir nuevas imágenes a la galería, estas deben agregarse al final del listado sin alterar ni reiniciar el estado o las transformaciones de los archivos que ya estaban en el Área de Galería.
*   **Flujo de Descarga Unificada:**
    - **Caso 1 (Una Imagen):** Descarga directa de la imagen con transformaciones.
    - **Caso 2 (Múltiples Imágenes):** Genera un archivo `.zip` que contiene todas las imágenes de la galería con sus modificaciones.
*   **Nomenclatura Unificada:** Usar "DESCARGAR" para una imagen y "DESCARGAR (.zip)" para múltiples.

#### 6.5.6 Validación Estricta de Formatos y Carga Optimizada
*   **Validación Multinivel:** No confiar únicamente en el atributo `accept` del input HTML. El evento de arrastrar y soltar (Drag and Drop) o la inyección de archivos debe ser validada a nivel de código (MIME type y extensión) mediante helpers centralizados (como `shared/utils/fileUpload.ts`).
*   **Rechazo y Notificaciones:** Si el usuario intenta subir archivos incompatibles, estos deben ser bloqueados de inmediato y se debe mostrar una notificación visual (Toast) amigable: `"El archivo [nombre] no se pudo cargar porque no tiene el formato correcto."`.
*   **Límites de Peso:** Cada archivo individual cargado debe respetar un peso máximo (usualmente 20MB por archivo) para mitigar fugas de memoria o bloqueos del navegador en entornos cliente.
*   **Optimización del Tiempo de Espera en Carga:**
    - Al subir un archivo por primera vez y el motor del worker no se ha descargado o inicializado, se permite un tiempo de espera amplio para asegurar su correcta inicialización.
    - Si el motor ya está inicializado (`state === 'ready'`), se debe optimizar el delay de la UI (por ejemplo, ampliando a un retardo visual controlado de 1000ms en lugar de 300ms) para mejorar la consistencia visual y evitar parpadeos abruptos en la transición de la galería.

### 6.6 Componentes UI (la convención ui vs UI)

| Carpeta | Contenido | Ejemplo |
|---|---|---|
| `shared/components/ui/` (minúscula) | Primitivas shadcn/ui (átomos) | `sheet.tsx` |
| `shared/components/UI/` (mayúscula) | Compuestos propios (moléculas/organismos) | `Card.tsx`, `Workspace/`, `Loader/`, `Toast/`, `DownloadButton/` |

**No mezclar.** Los componentes shadcn se instalan en `ui/`; los compuestos propios en `UI/`.

---

## 7. Guía paso a paso: Agregar una herramienta nueva

### Paso 1 — Crear la carpeta del tool

```
src/tools/NuevoTool/
├── NuevoToolTool.tsx
├── NuevoToolModule.tsx
├── NuevoToolModule.css
└── nuevoTool.ts (tipos, si aplica)
```

### Paso 2 — Registrar en `core/tools/toolsConfig.ts`

Agregar entrada al array `TOOLS_CONFIG`:

```ts
{ id: 'nuevo-tool', iconName: 'Sparkles', titleKey: 'card.nuevoTool.title', descKey: 'card.nuevoTool.desc' }
```

### Paso 3 — Agregar traducciones en `core/i18n/translations.ts`

En ambos objetos (`en` y `es`):
- `card.nuevoTool.title` / `card.nuevoTool.desc` (tarjeta del Home)
- `tool.nuevoTool.h1` / `tool.nuevoTool.subtitle` (header de la página)
- Keys específicas del módulo (prefijo propio, ej: `nt.label`)

### Paso 4 — Agregar entrada SEO en `core/seo/seoConfig.ts`

Crear entrada en `SEO_PAGES`:

```ts
{
  id: 'nuevo-tool',
  path: { en: '/tools/nuevo-tool/', es: '/es/herramientas/nuevo-tool/' },
  title: { en: '...', es: '...' },
  description: { en: '...', es: '...' },
  h1: { en: '...', es: '...' },
  keywords: { en: [...], es: [...] },
}
```

### Paso 5 — Registrar rutas en `AppRoutes.tsx`

1. Agregar lazy import:
```ts
const NuevoToolTool = React.lazy(() =>
  import('./tools/NuevoTool/NuevoToolTool').then((m) => ({ default: m.NuevoToolTool }))
);
```

2. Agregar al array `TOOL_ROUTES`:
```ts
{ en: 'tools/nuevo-tool/', es: 'herramientas/nuevo-tool/', element: <LazyTool><NuevoToolTool /></LazyTool> }
```

### Paso 6 — Validar

```bash
pnpm lint
pnpm build    # Incluye sitemap, typecheck, client build, SSR build, prerender
```

Verificar:
- [ ] La herramienta aparece en el Home
- [ ] La ruta EN y ES funcionan
- [ ] El prerender genera HTML con meta tags correctos
- [ ] El sitemap incluye las nuevas URLs
- [ ] No rompe SSR (el lazy import protege)

---

## 8. Convenciones de código

### TypeScript
- `strict: true` siempre.
- Evitar `any` — justificar si es estrictamente necesario.
- Path alias: `@/` → `src/`.

### Estilos
- **Tailwind v4** es la base. Se configura en `index.css` con `@theme {}`.
- **CSS puro** solo para casos que Tailwind no cubra limpiamente (canvas, keyframes complejos).
- Si se usa CSS: **siempre encapsulado por herramienta/componente**. Nunca CSS global dentro de `tools/`.
- No crear clases genéricas compartidas tipo `.text-primary`.

### Paquetería
- `pnpm` exclusivamente. No `npm`.
- No cambiar lockfile sin necesidad real.
- Antes de instalar una nueva dependencia, evaluar: tamaño, mantenimiento, compatibilidad SSR/Workers, privacidad, impacto en bundle.

### UX
- Mobile-first obligatorio.
- Accesibilidad WCAG 2.1 AA: navegación por teclado, foco visible, contraste suficiente.
- Priorizar Core Web Vitals.

### Seguridad
- OWASP por defecto en lo que aplique a frontend.
- Sin CDN ni dependencias externas en runtime.
- Todo self-hosted y servido desde el mismo dominio.

---

## 9. Reglas de aislamiento

- Una herramienta **no importa** de otra herramienta.
- Si una herramienta falla, su error queda contenido (ErrorBoundary + LazyTool).
- Dependencias pesadas se encapsulan dentro de la herramienta que las usa.
- No promover a `shared/` prematuramente. Solo si el patrón es estable, simple y usado en 2+ lugares.
- No introducir estado global acoplado a una sola herramienta.

---

## 10. Infraestructura custom — NO reemplazar

Estos sistemas son custom a propósito. **No sustituir por librerías genéricas** sin justificación muy fuerte:

| Sistema | Implementación custom | Alternativa rechazada | Razón |
|---|---|---|---|
| SEO | `seoConfig.ts` + `SeoHead.tsx` | react-helmet (~10KB) | Solo 50 líneas de código nativo |
| i18n | `useLocale` + `translations.ts` | i18next (~40KB) | Solo 2 idiomas, ~50 keys UI |
| Schema | `SchemaMarkup.tsx` | — | Dinámico por ruta |

---

## 11. Comandos del proyecto

```bash
pnpm dev        # Servidor de desarrollo
pnpm lint       # Validación ESLint
pnpm build      # Pipeline completo: sitemap → typecheck → client → SSR → prerender
pnpm preview    # Preview del build de producción
pnpm sitemap    # Solo regenerar sitemap.xml
```

---

## 12. Checklist de validación

Antes de dar una tarea por terminada:

- [ ] `pnpm lint` pasa sin warnings.
- [ ] Si afecta build/rutas/layout/SEO/componentes base → `pnpm build` pasa.
- [ ] Si es visual → verificar mobile y desktop.
- [ ] Si toca rutas indexables → verificar prerender y sitemap.
- [ ] No se introdujeron imports cruzados entre herramientas.
- [ ] No se rompió SSR con imports estáticos de libs del navegador.
- [ ] Accesibilidad: foco visible, contraste, keyboard nav intactos.

---

## 13. Qué NO hacer

- No asumir que es una SPA sin SSR.
- No importar dependencias pesadas (WASM, canvas, Fabric) estáticamente.
- No mover código a `shared/` prematuramente.
- No introducir CSS global contaminante.
- No hacer refactors amplios fuera de scope.
- No reemplazar infraestructura custom (SEO, i18n, routing) sin justificación.
- No comprometer privacidad por atajos.
- No asumir que una solución de una herramienta aplica a todas.
- No usar `npm`, CDNs, ni dependencias externas en runtime.

---

## 14. Herramientas futuras planeadas (deshabilitadas)

Estas ya tienen entrada en `toolsConfig.ts` con `disabled: true`:

| ID | Nombre | Estado |
|---|---|---|
| `upscale` | Enhance Image Quality (AI) | Próximamente |
| `photo-editor` | Online Photo Editor | Próximamente |
| `favicon` | Favicon ICO Generator | Próximamente |

---

## 15. Árbol de decisión

Ante cualquier duda de implementación:

```
1. ¿Respeta la privacidad del usuario?           → Si no, reconsiderar.
2. ¿Mantiene la herramienta aislada?              → Si no, encapsular.
3. ¿Evita romper SSR, prerender y routing?        → Si no, usar lazy import.
4. ¿Es consistente con la arquitectura actual?    → Si no, justificar el cambio.
5. ¿Es simple de mantener en un proyecto open source? → Si no, simplificar.
6. ¿Protege UX, accesibilidad y rendimiento?      → Si no, iterar.
```

---

## 16. Idioma y tono de trabajo

- Responder en **español**, salvo indicación contraria.
- Explicar el **porqué** de cada decisión técnica.
- Actuar como **desarrollador senior** con contexto de producto, no como generador ciego de código.
- Si hay deuda técnica, señalarla separando "estado actual" vs "dirección deseada".
- Preferir **cambios pequeños, auditables y reversibles**.
- Si una tarea es grande, proponer fases.
- Si hay ambigüedad o riesgo de romper algo estable, **detenerse y pedir confirmación**.