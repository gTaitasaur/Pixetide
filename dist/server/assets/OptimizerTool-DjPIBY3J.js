import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect } from "react";
import { r as runMagickTask } from "./magickEngine-B7AqSoyl.js";
import { v as validateImageFile, W as Workspace } from "./Workspace-CQbPe-KQ.js";
import { D as DragAndDrop } from "./DragAndDrop-DMY7HzGo.js";
import { I as ImagePreviewCanvas } from "./ImagePreviewCanvas-Daf59Qua.js";
import { s as showToast } from "../entry-server.js";
import "react-dom/server";
import "react-router";
import "react-router-dom";
const OPTIMIZATION_PRESETS = [
  {
    id: "lossless",
    label: "Sin pérdida (Lossless)",
    description: "Elimina únicamente los metadatos ocultos. No comprime ni altera los píxeles de la foto.",
    quality: 1,
    maxWidthOrHeight: 99999
    // Límite virtualmente infinito para preservar original
  },
  {
    id: "normal",
    label: "Normal",
    description: "Aplica una compresión ligera. El ahorro de peso es notable y la pérdida visual es imperceptible al ojo humano.",
    quality: 0.85,
    maxWidthOrHeight: 2400,
    badge: "Recomendado"
  },
  {
    id: "aggressive",
    label: "Agresiva",
    description: "Aumenta la compresión para obtener un archivo liviano. Ideal para cargas web rápidas.",
    quality: 0.7,
    maxWidthOrHeight: 1920
  },
  {
    id: "extreme",
    label: "Máxima",
    description: "Prioriza de manera extrema el bajo peso por sobre la nitidez de los detalles. Puede presentar artefactos de compresión.",
    quality: 0.5,
    maxWidthOrHeight: 1200
  }
];
async function rawOptimizeImage(originalFile, preset, preserveResolution, useWebP) {
  const buffer = await originalFile.arrayBuffer();
  try {
    const outBuffer = await runMagickTask("OPTIMIZE_IMAGE", {
      buffer,
      preset,
      preserveResolution,
      useWebP
    }, [buffer]);
    const mimeType = useWebP ? "image/webp" : originalFile.type;
    const newFileName = useWebP ? originalFile.name.replace(/\.[^/.]+$/, "") + ".webp" : originalFile.name;
    const compressedFile = new File([new Uint8Array(outBuffer)], newFileName, {
      type: mimeType
    });
    const originalSize = originalFile.size;
    const newSize = compressedFile.size;
    let finalFile = compressedFile;
    let finalSize = newSize;
    if (newSize > originalSize) {
      finalFile = originalFile;
      finalSize = originalSize;
    }
    const reductionPercentage = Math.max(0, (originalSize - finalSize) / originalSize * 100);
    return {
      file: finalFile,
      url: URL.createObjectURL(finalFile),
      originalSize,
      newSize: finalSize,
      reductionPercentage
    };
  } catch (error) {
    console.error("Error optimizando imagen:", error);
    throw new Error("Fallo al comprimir la imagen con el Worker de ImageMagick.");
  }
}
const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
const PresetSelector = ({ selectedId, onSelect, disabled }) => {
  return /* @__PURE__ */ jsx("div", { className: "preset-grid", children: OPTIMIZATION_PRESETS.map((preset) => /* @__PURE__ */ jsxs(
    "button",
    {
      className: `preset-chip ${selectedId === preset.id ? "is-active" : ""}`,
      onClick: () => onSelect(preset),
      disabled,
      type: "button",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "chip-content", children: [
          /* @__PURE__ */ jsx("span", { className: "chip-label", children: preset.id === "lossless" ? "Sin pérdida" : preset.label }),
          /* @__PURE__ */ jsxs("span", { className: "chip-value", children: [
            Math.round(preset.quality * 100),
            "%"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "chip-desc", children: preset.id === "lossless" ? "Original" : preset.id === "normal" ? "Equilibrado" : preset.id === "aggressive" ? "Para Web" : "Mínimo peso" })
        ] }),
        preset.id === "normal" && /* @__PURE__ */ jsx("div", { className: "chip-dot" })
      ]
    },
    preset.id
  )) });
};
const OptimizerModule = ({ originalUrl, originalFile, onImageSelected }) => {
  const [selectedPreset, setSelectedPreset] = useState(OPTIMIZATION_PRESETS[1]);
  const [preserveResolution, setPreserveResolution] = useState(false);
  const [useWebP, setUseWebP] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const processNewFile = (file) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      showToast(validation.error || "Error al validar el archivo.", "error");
      return;
    }
    const url = URL.createObjectURL(file);
    onImageSelected(url, file);
    setResult(null);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processNewFile(e.dataTransfer.files[0]);
    }
  };
  const handleOptimize = useCallback(async () => {
    if (!originalFile) return;
    setIsProcessing(true);
    try {
      const optimized = await rawOptimizeImage(originalFile, selectedPreset, preserveResolution, useWebP);
      setResult(optimized);
    } catch (err) {
      console.error(err);
      showToast("Hubo un error al optimizar la imagen.", "error");
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, selectedPreset, preserveResolution, useWebP]);
  useEffect(() => {
    if (originalFile) {
      handleOptimize();
    }
  }, [handleOptimize, originalFile]);
  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = result.file.name;
    a.click();
    showToast("Imagen descargada correctamente.", "success");
  };
  if (!originalUrl) {
    return /* @__PURE__ */ jsx(DragAndDrop, { onImageSelected });
  }
  return /* @__PURE__ */ jsxs("div", { className: "optimizer-container fade-in", children: [
    /* @__PURE__ */ jsxs("div", { className: "opt-top-bar", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: "btn-text-action",
          onClick: () => {
            var _a;
            return (_a = fileInputRef.current) == null ? void 0 : _a.click();
          },
          disabled: isProcessing,
          children: [
            /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { marginRight: "8px" }, children: [
              /* @__PURE__ */ jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
              /* @__PURE__ */ jsx("polyline", { points: "17 8 12 3 7 8" }),
              /* @__PURE__ */ jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15" })
            ] }),
            "Subir otra foto"
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "file",
          accept: "image/*",
          ref: fileInputRef,
          style: { display: "none" },
          onChange: (e) => {
            if (e.target.files && e.target.files.length > 0) {
              processNewFile(e.target.files[0]);
            }
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "opt-main-layout", children: [
      /* @__PURE__ */ jsxs("div", { className: "opt-workspace", children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "opt-preview-card",
            onDragOver: (e) => {
              e.preventDefault();
              setIsDragOver(true);
            },
            onDragLeave: (e) => {
              e.preventDefault();
              setIsDragOver(false);
            },
            onDrop: handleDrop,
            children: [
              /* @__PURE__ */ jsx(
                ImagePreviewCanvas,
                {
                  imageUrl: result ? result.url : originalUrl,
                  maxHeight: "60vh",
                  className: `opt-preview-img ${isProcessing ? "is-processing" : ""} ${isDragOver ? "cropper-drag-over" : ""}`,
                  alt: "Vista previa de optimización"
                }
              ),
              isProcessing && /* @__PURE__ */ jsxs("div", { className: "opt-processing-overlay", children: [
                /* @__PURE__ */ jsx("div", { className: "opt-spinner" }),
                /* @__PURE__ */ jsx("span", { className: "opt-processing-text", children: "Optimizando..." })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "opt-results-bar", children: [
          /* @__PURE__ */ jsxs("div", { className: "opt-res-group", children: [
            /* @__PURE__ */ jsx("span", { className: "opt-res-label", children: "Original" }),
            /* @__PURE__ */ jsx("span", { className: "opt-res-value", children: formatBytes(originalFile.size) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "opt-res-arrow", children: /* @__PURE__ */ jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ jsx("line", { x1: "5", y1: "12", x2: "19", y2: "12" }),
            /* @__PURE__ */ jsx("polyline", { points: "12 5 19 12 12 19" })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "opt-res-group success", children: [
            /* @__PURE__ */ jsx("span", { className: "opt-res-label", children: "Optimizado" }),
            /* @__PURE__ */ jsx("span", { className: "opt-res-value", children: result ? formatBytes(result.newSize) : "---" })
          ] }),
          result && /* @__PURE__ */ jsxs("div", { className: "opt-res-badge", children: [
            "-",
            result.reductionPercentage.toFixed(1),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "optimizer-hint", children: "Tus imágenes se procesan localmente. Nunca se envían a ningún servidor." })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "opt-sidebar", children: [
        /* @__PURE__ */ jsxs("div", { className: "opt-section", children: [
          /* @__PURE__ */ jsx("h4", { className: "opt-section-title", children: "Compresión" }),
          /* @__PURE__ */ jsxs("p", { className: "opt-section-desc", children: [
            "A menor calidad, menor peso. El nivel ",
            /* @__PURE__ */ jsx("strong", { children: "Normal" }),
            " es ideal para la mayoría de casos."
          ] }),
          /* @__PURE__ */ jsx(
            PresetSelector,
            {
              selectedId: selectedPreset.id,
              disabled: isProcessing,
              onSelect: (preset) => setSelectedPreset(preset)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "opt-section", children: [
          /* @__PURE__ */ jsx("h4", { className: "opt-section-title", children: "Opciones" }),
          /* @__PURE__ */ jsxs("div", { className: "opt-advanced", children: [
            /* @__PURE__ */ jsxs("label", { className: "opt-toggle", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  checked: preserveResolution,
                  onChange: (e) => setPreserveResolution(e.target.checked),
                  disabled: isProcessing
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "opt-toggle-content", children: [
                /* @__PURE__ */ jsx("span", { className: "opt-toggle-title", children: "Mantener dimensiones" }),
                /* @__PURE__ */ jsx("span", { className: "opt-toggle-desc", children: "No redimensionar el ancho y alto." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "opt-toggle", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  checked: useWebP,
                  onChange: (e) => setUseWebP(e.target.checked),
                  disabled: isProcessing
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "opt-toggle-content", children: [
                /* @__PURE__ */ jsx("span", { className: "opt-toggle-title", children: "Formato WebP" }),
                /* @__PURE__ */ jsx("span", { className: "opt-toggle-desc", children: "Máxima compresión recomendada por Google." })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "opt-actions", children: /* @__PURE__ */ jsx(
          "button",
          {
            className: "btn-download-primary",
            onClick: handleDownload,
            disabled: isProcessing || !result,
            children: isProcessing ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "btn-spinner" }),
              "Optimizando..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", style: { marginRight: "10px" }, children: [
                /* @__PURE__ */ jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
                /* @__PURE__ */ jsx("polyline", { points: "7 10 12 15 17 10" }),
                /* @__PURE__ */ jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
              ] }),
              "Descargar Imagen"
            ] })
          }
        ) })
      ] })
    ] })
  ] });
};
const OptimizerTool = () => {
  const [currentUrl, setCurrentUrl] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const handleImageSelected = (url, file) => {
    setCurrentUrl(url);
    setCurrentFile(file);
  };
  return /* @__PURE__ */ jsxs("div", { className: "home-container", style: { paddingBottom: "80px" }, children: [
    /* @__PURE__ */ jsxs("header", { className: "tool-header", children: [
      /* @__PURE__ */ jsxs("h1", { className: "tool-title", children: [
        "Comprimir Imágenes ",
        /* @__PURE__ */ jsx("span", { children: "sin Perder Calidad." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "tool-subtitle", children: "Reduce drásticamente el peso de tus fotos JPG, PNG o WebP. Mejora la velocidad de tu web y tu SEO con nuestra compresión local segura." })
    ] }),
    /* @__PURE__ */ jsx(Workspace, { children: /* @__PURE__ */ jsx(
      OptimizerModule,
      {
        originalUrl: currentUrl,
        originalFile: currentFile,
        onImageSelected: handleImageSelected
      }
    ) })
  ] });
};
export {
  OptimizerTool
};
