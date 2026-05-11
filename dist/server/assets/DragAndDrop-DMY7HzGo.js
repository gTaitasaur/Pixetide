import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { v as validateImageFile } from "./Workspace-CQbPe-KQ.js";
const DragAndDrop = ({ onImageSelected }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState(null);
  const processFile = (file) => {
    setError(null);
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }
    const url = URL.createObjectURL(file);
    onImageSelected(url, file);
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
      processFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };
  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "drag-drop-container", children: [
    error && /* @__PURE__ */ jsx("div", { className: "error-message", children: error }),
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
              className: "file-input",
              onChange: handleChange,
              "aria-label": "Subir imagen"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "drop-zone-content", children: [
            /* @__PURE__ */ jsx("svg", { className: "upload-icon", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: "Elige una imagen para empezar" }),
            /* @__PURE__ */ jsx("span", { className: "text-secondary", children: "Haz clic o arrastra tu archivo aquí (Máx. 20MB)" })
          ] })
        ]
      }
    )
  ] });
};
export {
  DragAndDrop as D
};
