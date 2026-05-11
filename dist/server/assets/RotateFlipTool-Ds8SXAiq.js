import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { D as DragAndDrop } from "./DragAndDrop-DMY7HzGo.js";
import { r as runMagickTask } from "./magickEngine-B7AqSoyl.js";
import { v as validateImageFile, W as Workspace } from "./Workspace-CQbPe-KQ.js";
import { I as ImagePreviewCanvas } from "./ImagePreviewCanvas-Daf59Qua.js";
async function processRotationAndFlip(originalFile, params) {
  const buffer = await originalFile.arrayBuffer();
  try {
    const outBuffer = await runMagickTask("ROTATE_FLIP", {
      buffer,
      ...params
    }, [buffer]);
    const resultFile = new File([new Uint8Array(outBuffer)], originalFile.name, {
      type: originalFile.type
    });
    return {
      file: resultFile,
      url: URL.createObjectURL(resultFile)
    };
  } catch (error) {
    console.error("Error al girar/voltear la imagen:", error);
    throw new Error("Fallo al procesar la imagen con el Worker de ImageMagick.");
  }
}
const RotateFlipModule = ({
  originalUrl,
  originalFile,
  onImageSelected
}) => {
  const [params, setParams] = useState({
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  useEffect(() => {
    setParams({
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false
    });
  }, [originalUrl]);
  const processNewFile = (file) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    const url = URL.createObjectURL(file);
    onImageSelected(url, file);
  };
  const handleRotateLeft = () => {
    setParams((prev) => ({ ...prev, rotation: prev.rotation - 90 }));
  };
  const handleRotateRight = () => {
    setParams((prev) => ({ ...prev, rotation: prev.rotation + 90 }));
  };
  const handleFlipHorizontal = () => {
    setParams((prev) => ({ ...prev, flipHorizontal: !prev.flipHorizontal }));
  };
  const handleFlipVertical = () => {
    setParams((prev) => ({ ...prev, flipVertical: !prev.flipVertical }));
  };
  const handleDownload = async () => {
    if (!originalFile) return;
    if (params.rotation % 360 === 0 && !params.flipHorizontal && !params.flipVertical) {
      const a = document.createElement("a");
      a.href = originalUrl;
      a.download = originalFile.name;
      a.click();
      return;
    }
    setIsProcessing(true);
    try {
      const result = await processRotationAndFlip(originalFile, params);
      const a = document.createElement("a");
      a.href = result.url;
      const baseName = originalFile.name.replace(/\.[^/.]+$/, "");
      const ext = originalFile.name.split(".").pop();
      a.download = `${baseName}_modificado.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(result.url), 5e3);
    } catch (error) {
      alert("Hubo un error al procesar la imagen.");
    } finally {
      setIsProcessing(false);
    }
  };
  if (!originalUrl || !originalFile) {
    return /* @__PURE__ */ jsx(DragAndDrop, { onImageSelected });
  }
  const previewStyle = {
    transform: `rotate(${params.rotation}deg) scaleX(${params.flipHorizontal ? -1 : 1}) scaleY(${params.flipVertical ? -1 : 1})`,
    transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
  };
  const hasChanges = params.rotation % 360 !== 0 || params.flipHorizontal || params.flipVertical;
  return /* @__PURE__ */ jsxs("div", { className: "rotate-flip-container fade-in", children: [
    /* @__PURE__ */ jsxs("div", { className: "rf-top-bar", children: [
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
    /* @__PURE__ */ jsxs("div", { className: "rf-main-layout", children: [
      /* @__PURE__ */ jsx("div", { className: "rf-workspace", children: /* @__PURE__ */ jsx("div", { className: "rf-preview-card", children: /* @__PURE__ */ jsx(
        ImagePreviewCanvas,
        {
          imageUrl: originalUrl,
          maxHeight: "60vh",
          imageStyle: previewStyle,
          rotate: params.rotation,
          alt: "Vista previa de rotación"
        }
      ) }) }),
      /* @__PURE__ */ jsxs("aside", { className: "rf-sidebar", children: [
        /* @__PURE__ */ jsxs("div", { className: "rf-controls-section", children: [
          /* @__PURE__ */ jsxs("div", { className: "rf-control-group", children: [
            /* @__PURE__ */ jsx("h4", { className: "rf-control-title", children: "Orientación" }),
            /* @__PURE__ */ jsxs("div", { className: "rf-button-grid", children: [
              /* @__PURE__ */ jsxs("button", { className: "rf-tool-btn", onClick: handleRotateLeft, disabled: isProcessing, title: "Rotar 90° izquierda", children: [
                /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" }) }),
                /* @__PURE__ */ jsx("span", { children: "Rotar -90°" })
              ] }),
              /* @__PURE__ */ jsxs("button", { className: "rf-tool-btn", onClick: handleRotateRight, disabled: isProcessing, title: "Rotar 90° derecha", children: [
                /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" }) }),
                /* @__PURE__ */ jsx("span", { children: "Rotar +90°" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rf-control-group", children: [
            /* @__PURE__ */ jsx("h4", { className: "rf-control-title", children: "Efecto Espejo" }),
            /* @__PURE__ */ jsxs("div", { className: "rf-button-grid", children: [
              /* @__PURE__ */ jsxs("button", { className: `rf-tool-btn ${params.flipHorizontal ? "is-active" : ""}`, onClick: handleFlipHorizontal, disabled: isProcessing, children: [
                /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" }) }),
                /* @__PURE__ */ jsx("span", { children: "Horizontal" })
              ] }),
              /* @__PURE__ */ jsxs("button", { className: `rf-tool-btn ${params.flipVertical ? "is-active" : ""}`, onClick: handleFlipVertical, disabled: isProcessing, children: [
                /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", style: { transform: "rotate(90deg)" }, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" }) }),
                /* @__PURE__ */ jsx("span", { children: "Vertical" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rf-actions-panel", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: `btn-download-primary ${!hasChanges ? "is-original" : ""}`,
              onClick: handleDownload,
              disabled: isProcessing,
              children: isProcessing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("div", { className: "btn-spinner" }),
                "Procesando..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", style: { marginRight: "10px" }, children: [
                  /* @__PURE__ */ jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
                  /* @__PURE__ */ jsx("polyline", { points: "7 10 12 15 17 10" }),
                  /* @__PURE__ */ jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
                ] }),
                !hasChanges ? "Descargar Original" : "Descargar Imagen"
              ] })
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "rf-legal-hint", children: "Procesamiento local: tus datos están seguros." })
        ] })
      ] })
    ] })
  ] });
};
const RotateFlipTool = () => {
  const [activeUrl, setActiveUrl] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const handleImageSelected = (url, file) => {
    setActiveUrl(url);
    setActiveFile(file);
  };
  const handleClear = () => {
    setActiveUrl(null);
    setActiveFile(null);
  };
  return /* @__PURE__ */ jsxs("div", { className: "home-container", style: { paddingBottom: "80px" }, children: [
    /* @__PURE__ */ jsxs("header", { className: "tool-header", children: [
      /* @__PURE__ */ jsxs("h1", { className: "tool-title", children: [
        "Girar y Voltear ",
        /* @__PURE__ */ jsx("span", { children: "Imágenes." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "tool-subtitle", children: "Rota y aplica efectos de espejo a tus fotos de manera fácil y rápida, 100% privado desde tu navegador." })
    ] }),
    /* @__PURE__ */ jsx(Workspace, { children: /* @__PURE__ */ jsx(
      RotateFlipModule,
      {
        originalUrl: activeUrl,
        originalFile: activeFile,
        onImageSelected: handleImageSelected,
        onClear: handleClear
      }
    ) })
  ] });
};
export {
  RotateFlipTool
};
