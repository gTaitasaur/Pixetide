# Pixetide

![Privacidad](https://img.shields.io/badge/Privacidad-100%25_Local-emerald?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-React_%7C_Vite_%7C_Tailwind_v4-gray?style=flat-square)
![Procesamiento](https://img.shields.io/badge/Procesamiento-wasm--vips-orange?style=flat-square)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue?style=flat-square)

Pixetide es una suite web de herramientas de edición de imágenes de código abierto, gratuita y orientada prioritariamente a la privacidad de tus datos. 

A diferencia de la mayoría de servicios en línea que te piden subir fotos a sus servidores (con el consiguiente consumo de ancho de banda y el riesgo implícito sobre tus datos personales), **en Pixetide todo el procesamiento ocurre 100% en tu navegador**. Tus imágenes nunca salen de tu dispositivo.

---

## El Enfoque: Privacidad y Procesamiento Local

El propósito fundamental de Pixetide es demostrar que la edición de imágenes potente no requiere sacrificar tu privacidad ni depender de infraestructura en la nube. 

### Comparativa de Flujo de Datos

```text
  TRADICIONAL (En la nube)
  ┌────────────┐      Subida (Red)      ┌──────────────────────┐      Procesado/Almacén
  │ Tu Imagen  │ ─────────────────────► │ Servidores Externos  │ ────────────────────────┐
  └────────────┘                        └──────────────────────┘                         │
                                                                                         ▼
  ┌────────────┐      Descarga (Red)    ┌──────────────────────┐      Imagen Editada     │
  │ Tu Imagen  │ ◄───────────────────── │ Servidores Externos  │ ◄───────────────────────┘
  └────────────┘                        └──────────────────────┘

  PIXETIDE (100% Local)
  ┌────────────┐     Procesamiento      ┌──────────────────────┐      Descarga Directa
  │ Tu Imagen  │ ─────────────────────► │ Tu Navegador (Local) │ ────────────────────────┐
  └────────────┘                        │  (WASM + Workers)    │                         │
                                        └──────────────────────┘                         ▼
                                                                                   [Imagen Lista]
                                                                                   (Instantáneo)
```

> [!IMPORTANT]
> **Privacidad Técnica por Diseño**: No utilizamos CDNs ni dependencias de terceros en runtime. Todo el código, estilos, fuentes y binarios WebAssembly se sirven desde el propio dominio de Pixetide. No recopilamos tus imágenes ni rastreamos tus datos.

---

## Herramientas Disponibles

La suite está organizada de manera modular. Cada herramienta está completamente aislada de las demás para garantizar la mantenibilidad del código:

| Herramienta | Descripción | Módulo de Código |
| :--- | :--- | :--- |
| **Comprimir** | Reduce el peso de JPG, PNG o WebP sin pérdida apreciable de calidad. | [`src/tools/Optimizer`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/Optimizer) |
| **Convertir** | Cambia el formato de tus archivos en lote (PNG, JPG, WebP, GIF, etc.). | [`src/tools/Converter`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/Converter) |
| **Recortar** | Ajusta las dimensiones y relaciones de aspecto de tus fotos de forma exacta. | [`src/tools/AspectRatio`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/AspectRatio) |
| **Girar y Voltear** | Rota en ángulos libres o refleja tus fotos horizontal y verticalmente. | [`src/tools/RotateFlip`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/RotateFlip) |
| **Quitar Fondo** | Elimina el fondo de retratos u objetos usando Inteligencia Artificial local. | [`src/tools/BackgroundRemover`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/BackgroundRemover) |
| **Marca de Agua** | Añade firmas, logos o textos personalizados para proteger tus fotos en lote. | [`src/tools/Watermark`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/Watermark) |
| **Paleta de Colores** | Extrae los colores dominantes y sus códigos HEX de cualquier imagen. | [`src/tools/ColorPalette`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/ColorPalette) |
| **Imágenes a PDF** | Une múltiples capturas o fotos en un único archivo PDF ordenable. | [`src/tools/ImagesToPdf`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/ImagesToPdf) |
| **Base64** | Codifica imágenes a texto Base64 o decodifica cadenas de texto a imagen. | [`src/tools/Base64`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/Base64) |

---

## Detalles Técnicos y Arquitectura

Para lograr un rendimiento similar al de una aplicación nativa de escritorio directamente en el navegador, Pixetide se apoya en tecnologías web modernas:

### 1. WebAssembly (`wasm-vips`)
La compresión, conversión y transformaciones complejas utilizan **libvips** compilada a WebAssembly. Libvips es una biblioteca de procesamiento de imágenes extremadamente rápida que requiere poca memoria. Al ejecutarla mediante WASM dentro del navegador, obtenemos velocidades de procesamiento profesionales sin servidores de por medio.

### 2. Hilos de Fondo (Web Workers)
Para evitar congelamientos en la interfaz de usuario al procesar imágenes de alta resolución, delegamos el procesamiento a Web Workers independientes. La interfaz permanece interactiva y fluida mientras la imagen se procesa en segundo plano.

### 3. Inteligencia Artificial Client-Side
La herramienta de remoción de fondos aprovecha `@imgly/background-removal`. Esto nos permite descargar y ejecutar modelos de segmentación de imágenes directamente en la GPU/CPU del usuario gracias a ONNX Runtime Web.

---

## Cómo Ejecutar Localmente

### Requisitos Previos
* [Node.js](https://nodejs.org/) (versión recomendada en el archivo `.nvmrc`)
* [pnpm](https://pnpm.io/) instalado globalmente (`npm install -g pnpm`)

### Instalación de Dependencias
Clona el repositorio e instala los paquetes necesarios usando `pnpm` (no utilices `npm` o `yarn` para asegurar la consistencia del archivo de bloqueo):

```bash
pnpm install
```

### Servidor de Desarrollo
Inicia el entorno de desarrollo local con recarga rápida (HMR):

```bash
pnpm run dev
```

### Construcción para Producción
Compila el proyecto, genera el sitemap, ejecuta TypeScript y realiza el prerenderizado estático (SSR/SSG híbrido):

```bash
pnpm run build
```

El resultado listo para desplegar en cualquier servidor estático se guardará en la carpeta `dist/`.

---

## Licencia
Este proyecto está bajo la Licencia MIT.

