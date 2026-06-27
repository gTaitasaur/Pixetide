<div align="center">

# <img src="./public/favicon.svg" width="38" height="38" valign="middle" alt="Pixetide Logo" /> Pixetide

**Una suite web de herramientas de imágenes 100% privada, rápida y local.**

[![Privacidad](https://img.shields.io/badge/Privacidad-100%25_Local-emerald?style=for-the-badge)](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg)
[![Stack](https://img.shields.io/badge/Stack-React_%7C_Vite_%7C_Tailwind_v4-blue?style=for-the-badge)](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg)
[![Procesamiento](https://img.shields.io/badge/Procesamiento-wasm--vips-orange?style=for-the-badge)](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-gray?style=for-the-badge)](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/README.md)

<p align="center">
  A diferencia de los servicios convencionales que cargan tus archivos en servidores externos, <b>Pixetide procesa todas las imágenes en el entorno del navegador</b>. Los archivos nunca salen de tu dispositivo y el consumo de red en transferencias pesadas es nulo.
</p>


---

</div>

## 📌 Pilares del Proyecto

Pixetide está diseñado bajo las siguientes directrices funcionales:

<table width="100%">
  <tr>
    <td width="33.3%" align="center" valign="top">
      <h3>🔒 Procesamiento en Cliente</h3>
      <p>Todas las transformaciones de archivos y cálculos de imagen se realizan en la memoria del navegador. No se emplean servidores de procesamiento ni almacenamiento externo de datos.</p>
    </td>
    <td width="33.3%" align="center" valign="top">
      <h3>⚡ Aprovechamiento de Recursos</h3>
      <p>Las herramientas utilizan el hardware del dispositivo del usuario (CPU y GPU) mediante paralelismo de hilos para agilizar la edición de archivos de alta resolución.</p>
    </td>
    <td width="33.3%" align="center" valign="top">
      <h3>🌐 Red Aislada</h3>
      <p>La suite no realiza llamadas a APIs externas en tiempo de ejecución, ni carga CDNs o scripts de seguimiento de terceros, sirviendo todas sus dependencias localmente.</p>
    </td>
  </tr>
</table>

---

## 🔄 Comparativa de Flujo de Datos

El diseño arquitectónico de Pixetide elimina la necesidad de transferir datos por la red para editar archivos:

### Enfoque Convencional (En la nube)
```text
┌───────────┐      Subida (Red)      ┌─────────────┐      Procesado y Almacén
│ Tu Imagen │ ─────────────────────► │  Servidor   │ ───────────────┐
└───────────┘                        │  Externo    │                │ (Tratamiento externo de datos)
                                     └─────────────┘                ▼
┌───────────┐      Descarga (Red)    ┌─────────────┐      Imagen Modificada
│ Tu Imagen │ ◄───────────────────── │  Servidor   │ ◄──────────────┘ (Consumo de ancho de banda)
└───────────┘                        └─────────────┘
```

### Enfoque Pixetide (100% Local)
```text
┌───────────┐      Carga Local       ┌─────────────┐      Descarga Directa
│ Tu Imagen │ ─────────────────────► │ Navegador   │ ──────────────────► [ Imagen Final ]
└───────────┘                        │ (WASM/GPU)  │                     (De memoria a disco)
                                     └─────────────┘
```

---

## 🛠️ Herramientas Disponibles

La suite está estructurada de forma modular, permitiendo mantener cada herramienta aislada en su propio subdirectorio:

| Herramienta | Propósito | Directorio de Código |
| :--- | :--- | :--- |
| **Comprimir** | Disminuye el tamaño en disco de imágenes JPG, PNG o WebP. | [`src/tools/Optimizer`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/Optimizer) |
| **Convertir** | Conversión de formatos en lote (PNG, JPG, WebP, GIF). | [`src/tools/Converter`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/Converter) |
| **Recortar** | Recorte y redimensionamiento con relaciones de aspecto predefinidas. | [`src/tools/AspectRatio`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/AspectRatio) |
| **Girar y Voltear** | Rotación libre y volteo horizontal o vertical. | [`src/tools/RotateFlip`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/RotateFlip) |
| **Quitar Fondo** | Segmentación y remoción de fondo mediante redes neuronales locales. | [`src/tools/BackgroundRemover`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/BackgroundRemover) |
| **Marca de Agua** | Superposición de imágenes de logotipo o texto en lote. | [`src/tools/Watermark`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/Watermark) |
| **Paleta de Colores**| Extracción de paletas y conversión a códigos hexadecimales. | [`src/tools/ColorPalette`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/ColorPalette) |
| **Imágenes a PDF** | Conversión e integración de archivos de imagen en un documento PDF. | [`src/tools/ImagesToPdf`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/ImagesToPdf) |
| **Base64** | Codificación y decodificación directa de cadenas de datos Base64. | [`src/tools/Base64`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/Base64) |


---

## ⚙️ Arquitectura Técnica

Para ejecutar tareas de edición avanzadas en el lado del cliente con un consumo eficiente de recursos, la aplicación implementa las siguientes tecnologías:

*   **WebAssembly (`wasm-vips`):** Las tareas de manipulación y conversión utilizan la biblioteca nativa `libvips` compilada en formato WebAssembly. Esto permite ejecutar algoritmos de procesamiento eficientes con bajo consumo de memoria RAM y tiempos de ejecución reducidos.
*   **Web Workers (Multihilo):** Las tareas de procesamiento de imágenes con alto costo de cómputo se ejecutan en subprocesos en segundo plano. Esto previene que se congele el hilo de ejecución principal y mantiene la respuesta táctil y visual de la interfaz.
*   **Modelos de Aprendizaje Profundo Locales:** La remoción de fondos se apoya en `@imgly/background-removal`, cargando y ejecutando modelos de segmentación en el entorno local a través de ONNX Runtime Web. El proceso se beneficia de aceleración WebGL o WebGPU si el dispositivo del usuario lo soporta.

---

## 💻 Desarrollo y Ejecución Local

Si deseas ejecutar Pixetide en tu computadora o contribuir al proyecto:

### Preparación del Entorno
Asegúrate de contar con [Node.js](https://nodejs.org/) y el gestor de paquetes [pnpm](https://pnpm.io/) instalado globalmente.

1. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

2. **Servidor de desarrollo (HMR local):**
   ```bash
   pnpm run dev
   ```

---

## 📄 Licencia
Este proyecto está bajo la Licencia MIT.
