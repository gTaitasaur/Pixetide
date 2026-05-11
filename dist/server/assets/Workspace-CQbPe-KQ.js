import { jsx } from "react/jsx-runtime";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const validateImageFile = (file) => {
  if (!file.type.startsWith("image/")) {
    return {
      isValid: false,
      error: "El archivo seleccionado no es una imagen válida. Usa formatos como JPG, PNG o WebP."
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: "La imagen es muy pesada. Por favor selecciona una imagen de menos de 20MB."
    };
  }
  return { isValid: true };
};
const Workspace = ({ children, className = "" }) => {
  return /* @__PURE__ */ jsx("div", { className: `tool-workspace-container fade-in ${className}`, children: /* @__PURE__ */ jsx("div", { className: "tool-workspace-content", children }) });
};
export {
  Workspace as W,
  validateImageFile as v
};
