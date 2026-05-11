import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { v as validateImageFile } from "./Workspace-CQbPe-KQ.js";
import JSZip from "jszip";
import { r as runMagickTask } from "./magickEngine-B7AqSoyl.js";
const MultiDragAndDrop = ({ onFilesSelected, maxFiles }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState(null);
  const processFiles = (fileList) => {
    setError(null);
    const validFiles = [];
    const filesArray = Array.from(fileList);
    for (const file of filesArray) {
      const validation = validateImageFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        setError(`El archivo ${file.name} no es válido: ${validation.error}`);
      }
    }
    if (maxFiles && validFiles.length > maxFiles) {
      setError(`Solo puedes subir un máximo de ${maxFiles} imágenes a la vez.`);
      onFilesSelected(validFiles.slice(0, maxFiles));
    } else if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    } else if (!error) {
      setError("No se encontraron imágenes válidas.");
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };
  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "drag-drop-container", children: [
    error && /* @__PURE__ */ jsx("div", { className: "error-message", style: { marginBottom: "16px" }, children: error }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `drop-zone ${isDragActive ? "active" : ""}`,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
        children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "file",
              accept: "image/*",
              multiple: true,
              className: "file-input",
              onChange: handleChange,
              "aria-label": "Subir imágenes"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "drop-zone-content", children: [
            /* @__PURE__ */ jsx("svg", { className: "upload-icon", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: "Sube varias fotos a la vez" }),
            /* @__PURE__ */ jsx("span", { className: "text-secondary", children: "Haz clic o arrastra tus archivos aquí" })
          ] })
        ]
      }
    )
  ] });
};
const detectTransparency = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const hasAlpha = await runMagickTask("DETECT_TRANSPARENCY", { buffer }, [buffer]);
    return hasAlpha;
  } catch {
    return false;
  }
};
const convertImage = async (file, targetFormat, fallbackColor) => {
  const buffer = await file.arrayBuffer();
  try {
    const outBuffer = await runMagickTask("CONVERT_IMAGE", {
      buffer,
      targetFormat,
      fallbackColor
    }, [buffer]);
    return new Blob([new Uint8Array(outBuffer)], { type: targetFormat });
  } catch (e) {
    throw e instanceof Error ? e : new Error("Fallo en la conversión con el Worker de ImageMagick");
  }
};
const packageZip = async (files) => {
  const zip = new JSZip();
  files.forEach(({ blob, filename }) => {
    zip.file(filename, blob);
  });
  return zip.generateAsync({ type: "blob" });
};
export {
  MultiDragAndDrop as M,
  convertImage as c,
  detectTransparency as d,
  packageZip as p
};
