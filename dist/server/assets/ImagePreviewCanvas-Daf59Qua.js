import { jsx, jsxs } from "react/jsx-runtime";
import { useRef, useState, useEffect } from "react";
const ImagePreviewCanvas = ({
  imageUrl,
  alt = "Previsualización de imagen",
  maxHeight = "500px",
  className = "",
  imageStyle = {},
  rotate = 0,
  children
}) => {
  const containerRef = useRef(null);
  const [containerDim, setContainerDim] = useState({ w: 0, h: 0 });
  const [hasError, setHasError] = useState(false);
  if (!imageUrl) return null;
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerDim({ w: width, h: height });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);
  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);
  const isRotated90 = Math.abs(rotate / 90) % 2 === 1;
  const finalImageStyle = {
    ...imageStyle,
    maxWidth: isRotated90 ? `${containerDim.h}px` : "100%",
    maxHeight: isRotated90 ? `${containerDim.w}px` : "100%",
    width: "auto",
    height: "auto",
    transformOrigin: "center center"
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: containerRef,
      className: `image-preview-canvas ${className} ${isRotated90 ? "is-rotated" : ""} ${hasError ? "image-preview-canvas--error" : ""}`,
      style: { height: maxHeight, maxHeight },
      children: hasError ? /* @__PURE__ */ jsxs("div", { className: "image-preview-canvas__error-msg", children: [
        /* @__PURE__ */ jsxs("svg", { width: "48", height: "48", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { marginBottom: "10px" }, children: [
          /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
          /* @__PURE__ */ jsx("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
          /* @__PURE__ */ jsx("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })
        ] }),
        /* @__PURE__ */ jsx("p", { children: "No se pudo cargar la imagen. El archivo podría estar corrupto o no ser válido." })
      ] }) : children || /* @__PURE__ */ jsx(
        "img",
        {
          src: imageUrl,
          alt,
          className: "image-preview-canvas__image",
          style: finalImageStyle,
          loading: "lazy",
          onError: () => setHasError(true)
        }
      )
    }
  );
};
export {
  ImagePreviewCanvas as I
};
