import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { D as DragAndDrop } from "./DragAndDrop-DMY7HzGo.js";
import { I as ImagePreviewCanvas } from "./ImagePreviewCanvas-Daf59Qua.js";
import "../entry-server.js";
import { W as Workspace } from "./Workspace-CQbPe-KQ.js";
import "react-dom/server";
import "react-router";
import "react-router-dom";
const ImageComparisonSlider = ({ originalSrc, resultSrc }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, x / rect.width * 100));
    setSliderPosition(percent);
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleMouseUp);
    } else {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);
  return /* @__PURE__ */ jsx(ImagePreviewCanvas, { imageUrl: resultSrc, maxHeight: "60vh", className: "comparison-wrapper", children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: "comparison-container",
      ref: containerRef,
      onMouseMove: handleMouseMove,
      onTouchMove: handleTouchMove,
      onMouseLeave: handleMouseUp,
      children: [
        /* @__PURE__ */ jsx("img", { src: resultSrc, alt: "Resultado sin fondo", className: "comparison-img-base", draggable: false }),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "comparison-overlay",
            style: { clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` },
            children: /* @__PURE__ */ jsx("img", { src: originalSrc, alt: "Original con fondo", className: "comparison-img-overlay", draggable: false })
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "comparison-slider-line",
            style: { left: `${sliderPosition}%` },
            onMouseDown: () => setIsDragging(true),
            onTouchStart: () => setIsDragging(true),
            children: /* @__PURE__ */ jsx("div", { className: "comparison-slider-handle", children: /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 9l4-4 4 4m0 6l-4 4-4-4", transform: "rotate(90 12 12)" }) }) })
          }
        )
      ]
    }
  ) });
};
function WorkerWrapper(options) {
  return new Worker(
    "/assets/bgRemoval.worker-C0ZQlsfo.js",
    {
      type: "module",
      name: options == null ? void 0 : options.name
    }
  );
}
const MaskEditor = ({ originalSrc, resultSrc, onSave, onCancel }) => {
  const containerRef = useRef(null);
  const displayCanvasRef = useRef(null);
  const originalImgRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const historyRef = useRef([]);
  const historyStepRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [mode, setMode] = useState("restore");
  const [brushSize, setBrushSize] = useState(30);
  const [isReady, setIsReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false);
  const isMiddlePan = useRef(false);
  const lastPos = useRef(null);
  const renderFrameId = useRef(0);
  useEffect(() => {
    let active = true;
    const loadImages = async () => {
      const origImg = new Image();
      const resImg = new Image();
      const loadImg = (img, src) => new Promise((resolve, reject) => {
        img.crossOrigin = "anonymous";
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = src;
      });
      try {
        await Promise.all([loadImg(origImg, originalSrc), loadImg(resImg, resultSrc)]);
        if (!active) return;
        originalImgRef.current = origImg;
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = origImg.width;
        maskCanvas.height = origImg.height;
        const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
        if (maskCtx) {
          maskCtx.drawImage(resImg, 0, 0);
        }
        maskCanvasRef.current = maskCanvas;
        saveHistoryState();
        setIsReady(true);
      } catch (err) {
        console.error("Error cargando imágenes para edición", err);
      }
    };
    loadImages();
    return () => {
      active = false;
      cancelAnimationFrame(renderFrameId.current);
    };
  }, [originalSrc, resultSrc]);
  const saveHistoryState = () => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    if (historyStepRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
    }
    historyRef.current.push(imageData);
    if (historyRef.current.length > 30) {
      historyRef.current.shift();
    } else {
      historyStepRef.current++;
    }
    setCanUndo(historyStepRef.current > 0);
  };
  const handleUndo = () => {
    if (historyStepRef.current <= 0 || !maskCanvasRef.current) return;
    historyStepRef.current--;
    const imageData = historyRef.current[historyStepRef.current];
    const ctx = maskCanvasRef.current.getContext("2d");
    ctx == null ? void 0 : ctx.putImageData(imageData, 0, 0);
    setCanUndo(historyStepRef.current > 0);
    cancelAnimationFrame(renderFrameId.current);
    renderFrameId.current = requestAnimationFrame(renderDisplay);
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const renderDisplay = () => {
    const dCanvas = displayCanvasRef.current;
    const mCanvas = maskCanvasRef.current;
    const oImg = originalImgRef.current;
    if (!dCanvas || !mCanvas || !oImg) return;
    if (dCanvas.width !== oImg.width) {
      dCanvas.width = oImg.width;
      dCanvas.height = oImg.height;
    }
    const ctx = dCanvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);
    ctx.drawImage(oImg, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(mCanvas, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  };
  useEffect(() => {
    if (isReady) {
      renderDisplay();
    }
  }, [isReady]);
  const getCoordinates = (clientX, clientY) => {
    const canvas = displayCanvasRef.current;
    if (!canvas || !originalImgRef.current) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };
  const startDrawing = (clientX, clientY) => {
    isDrawing.current = true;
    hasDrawn.current = false;
    const coords = getCoordinates(clientX, clientY);
    if (!coords) return;
    lastPos.current = { ...coords, rawX: clientX, rawY: clientY };
    if (mode !== "pan") {
      drawStroke(clientX, clientY);
    }
  };
  const drawStroke = (clientX, clientY) => {
    if (!isDrawing.current || !lastPos.current || !maskCanvasRef.current) return;
    if (mode === "pan") {
      const deltaX = clientX - lastPos.current.rawX;
      const deltaY = clientY - lastPos.current.rawY;
      setPan((p) => ({ x: p.x + deltaX, y: p.y + deltaY }));
      lastPos.current = { ...lastPos.current, rawX: clientX, rawY: clientY };
      return;
    }
    hasDrawn.current = true;
    const currentPos = getCoordinates(clientX, clientY);
    if (!currentPos) return;
    const ctx = maskCanvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    const rect = displayCanvasRef.current.getBoundingClientRect();
    const scale = maskCanvasRef.current.width / rect.width;
    ctx.lineWidth = brushSize * scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (mode === "restore") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#000000";
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "#000000";
    }
    ctx.stroke();
    lastPos.current = { ...currentPos, rawX: clientX, rawY: clientY };
    cancelAnimationFrame(renderFrameId.current);
    renderFrameId.current = requestAnimationFrame(renderDisplay);
  };
  const stopDrawing = () => {
    isDrawing.current = false;
    lastPos.current = null;
    if (hasDrawn.current && mode !== "pan") {
      saveHistoryState();
      hasDrawn.current = false;
    }
  };
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleNativeWheel = (e) => {
      e.preventDefault();
      setZoom((z) => {
        const newZoom = z - e.deltaY * 2e-3;
        return Math.max(0.5, Math.min(newZoom, 5));
      });
    };
    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleNativeWheel);
  }, []);
  const initialPinchDist = useRef(null);
  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      isDrawing.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    } else {
      startDrawing(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const onTouchMove = (e) => {
    if (e.touches.length === 2 && initialPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = dist - initialPinchDist.current;
      setZoom((z) => Math.max(0.5, Math.min(z + delta * 0.01, 5)));
      initialPinchDist.current = dist;
    } else if (e.touches.length === 1) {
      drawStroke(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const onTouchEnd = () => {
    initialPinchDist.current = null;
    stopDrawing();
  };
  const handleMouseDown = (e) => {
    if (e.button === 1) {
      e.preventDefault();
      isMiddlePan.current = true;
      lastPos.current = { x: 0, y: 0, rawX: e.clientX, rawY: e.clientY };
      return;
    }
    startDrawing(e.clientX, e.clientY);
  };
  const handleMouseMove = (e) => {
    if (isMiddlePan.current) {
      if (!lastPos.current) return;
      const deltaX = e.clientX - lastPos.current.rawX;
      const deltaY = e.clientY - lastPos.current.rawY;
      setPan((p) => ({ x: p.x + deltaX, y: p.y + deltaY }));
      lastPos.current = { ...lastPos.current, rawX: e.clientX, rawY: e.clientY };
      return;
    }
    drawStroke(e.clientX, e.clientY);
  };
  const handleMouseUp = (e) => {
    if (e.button === 1 || isMiddlePan.current) {
      isMiddlePan.current = false;
      lastPos.current = null;
      return;
    }
    stopDrawing();
  };
  const getCursor = () => {
    if (isMiddlePan.current) return "grabbing";
    if (mode === "pan") return "grab";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize}" height="${brushSize}" viewBox="0 0 ${brushSize} ${brushSize}"><circle cx="${brushSize / 2}" cy="${brushSize / 2}" r="${brushSize / 2 - 1}" fill="rgba(255,255,255,0.2)" stroke="black" stroke-width="1.5"/><circle cx="${brushSize / 2}" cy="${brushSize / 2}" r="${Math.max(0, brushSize / 2 - 2.5)}" fill="none" stroke="white" stroke-width="1.5"/></svg>`;
    const b64 = btoa(svg);
    return `url('data:image/svg+xml;base64,${b64}') ${brushSize / 2} ${brushSize / 2}, crosshair`;
  };
  const handleSave = async () => {
    if (!displayCanvasRef.current) return;
    displayCanvasRef.current.toBlob((blob) => {
      if (blob) onSave(blob);
    }, "image/png");
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "bgrm-workspace fade-in", children: /* @__PURE__ */ jsx(ImagePreviewCanvas, { imageUrl: originalSrc, maxHeight: "60vh", className: "bgrm-editor-canvas-wrapper", children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: "bgrm-editor-workspace",
        ref: containerRef,
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        onMouseLeave: handleMouseUp,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        style: { cursor: getCursor() },
        children: [
          !isReady && /* @__PURE__ */ jsx("div", { className: "spinner", style: { margin: "40px auto", borderColor: "var(--color-accent)", borderTopColor: "transparent" } }),
          /* @__PURE__ */ jsx(
            "canvas",
            {
              ref: displayCanvasRef,
              className: "bgrm-paint-canvas",
              style: {
                display: isReady ? "block" : "none",
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center center",
                transition: mode === "pan" || isMiddlePan.current ? "none" : "transform 0.1s ease-out"
              }
            }
          )
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsxs("aside", { className: "bgrm-sidebar fade-in", children: [
      /* @__PURE__ */ jsxs("div", { className: "bgrm-controls-section", children: [
        /* @__PURE__ */ jsx("h4", { className: "bgrm-control-title", children: "🖌️ Perfeccionar" }),
        /* @__PURE__ */ jsx("p", { className: "bgrm-loading-desc", style: { marginBottom: "10px" }, children: "Usa el pincel para restaurar partes borradas por error o borrar restos de fondo." }),
        /* @__PURE__ */ jsxs("div", { className: "bgrm-editor-toolbar-grid", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: `bgrm-tool-btn ${mode === "restore" ? "is-active" : ""}`,
              onClick: () => setMode("restore"),
              children: [
                /* @__PURE__ */ jsx("span", { className: "tool-icon", children: "✨" }),
                /* @__PURE__ */ jsx("span", { children: "Restaurar" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: `bgrm-tool-btn ${mode === "erase" ? "is-active" : ""}`,
              onClick: () => setMode("erase"),
              children: [
                /* @__PURE__ */ jsx("span", { className: "tool-icon", children: "🧹" }),
                /* @__PURE__ */ jsx("span", { children: "Borrar" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: `bgrm-tool-btn ${mode === "pan" ? "is-active" : ""}`,
              onClick: () => setMode("pan"),
              children: [
                /* @__PURE__ */ jsx("span", { className: "tool-icon", children: "🖐️" }),
                /* @__PURE__ */ jsx("span", { children: "Mover" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: "bgrm-tool-btn",
              onClick: handleUndo,
              disabled: !canUndo,
              style: { opacity: canUndo ? 1 : 0.5, cursor: canUndo ? "pointer" : "not-allowed" },
              title: "Deshacer (Ctrl+Z)",
              children: [
                /* @__PURE__ */ jsx("span", { className: "tool-icon", children: "↩️" }),
                /* @__PURE__ */ jsx("span", { children: "Deshacer" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bgrm-brush-size", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "Grosor: ",
            brushSize,
            "px"
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "range",
              min: "5",
              max: "120",
              value: brushSize,
              onChange: (e) => setBrushSize(parseInt(e.target.value))
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bgrm-actions-panel", style: { marginTop: "auto" }, children: [
        /* @__PURE__ */ jsxs("button", { className: "btn-download-primary", onClick: handleSave, children: [
          /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", width: "20", height: "20", style: { marginRight: "8px" }, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }),
          "Guardar Cambios"
        ] }),
        /* @__PURE__ */ jsx("button", { className: "btn-text-action", onClick: onCancel, style: { justifyContent: "center", marginTop: "10px" }, children: "Cancelar edición" })
      ] })
    ] })
  ] });
};
const ToolError = ({
  title = "Error de Procesamiento",
  message,
  onRetry
}) => {
  return /* @__PURE__ */ jsxs("div", { className: "tool-error-container fade-up", children: [
    /* @__PURE__ */ jsx("div", { className: "tool-error-icon", children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", width: "24", height: "24", stroke: "currentColor", strokeWidth: "3", fill: "none", children: [
      /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
      /* @__PURE__ */ jsx("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
      /* @__PURE__ */ jsx("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "tool-error-content", children: [
      /* @__PURE__ */ jsx("h4", { className: "tool-error-title", children: title }),
      /* @__PURE__ */ jsx("p", { className: "tool-error-message", children: message })
    ] }),
    onRetry && /* @__PURE__ */ jsx("button", { className: "tool-error-retry", onClick: onRetry, children: "Reintentar" })
  ] });
};
const BackgroundRemoverModule = () => {
  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const isModelPreloaded = useRef(false);
  const fileInputRef = useRef(null);
  const workerRef = useRef(null);
  useEffect(() => {
    workerRef.current = new WorkerWrapper();
    workerRef.current.onmessage = (e) => {
      const { type, blob, message } = e.data;
      if (type === "preloaded") {
        isModelPreloaded.current = true;
        setStatus((prev) => {
          if (prev === "downloading_model") return "processing";
          return prev;
        });
      } else if (type === "progress") {
        setStatus((prev) => {
          if (prev === "processing") return "downloading_model";
          return prev;
        });
      } else if (type === "result") {
        isModelPreloaded.current = true;
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        setStatus("done");
      } else if (type === "error") {
        console.error("Error desde el worker:", message);
        setErrorMessage(message || "Ocurrió un error inesperado al procesar la imagen.");
        setStatus("error");
      }
    };
    workerRef.current.postMessage({ action: "preload" });
    return () => {
      var _a;
      (_a = workerRef.current) == null ? void 0 : _a.terminate();
    };
  }, []);
  const startProcessing = () => {
    var _a;
    if (!file) return;
    if (!isModelPreloaded.current) {
      setStatus("downloading_model");
    } else {
      setStatus("processing");
    }
    (_a = workerRef.current) == null ? void 0 : _a.postMessage({ action: "remove", file });
  };
  const handleImageSelected = (url, selectedFile) => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setOriginalUrl(url);
    setResultUrl(null);
    setFile(selectedFile);
    setStatus("ready_to_process");
  };
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const url = URL.createObjectURL(selectedFile);
      handleImageSelected(url, selectedFile);
      e.target.value = "";
    }
  };
  const handleSaveMask = (newBlob) => {
    const url = URL.createObjectURL(newBlob);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(url);
    setStatus("done");
  };
  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    const baseName = (file == null ? void 0 : file.name.substring(0, file.name.lastIndexOf("."))) || "imagen";
    a.download = `${baseName}_sin_fondo.png`;
    a.click();
  };
  if (!file) {
    return /* @__PURE__ */ jsx(DragAndDrop, { onImageSelected: handleImageSelected });
  }
  return /* @__PURE__ */ jsxs("div", { className: "bgrm-main-layout fade-in", children: [
    status !== "editing_mask" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "bgrm-workspace", children: [
        status === "ready_to_process" && originalUrl && /* @__PURE__ */ jsx("div", { className: "bgrm-preview-card fade-in", children: /* @__PURE__ */ jsx(
          ImagePreviewCanvas,
          {
            imageUrl: originalUrl,
            maxHeight: "60vh"
          }
        ) }),
        (status === "downloading_model" || status === "processing") && originalUrl && /* @__PURE__ */ jsx("div", { className: "bgrm-preview-card bgrm-loading-preview fade-in", children: /* @__PURE__ */ jsx(
          ImagePreviewCanvas,
          {
            imageUrl: originalUrl,
            maxHeight: "60vh",
            className: "blur-effect"
          }
        ) }),
        status === "error" && /* @__PURE__ */ jsx("div", { style: { width: "100%", maxWidth: "500px", margin: "0 auto" }, children: /* @__PURE__ */ jsx(
          ToolError,
          {
            title: "Error de la IA",
            message: errorMessage,
            onRetry: () => setStatus("ready_to_process")
          }
        ) }),
        status === "done" && originalUrl && resultUrl && /* @__PURE__ */ jsxs("div", { className: "bgrm-result-state fade-in", children: [
          /* @__PURE__ */ jsx("div", { className: "bgrm-preview-card", children: /* @__PURE__ */ jsx(ImageComparisonSlider, { originalSrc: originalUrl, resultSrc: resultUrl }) }),
          /* @__PURE__ */ jsxs("div", { className: "bgrm-slider-hints", children: [
            /* @__PURE__ */ jsx("span", { className: "bgrm-hint-left", children: "Antes" }),
            /* @__PURE__ */ jsx("span", { className: "bgrm-hint-right", children: "Después" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "bgrm-sidebar", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "file",
            accept: "image/*",
            ref: fileInputRef,
            style: { display: "none" },
            onChange: handleFileInputChange
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "bgrm-controls-section", children: [
          /* @__PURE__ */ jsx("h4", { className: "bgrm-control-title", children: "Gestión de Fondo" }),
          status === "ready_to_process" && /* @__PURE__ */ jsxs("div", { className: "bgrm-actions-panel fade-in", children: [
            /* @__PURE__ */ jsx("button", { className: "btn-download-primary", onClick: startProcessing, children: "✨ Quitar Fondo Ahora" }),
            /* @__PURE__ */ jsxs("button", { className: "btn-text-action", onClick: () => {
              var _a;
              return (_a = fileInputRef.current) == null ? void 0 : _a.click();
            }, style: { justifyContent: "center" }, children: [
              /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", width: "18", height: "18", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m-4 4V4" }) }),
              "Elegir otra foto"
            ] })
          ] }),
          (status === "downloading_model" || status === "processing") && /* @__PURE__ */ jsxs("div", { className: "bgrm-sidebar-loading fade-in", children: [
            /* @__PURE__ */ jsx("div", { className: "spinner", style: { borderColor: "var(--color-accent)", borderTopColor: "transparent", margin: "0 auto 20px", width: "40px", height: "40px" } }),
            /* @__PURE__ */ jsx("h3", { className: "bgrm-loading-title", children: status === "downloading_model" ? "Descargando IA..." : "Quitando fondo..." }),
            /* @__PURE__ */ jsx("p", { className: "bgrm-loading-desc", children: status === "downloading_model" ? "Preparando motor inteligente localmente por primera vez." : "La IA está procesando los bordes de tu imagen en tu navegador." })
          ] }),
          status === "done" && /* @__PURE__ */ jsxs("div", { className: "bgrm-actions-panel fade-in", children: [
            /* @__PURE__ */ jsxs("button", { className: "btn-download-primary", onClick: handleDownload, children: [
              /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", width: "24", height: "24", style: { marginRight: "8px" }, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m-4 4V4" }) }),
              "Descargar PNG"
            ] }),
            /* @__PURE__ */ jsx("button", { className: "btn-text-action", onClick: () => setStatus("editing_mask"), style: { justifyContent: "center", marginTop: "10px" }, children: "🖌️ Perfeccionar Recorte" }),
            /* @__PURE__ */ jsxs("button", { className: "btn-text-action", onClick: () => {
              var _a;
              return (_a = fileInputRef.current) == null ? void 0 : _a.click();
            }, style: { justifyContent: "center" }, children: [
              /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", width: "18", height: "18", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m-4 4V4" }) }),
              "Subir nueva foto"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "bgrm-legal-hint", children: "100% procesado localmente. Privacidad total garantizada." })
      ] })
    ] }),
    status === "editing_mask" && originalUrl && resultUrl && /* @__PURE__ */ jsx(
      MaskEditor,
      {
        originalSrc: originalUrl,
        resultSrc: resultUrl,
        onSave: handleSaveMask,
        onCancel: () => setStatus("done")
      }
    )
  ] });
};
const BackgroundRemoverTool = () => {
  return /* @__PURE__ */ jsxs("div", { className: "home-container", style: { paddingBottom: "80px" }, children: [
    /* @__PURE__ */ jsxs("header", { className: "tool-header", children: [
      /* @__PURE__ */ jsxs("h1", { className: "tool-title", children: [
        "Quitar ",
        /* @__PURE__ */ jsx("span", { children: "Fondo con IA." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "tool-subtitle", children: "Elimina el fondo de cualquier imagen mágicamente usando Inteligencia Artificial directamente en tu navegador. Privado, rápido y profesional." })
    ] }),
    /* @__PURE__ */ jsx(Workspace, { children: /* @__PURE__ */ jsx(BackgroundRemoverModule, {}) })
  ] });
};
export {
  BackgroundRemoverTool
};
