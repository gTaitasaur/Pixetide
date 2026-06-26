<div align="center">

# 🌊 Pixetide

**Una suite web de herramientas de imágenes 100% privada, rápida y local.**

[![Privacidad](https://img.shields.io/badge/Privacidad-100%25_Local-emerald?style=for-the-badge)](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg)
[![Stack](https://img.shields.io/badge/Stack-React_%7C_Vite_%7C_Tailwind_v4-blue?style=for-the-badge)](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg)
[![Procesamiento](https://img.shields.io/badge/Procesamiento-wasm--vips-orange?style=for-the-badge)](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-gray?style=for-the-badge)](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/README.md)

<p align="center">
  A diferencia de los servicios online convencionales que suben tus archivos a la nube, <b>Pixetide procesa todo localmente en tu dispositivo</b>. Tus fotos nunca tocan un servidor externo ni consumen tu ancho de banda en transferencias pesadas.
</p>

---

</div>

## ✨ Pilares del Proyecto

Para ofrecer una alternativa real a los editores tradicionales, Pixetide se fundamenta en tres pilares clave:

<table width="100%">
  <tr>
    <td width="33.3%" align="center" valign="top">
      <h3>🔒 Privacidad Real</h3>
      <p>Cumplimiento estricto de privacidad local. El procesamiento ocurre en sandbox cliente; no hay bases de datos, perfiles ni almacenamiento de imágenes externo.</p>
    </td>
    <td width="33.3%" align="center" valign="top">
      <h3>⚡ Rendimiento Nativo</h3>
      <p>Aprovechamos el hardware de tu dispositivo usando hilos paralelos y código binario optimizado para procesar imágenes pesadas al instante.</p>
    </td>
    <td width="33.3%" align="center" valign="top">
      <h3>🌐 Cero Rastreo</h3>
      <p>Sin cookies invasivas, sin CDNs externos y sin scripts de terceros. Todo el código es auditable, transparente y se sirve de forma autónoma.</p>
    </td>
  </tr>
</table>

---

## 🔄 Comparativa de Flujo de Datos

El diseño arquitectónico de Pixetide reescribe el procesamiento de imágenes web convencional para eliminar el viaje de tus datos por internet:

### Enfoque Convencional (En la nube)
```text
┌───────────┐      Subida (Red)      ┌─────────────┐      Procesado y Almacén
│ Tu Imagen │ ─────────────────────► │  Servidor   │ ───────────────┐
└───────────┘                        │  Externo    │                │ (Riesgo de privacidad)
                                     └─────────────┘                ▼
┌───────────┐      Descarga (Red)    ┌─────────────┐      Imagen Modificada
│ Tu Imagen │ ◄───────────────────── │  Servidor   │ ◄──────────────┘ (Consumo de datos)
└───────────┘                        └─────────────┘
```

### Enfoque Pixetide (100% Local)
```text
┌───────────┐      Carga Local       ┌─────────────┐      Descarga Directa
│ Tu Imagen │ ─────────────────────► │ Navegador   │ ──────────────────► [ Imagen Final ]
└───────────┘                        │ (WASM/GPU)  │                     (Al instante)
                                     └─────────────┘
```

---

## 🛠️ Herramientas Disponibles

La suite está construida de forma totalmente modular. Cada herramienta es independiente y autocontenida:

| Herramienta | Icono | Propósito | Directorio de Código |
| :--- | :---: | :--- | :--- |
| **Comprimir** | 🗜️ | Reduce el peso de imágenes sin pérdida visual de calidad. | [`src/tools/Optimizer`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/Optimizer) |
| **Convertir** | 🔄 | Conversión masiva entre múltiples formatos de imagen. | [`src/tools/Converter`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/Converter) |
| **Recortar** | 📐 | Ajusta dimensiones con relaciones de aspecto exactas. | [`src/tools/AspectRatio`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/AspectRatio) |
| **Girar y Voltear** | ↩️ | Rotaciones precisas y efecto espejo horizontal/vertical. | [`src/tools/RotateFlip`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/RotateFlip) |
| **Quitar Fondo** | 🔮 | Segmentación inteligente de retratos u objetos con IA. | [`src/tools/BackgroundRemover`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/BackgroundRemover) |
| **Marca de Agua** | 🏷️ | Protege imágenes con textos o firmas gráficas en lote. | [`src/tools/Watermark`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/Watermark) |
| **Paleta de Colores**| 🎨 | Extracción automática de colores y códigos hexadecimales. | [`src/tools/ColorPalette`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/ColorPalette) |
| **Imágenes a PDF** | 📄 | Convierte y une múltiples capturas en un archivo PDF. | [`src/tools/ImagesToPdf`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/ImagesToPdf) |
| **Base64** | 🔤 | Codificación y decodificación directa bidireccional. | [`src/tools/Base64`](file:///home/taitasaur/Documentos/AntigravityProjects/MarkWaterImg/src/tools/Base64) |

---

## ⚙️ Arquitectura Técnica

Para competir con las herramientas tradicionales de escritorio desde el navegador, empleamos tecnologías avanzadas en el lado del cliente:

*   **WebAssembly (`wasm-vips`):** Compilamos **libvips** (una de las librerías nativas más eficientes de procesamiento de imagen) a WASM. Esto nos da un motor de procesamiento sumamente veloz con uso mínimo de memoria RAM.
*   **Web Workers (Multihilo):** Desplazamos las operaciones pesadas fuera del hilo principal de la interfaz. De esta forma, la interfaz web nunca se congela ni se torna lenta, manteniendo una respuesta fluida mientras se procesan imágenes complejas en segundo plano.
*   **IA Lenta/Rápida Client-side:** Para herramientas como el removedor de fondos, ejecutamos modelos de aprendizaje profundo locales usando ONNX Runtime Web optimizados para la CPU y GPU del propio usuario.

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

3. **Construcción de producción (SSR/SSG Híbrido):**
   ```bash
   pnpm run build
   ```
   *El bundle optimizado se generará dentro de la carpeta `dist/`.*

---

## Licencia
Este proyecto está bajo la Licencia MIT.
