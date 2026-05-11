import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { M as MultiDragAndDrop, d as detectTransparency, c as convertImage, p as packageZip } from "./formatConverter-CcW8Vbvh.js";
import { W as Workspace } from "./Workspace-CQbPe-KQ.js";
import "jszip";
import "./magickEngine-B7AqSoyl.js";
const FORMAT_LABELS = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/avif": "AVIF",
  "image/bmp": "BMP",
  "image/tiff": "TIFF",
  "image/vnd.adobe.photoshop": "PSD",
  "application/postscript": "EPS",
  "image/x-icon": "ICO",
  "image/gif": "GIF"
};
const PERFORMANCE_WARNING_THRESHOLD = 20;
const ConverterModule = ({ files, onAddFiles, onClearAll }) => {
  const [conversionList, setConversionList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalFormat, setGlobalFormat] = useState("image/jpeg");
  const [isDragOver, setIsDragOver] = useState(false);
  const addFilesInputRef = useRef(null);
  const processedFilesRef = useRef(/* @__PURE__ */ new Set());
  useEffect(() => {
    const addNewFiles = async () => {
      const newFiles = files.filter((f) => !processedFilesRef.current.has(f));
      if (newFiles.length === 0) return;
      newFiles.forEach((f) => processedFilesRef.current.add(f));
      const newEntries = newFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        hasTransparency: false,
        targetFormat: globalFormat,
        fallbackColor: "#FFFFFF",
        status: "idle"
      }));
      setConversionList((prev) => [...prev, ...newEntries]);
      for (const entry of newEntries) {
        const hasTransp = await detectTransparency(entry.previewUrl);
        setConversionList(
          (prev) => prev.map((item) => item.id === entry.id ? { ...item, hasTransparency: hasTransp } : item)
        );
      }
    };
    addNewFiles();
  }, [files]);
  const handleRemoveItem = (id) => {
    setConversionList((prev) => {
      const removed = prev.find((i) => i.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
        processedFilesRef.current.delete(removed.file);
      }
      return prev.filter((i) => i.id !== id);
    });
  };
  const handleUpdateFormat = (id, format) => {
    setConversionList((prev) => prev.map((item) => item.id === id ? { ...item, targetFormat: format, status: "idle" } : item));
  };
  const handleUpdateColor = (id, color) => {
    setConversionList((prev) => prev.map((item) => item.id === id ? { ...item, fallbackColor: color } : item));
  };
  const handleGlobalFormatChange = (format) => {
    setGlobalFormat(format);
    setConversionList((prev) => prev.map((item) => ({ ...item, targetFormat: format, status: "idle" })));
  };
  const handleProcessBatch = async () => {
    setIsProcessing(true);
    const itemsToProcess = conversionList.filter((item) => item.status === "idle");
    if (itemsToProcess.length === 0) {
      setIsProcessing(false);
      return;
    }
    const zipPayload = [];
    for (const item of itemsToProcess) {
      setConversionList((prev) => prev.map((p) => p.id === item.id ? { ...p, status: "processing" } : p));
      try {
        const resultBlob = await convertImage(item.file, item.targetFormat, item.fallbackColor);
        const ext = FORMAT_LABELS[item.targetFormat].toLowerCase();
        const baseName = item.file.name.replace(/\.[^/.]+$/, "");
        const newName = `${baseName}_converted.${ext}`;
        zipPayload.push({ blob: resultBlob, filename: newName });
        setConversionList((prev) => prev.map((p) => p.id === item.id ? { ...p, status: "done", resultBlob } : p));
      } catch (err) {
        console.error(err);
        setConversionList((prev) => prev.map((p) => p.id === item.id ? { ...p, status: "error" } : p));
      }
    }
    if (zipPayload.length > 0) {
      if (zipPayload.length === 1) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(zipPayload[0].blob);
        a.download = zipPayload[0].filename;
        a.click();
      } else {
        const zipBlob = await packageZip(zipPayload);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(zipBlob);
        a.download = `Pixetide_Conversiones_${Date.now()}.zip`;
        a.click();
      }
    }
    setIsProcessing(false);
  };
  if (conversionList.length === 0) {
    return /* @__PURE__ */ jsx(MultiDragAndDrop, { onFilesSelected: onAddFiles });
  }
  const handleClearInternal = () => {
    conversionList.forEach((c) => URL.revokeObjectURL(c.previewUrl));
    processedFilesRef.current.clear();
    setConversionList([]);
    onClearAll();
  };
  const showPerformanceWarning = conversionList.length >= PERFORMANCE_WARNING_THRESHOLD;
  const idleCount = conversionList.filter((i) => i.status === "idle").length;
  const truncateFileName = (name, maxLength = 30) => {
    if (name.length <= maxLength) return name;
    const extIndex = name.lastIndexOf(".");
    if (extIndex === -1) return name.slice(0, maxLength) + "...";
    const ext = name.slice(extIndex);
    const base = name.slice(0, extIndex);
    const available = maxLength - ext.length - 3;
    return available > 0 ? base.slice(0, available) + "..." + ext : base.slice(0, 10) + "..." + ext;
  };
  return /* @__PURE__ */ jsxs("div", { className: `converter-main-layout ${isDragOver ? "drag-active" : ""}`, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "converter-workspace",
        onDragOver: (e) => {
          e.preventDefault();
          if (!isProcessing) setIsDragOver(true);
        },
        onDragLeave: (e) => {
          e.preventDefault();
          setIsDragOver(false);
        },
        onDrop: (e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (isProcessing) return;
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const validFiles = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
            if (validFiles.length > 0) onAddFiles(validFiles);
            e.dataTransfer.clearData();
          }
        },
        children: [
          /* @__PURE__ */ jsxs("div", { className: "converter-header-row", children: [
            /* @__PURE__ */ jsxs("h3", { className: "converter-title", children: [
              "Archivos cargados (",
              conversionList.length,
              ")"
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                className: "btn-text-action",
                onClick: () => {
                  var _a;
                  return (_a = addFilesInputRef.current) == null ? void 0 : _a.click();
                },
                disabled: isProcessing,
                children: [
                  /* @__PURE__ */ jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", style: { marginRight: "8px" }, children: /* @__PURE__ */ jsx("path", { d: "M12 5v14M5 12h14" }) }),
                  "Subir más"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "file",
                accept: "image/*",
                multiple: true,
                ref: addFilesInputRef,
                style: { display: "none" },
                onChange: (e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onAddFiles(Array.from(e.target.files));
                    e.target.value = "";
                  }
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "converter-cards-list", children: conversionList.map((item) => {
            var _a;
            const targetBreaksTransparency = ["image/jpeg", "image/bmp"].includes(item.targetFormat);
            const showTransparencyWarning = item.hasTransparency && targetBreaksTransparency;
            return /* @__PURE__ */ jsxs("div", { className: `converter-file-card ${item.status === "done" ? "is-done" : ""}`, children: [
              /* @__PURE__ */ jsxs("div", { className: "card-main", children: [
                /* @__PURE__ */ jsx("div", { className: "card-preview", children: /* @__PURE__ */ jsx("img", { src: item.previewUrl, alt: "Preview" }) }),
                /* @__PURE__ */ jsxs("div", { className: "card-info", children: [
                  /* @__PURE__ */ jsx("span", { className: "file-name", title: item.file.name, children: truncateFileName(item.file.name) }),
                  /* @__PURE__ */ jsxs("div", { className: "file-meta", children: [
                    /* @__PURE__ */ jsx("span", { className: "meta-badge", children: (_a = item.file.type.split("/")[1]) == null ? void 0 : _a.toUpperCase() }),
                    /* @__PURE__ */ jsxs("span", { className: "meta-size", children: [
                      (item.file.size / 1024).toFixed(1),
                      " KB"
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "card-actions", children: [
                  /* @__PURE__ */ jsxs("div", { className: "format-picker", children: [
                    /* @__PURE__ */ jsx("span", { className: "format-arrow", children: "→" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        className: "card-format-select",
                        value: item.targetFormat,
                        onChange: (e) => handleUpdateFormat(item.id, e.target.value),
                        disabled: isProcessing,
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "image/jpeg", children: "JPG" }),
                          /* @__PURE__ */ jsx("option", { value: "image/png", children: "PNG" }),
                          /* @__PURE__ */ jsx("option", { value: "image/webp", children: "WebP" }),
                          /* @__PURE__ */ jsx("option", { value: "image/avif", children: "AVIF" }),
                          /* @__PURE__ */ jsx("option", { value: "image/gif", children: "GIF" }),
                          /* @__PURE__ */ jsx("option", { value: "image/bmp", children: "BMP" }),
                          /* @__PURE__ */ jsx("option", { value: "image/tiff", children: "TIFF" }),
                          /* @__PURE__ */ jsx("option", { value: "image/x-icon", children: "ICO" }),
                          /* @__PURE__ */ jsx("option", { value: "image/vnd.adobe.photoshop", children: "PSD" }),
                          /* @__PURE__ */ jsx("option", { value: "application/postscript", children: "EPS" })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("button", { className: "btn-card-remove", onClick: () => handleRemoveItem(item.id), disabled: isProcessing, title: "Quitar", children: /* @__PURE__ */ jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("path", { d: "M18 6L6 18M6 6l12 12" }) }) })
                ] })
              ] }),
              showTransparencyWarning && /* @__PURE__ */ jsxs("div", { className: "card-transparency-hint", children: [
                /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", style: { color: "#f59e0b" }, children: [
                  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
                  /* @__PURE__ */ jsx("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
                  /* @__PURE__ */ jsx("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  FORMAT_LABELS[item.targetFormat],
                  " no admite transparencia. Elija fondo:"
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "color-pills", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      className: `color-pill ${item.fallbackColor === "#FFFFFF" ? "active" : ""}`,
                      onClick: () => handleUpdateColor(item.id, "#FFFFFF"),
                      disabled: isProcessing,
                      children: " Blanco "
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      className: `color-pill ${item.fallbackColor === "#000000" ? "active" : ""}`,
                      onClick: () => handleUpdateColor(item.id, "#000000"),
                      disabled: isProcessing,
                      children: " Negro "
                    }
                  )
                ] })
              ] }),
              item.status !== "idle" && /* @__PURE__ */ jsxs("div", { className: `card-status-bar status-${item.status}`, children: [
                item.status === "processing" && /* @__PURE__ */ jsx("div", { className: "status-loader" }),
                /* @__PURE__ */ jsx("span", { children: item.status === "processing" ? "Convirtiendo..." : item.status === "done" ? "Listo" : "Error" })
              ] })
            ] }, item.id);
          }) })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("aside", { className: "converter-sidebar", children: [
      /* @__PURE__ */ jsxs("div", { className: "sidebar-section", children: [
        /* @__PURE__ */ jsx("h4", { className: "section-title", children: "Ajustes Globales" }),
        /* @__PURE__ */ jsx("p", { className: "section-desc", children: "Cambia el formato de salida para todos los archivos a la vez." }),
        /* @__PURE__ */ jsxs("div", { className: "global-format-card", children: [
          /* @__PURE__ */ jsx("label", { children: "Convertir a:" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              className: "global-format-select",
              value: globalFormat,
              onChange: (e) => handleGlobalFormatChange(e.target.value),
              disabled: isProcessing,
              children: [
                /* @__PURE__ */ jsx("option", { value: "image/jpeg", children: "JPG" }),
                /* @__PURE__ */ jsx("option", { value: "image/png", children: "PNG" }),
                /* @__PURE__ */ jsx("option", { value: "image/webp", children: "WebP" }),
                /* @__PURE__ */ jsx("option", { value: "image/avif", children: "AVIF" }),
                /* @__PURE__ */ jsx("option", { value: "image/gif", children: "GIF" }),
                /* @__PURE__ */ jsx("option", { value: "image/bmp", children: "BMP" }),
                /* @__PURE__ */ jsx("option", { value: "image/tiff", children: "TIFF" }),
                /* @__PURE__ */ jsx("option", { value: "image/x-icon", children: "ICO" }),
                /* @__PURE__ */ jsx("option", { value: "image/vnd.adobe.photoshop", children: "PSD" }),
                /* @__PURE__ */ jsx("option", { value: "application/postscript", children: "EPS" })
              ]
            }
          )
        ] })
      ] }),
      showPerformanceWarning && /* @__PURE__ */ jsxs("div", { className: "sidebar-alert warning", children: [
        /* @__PURE__ */ jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
          /* @__PURE__ */ jsx("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
          /* @__PURE__ */ jsx("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsxs("strong", { children: [
            conversionList.length,
            " archivos"
          ] }),
          " detectados. El proceso local puede tomar unos segundos."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "sidebar-actions", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "btn-download-primary",
            onClick: handleProcessBatch,
            disabled: isProcessing || idleCount === 0,
            children: isProcessing ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "btn-spinner" }),
              "Procesando..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", style: { marginRight: "10px" }, children: [
                /* @__PURE__ */ jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
                /* @__PURE__ */ jsx("polyline", { points: "7 10 12 15 17 10" }),
                /* @__PURE__ */ jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
              ] }),
              idleCount === conversionList.length ? "Convertir Todo" : "Convertir Pendientes"
            ] })
          }
        ),
        /* @__PURE__ */ jsx("button", { className: "btn-clear-all", onClick: handleClearInternal, disabled: isProcessing, children: "Borrar Todo" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "privacy-hint", children: "Procesamiento local: tus fotos nunca salen de este navegador." })
    ] })
  ] });
};
const ConverterTool = () => {
  const [activeFiles, setActiveFiles] = useState([]);
  const handleAddFiles = (newFiles) => {
    setActiveFiles((prev) => [...prev, ...newFiles]);
  };
  const handleClearAll = () => {
    setActiveFiles([]);
  };
  return /* @__PURE__ */ jsxs("div", { className: "home-container", style: { paddingBottom: "80px" }, children: [
    /* @__PURE__ */ jsxs("header", { className: "tool-header", children: [
      /* @__PURE__ */ jsxs("h1", { className: "tool-title", children: [
        "Convertidor de ",
        /* @__PURE__ */ jsx("span", { children: "Formatos." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "tool-subtitle", children: "Cambia el formato de tus fotos a WebP, AVIF, JPG o PNG masivamente. Todo se procesa en tu navegador para proteger tus archivos originales." })
    ] }),
    /* @__PURE__ */ jsx(Workspace, { children: /* @__PURE__ */ jsx(
      ConverterModule,
      {
        files: activeFiles,
        onAddFiles: handleAddFiles,
        onClearAll: handleClearAll
      }
    ) })
  ] });
};
export {
  ConverterTool
};
