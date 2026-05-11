import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef } from "react";
import { D as DragAndDrop } from "./DragAndDrop-DMY7HzGo.js";
import { I as ImagePreviewCanvas } from "./ImagePreviewCanvas-Daf59Qua.js";
import { W as Workspace } from "./Workspace-CQbPe-KQ.js";
const Base64Module = () => {
  const [activeTab, setActiveTab] = useState("encode");
  const [base64String, setBase64String] = useState(null);
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileSize, setFileSize] = useState(0);
  const fileInputRef = useRef(null);
  const [decodeInput, setDecodeInput] = useState("");
  const [decodePreview, setDecodePreview] = useState(null);
  const [decodeError, setDecodeError] = useState(null);
  const [decodedFormat, setDecodedFormat] = useState("png");
  const [copiedLabel, setCopiedLabel] = useState(null);
  const copyTimeoutRef = useRef(null);
  const handleImageSelected = (_url, file) => {
    setFileName(file.name);
    setFileSize(file.size);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64String(reader.result);
    };
    reader.readAsDataURL(file);
  };
  const handleChangeImage = () => {
    var _a;
    (_a = fileInputRef.current) == null ? void 0 : _a.click();
  };
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      handleImageSelected(url, file);
      e.target.value = "";
    }
  };
  const getFormattedCode = (format) => {
    if (!base64String) return "";
    switch (format) {
      case "raw":
        return base64String;
      case "html":
        return `<img src="${base64String}" alt="${fileName}" />`;
      case "css":
        return `background-image: url('${base64String}');`;
    }
  };
  const handleCopy = (format) => {
    const text = getFormattedCode(format);
    navigator.clipboard.writeText(text).then(() => {
      const labels = {
        raw: "Base64 copiado",
        html: "HTML copiado",
        css: "CSS copiado"
      };
      setCopiedLabel(labels[format]);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => setCopiedLabel(null), 2e3);
    });
  };
  const handleDownloadTxt = () => {
    if (!base64String) return;
    const blob = new Blob([base64String], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const baseName = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
    a.download = `${baseName}_base64.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5e3);
  };
  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  const handleDecodeInput = (value) => {
    setDecodeInput(value);
    setDecodeError(null);
    setDecodePreview(null);
    if (!value.trim()) return;
    let fullString = value.trim();
    if (!fullString.startsWith("data:")) {
      fullString = `data:image/png;base64,${fullString}`;
    }
    const formatMatch = fullString.match(/^data:image\/(\w+);base64,/);
    if (!formatMatch) {
      setDecodeError('El texto no parece ser una imagen en Base64 válida. Asegúrate de que comience con "data:image/..." o sea una cadena Base64 pura.');
      return;
    }
    setDecodedFormat(formatMatch[1]);
    const img = new Image();
    img.onload = () => {
      setDecodePreview(fullString);
      setDecodeError(null);
    };
    img.onerror = () => {
      setDecodeError("No se pudo decodificar la imagen. Verifica que el código Base64 esté completo y sea válido.");
      setDecodePreview(null);
    };
    img.src = fullString;
  };
  const handleDownloadDecoded = () => {
    if (!decodePreview) return;
    const a = document.createElement("a");
    a.href = decodePreview;
    a.download = `imagen_decodificada.${decodedFormat}`;
    a.click();
  };
  return /* @__PURE__ */ jsxs("div", { className: "b64-main-layout fade-in", children: [
    /* @__PURE__ */ jsxs("div", { className: "b64-workspace", children: [
      activeTab === "encode" && /* @__PURE__ */ jsx("div", { className: "b64-output-area fade-in", children: !base64String ? /* @__PURE__ */ jsx(DragAndDrop, { onImageSelected: handleImageSelected }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "b64-preview-card", children: /* @__PURE__ */ jsx(
          ImagePreviewCanvas,
          {
            imageUrl: previewUrl,
            maxHeight: "40vh"
          }
        ) }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            className: "b64-textarea",
            readOnly: true,
            value: base64String,
            onClick: (e) => e.target.select(),
            title: "Código Base64 generado"
          }
        )
      ] }) }),
      activeTab === "decode" && /* @__PURE__ */ jsxs("div", { className: "b64-output-area fade-in", children: [
        /* @__PURE__ */ jsx("label", { className: "b64-decode-label", children: "Pega tu código Base64 aquí:" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            className: "b64-textarea b64-decode-input",
            placeholder: "data:image/png;base64,iVBORw0KGgo...",
            value: decodeInput,
            onChange: (e) => handleDecodeInput(e.target.value)
          }
        ),
        decodeError && /* @__PURE__ */ jsxs("div", { className: "b64-decode-error fade-in", children: [
          "⚠️ ",
          decodeError
        ] }),
        decodePreview && /* @__PURE__ */ jsx("div", { className: "b64-preview-card fade-in", style: { marginTop: "var(--spacing-md)" }, children: /* @__PURE__ */ jsx(
          ImagePreviewCanvas,
          {
            imageUrl: decodePreview,
            maxHeight: "40vh"
          }
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("aside", { className: "b64-sidebar", children: [
      /* @__PURE__ */ jsxs("div", { className: "b64-tabs", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: `b64-tab ${activeTab === "encode" ? "active" : ""}`,
            onClick: () => setActiveTab("encode"),
            children: [
              /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", width: "18", height: "18", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }) }),
              "Codificar"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: `b64-tab ${activeTab === "decode" ? "active" : ""}`,
            onClick: () => setActiveTab("decode"),
            children: [
              /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", width: "18", height: "18", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l4 4m0 0l4-4m-4 4V4" }) }),
              "Decodificar"
            ]
          }
        )
      ] }),
      activeTab === "encode" && base64String && /* @__PURE__ */ jsxs("div", { className: "b64-controls-section fade-in", children: [
        /* @__PURE__ */ jsxs("div", { className: "b64-file-info", children: [
          /* @__PURE__ */ jsx("span", { className: "b64-filename", children: fileName }),
          /* @__PURE__ */ jsxs("div", { className: "b64-filesize", children: [
            /* @__PURE__ */ jsx("span", { children: "Original:" }),
            /* @__PURE__ */ jsx("strong", { children: formatBytes(fileSize) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "b64-filesize", children: [
            /* @__PURE__ */ jsx("span", { children: "Base64:" }),
            /* @__PURE__ */ jsx("strong", { children: formatBytes(base64String.length) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "b64-controls-section", style: { marginTop: "10px" }, children: [
          /* @__PURE__ */ jsx("button", { className: "btn-text-action", onClick: () => handleCopy("raw"), style: { justifyContent: "center" }, children: "📋 Copiar Texto Base64" }),
          /* @__PURE__ */ jsxs("button", { className: "btn-text-action", onClick: () => handleCopy("html"), style: { justifyContent: "center" }, children: [
            "</>",
            " Copiar tag HTML"
          ] }),
          /* @__PURE__ */ jsx("button", { className: "btn-text-action", onClick: () => handleCopy("css"), style: { justifyContent: "center" }, children: "🎨 Copiar como CSS" }),
          /* @__PURE__ */ jsxs("button", { className: "btn-download-primary", onClick: handleDownloadTxt, style: { marginTop: "10px" }, children: [
            /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", width: "20", height: "20", style: { marginRight: "8px" }, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m-4 4V4" }) }),
            "Descargar .txt"
          ] }),
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
          /* @__PURE__ */ jsxs("button", { className: "btn-text-action", onClick: handleChangeImage, style: { justifyContent: "center", marginTop: "5px" }, children: [
            /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", width: "18", height: "18", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m-4 4V4" }) }),
            "Elegir otra foto"
          ] }),
          copiedLabel && /* @__PURE__ */ jsxs("div", { className: "b64-copied-toast", children: [
            "✅ ¡",
            copiedLabel,
            "!"
          ] })
        ] })
      ] }),
      activeTab === "encode" && !base64String && /* @__PURE__ */ jsx("div", { className: "b64-controls-section fade-in", children: /* @__PURE__ */ jsx("p", { style: { color: "var(--color-text-secondary)", textAlign: "center", fontSize: "0.95rem" }, children: "Sube una imagen para ver sus opciones de codificación." }) }),
      activeTab === "decode" && /* @__PURE__ */ jsx("div", { className: "b64-controls-section fade-in", children: !decodePreview ? /* @__PURE__ */ jsx("p", { style: { color: "var(--color-text-secondary)", textAlign: "center", fontSize: "0.95rem" }, children: "Pega un código válido en el área de texto para revelar la imagen." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "b64-file-info", children: [
          /* @__PURE__ */ jsx("span", { className: "b64-filename", children: "Formato detectado:" }),
          /* @__PURE__ */ jsx("span", { className: "b64-filesize", style: { fontWeight: "bold", fontSize: "1.2rem", color: "#16a34a" }, children: decodedFormat.toUpperCase() })
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "btn-download-primary", onClick: handleDownloadDecoded, style: { marginTop: "10px" }, children: [
          /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", width: "20", height: "20", style: { marginRight: "8px" }, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m-4 4V4" }) }),
          "Descargar Imagen"
        ] })
      ] }) })
    ] })
  ] });
};
const Base64Tool = () => {
  return /* @__PURE__ */ jsxs("div", { className: "home-container", style: { paddingBottom: "80px" }, children: [
    /* @__PURE__ */ jsxs("header", { className: "tool-header", children: [
      /* @__PURE__ */ jsxs("h1", { className: "tool-title", children: [
        "Convertidor ",
        /* @__PURE__ */ jsx("span", { children: "Base64." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "tool-subtitle", children: "Codifica tus imágenes a Base64 para incrustarlas en HTML o CSS, o decodifica un código Base64 a imagen descargable. Todo el procesamiento es 100% local y privado." })
    ] }),
    /* @__PURE__ */ jsx(Workspace, { children: /* @__PURE__ */ jsx(Base64Module, {}) })
  ] });
};
export {
  Base64Tool
};
