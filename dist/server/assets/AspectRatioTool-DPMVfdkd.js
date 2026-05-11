import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, convertToPixelCrop } from "react-image-crop";
import { r as runMagickTask } from "./magickEngine-B7AqSoyl.js";
import { v as validateImageFile, W as Workspace } from "./Workspace-CQbPe-KQ.js";
import { D as DragAndDrop } from "./DragAndDrop-DMY7HzGo.js";
import { I as ImagePreviewCanvas } from "./ImagePreviewCanvas-Daf59Qua.js";
import { s as showToast } from "../entry-server.js";
import "react-dom/server";
import "react-router";
import "react-router-dom";
const ASPECT_RATIOS = [
  {
    label: "Libre",
    subLabel: "A tu gusto",
    value: void 0,
    icon: "M4 4h16v16H4z M4 4l16 16 M20 4l-16 16"
  },
  {
    label: "1:1",
    subLabel: "Instagram Post",
    value: 1 / 1,
    icon: "M5 5h14v14H5z"
  },
  {
    label: "4:5",
    subLabel: "Instagram Portrait",
    value: 4 / 5,
    icon: "M7 3h10v18H7z"
  },
  {
    label: "2:3",
    subLabel: "Pinterest Pin",
    value: 2 / 3,
    icon: "M8 2h8v20H8z"
  },
  {
    label: "16:9",
    subLabel: "YouTube / TV",
    value: 16 / 9,
    icon: "M2 8h20v8H2z"
  },
  {
    label: "9:16",
    subLabel: "Stories / Reels",
    value: 9 / 16,
    icon: "M6 1h12v22H6z"
  }
];
const AspectRatioControls = ({
  currentRatio,
  disabled,
  onChangeRatio
}) => {
  return /* @__PURE__ */ jsxs("div", { className: `aspect-ratio-selector ${disabled ? "is-disabled" : ""}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "aspect-ratio-header", children: [
      /* @__PURE__ */ jsx("h3", { className: "aspect-ratio-title", children: "Selecciona un formato" }),
      /* @__PURE__ */ jsx("span", { className: "aspect-ratio-hint", children: "Ajusta tu imagen a las medidas ideales" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "aspect-ratio-grid", children: ASPECT_RATIOS.map((option) => /* @__PURE__ */ jsxs(
      "button",
      {
        className: `aspect-chip ${currentRatio === option.value ? "is-active" : ""}`,
        onClick: () => onChangeRatio(option.value),
        disabled,
        title: option.subLabel,
        children: [
          /* @__PURE__ */ jsx("div", { className: "aspect-chip-icon-wrapper", children: option.icon ? /* @__PURE__ */ jsx("svg", { className: "aspect-chip-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { d: option.icon, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }) : /* @__PURE__ */ jsx("div", { className: "aspect-chip-icon-placeholder", children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }) }) }) }),
          /* @__PURE__ */ jsxs("div", { className: "aspect-chip-info", children: [
            /* @__PURE__ */ jsx("span", { className: "aspect-chip-label", children: option.label }),
            /* @__PURE__ */ jsx("span", { className: "aspect-chip-ratio", children: option.subLabel })
          ] })
        ]
      },
      option.label
    )) })
  ] });
};
const exportCroppedImage = async (image, crop) => {
  const response = await fetch(image.src);
  const buffer = await response.arrayBuffer();
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const cropX = Math.round(crop.x * scaleX);
  const cropY = Math.round(crop.y * scaleY);
  const cropWidth = Math.max(1, Math.round(crop.width * scaleX));
  const cropHeight = Math.max(1, Math.round(crop.height * scaleY));
  try {
    const { buffer: outBuffer, format } = await runMagickTask("CROP_IMAGE", {
      buffer,
      cropX,
      cropY,
      cropWidth,
      cropHeight
    }, [buffer]);
    const blob = new Blob([new Uint8Array(outBuffer)], { type: `image/${format.toLowerCase()}` });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(error);
    throw new Error("Fallo al recortar la imagen con el motor profesional");
  }
};
const CropperModule = ({ imageUrl, onImageSelected }) => {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [aspect, setAspect] = useState(void 0);
  const [isExporting, setIsExporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [naturalDim, setNaturalDim] = useState({ w: 0, h: 0 });
  const [renderDim, setRenderDim] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const stageRef = useRef(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, [imageUrl]);
  useEffect(() => {
    if (naturalDim.w === 0 || containerSize.w === 0) return;
    const ratio = Math.min(containerSize.w / naturalDim.w, containerSize.h / naturalDim.h);
    const newRenderDim = {
      w: Math.floor(naturalDim.w * ratio),
      h: Math.floor(naturalDim.h * ratio)
    };
    setRenderDim(newRenderDim);
    if (!crop && newRenderDim.w > 0) {
      const initialCrop = aspect ? centerCrop(makeAspectCrop({ unit: "%", width: 100 }, aspect, newRenderDim.w, newRenderDim.h), newRenderDim.w, newRenderDim.h) : { unit: "%", x: 0, y: 0, width: 100, height: 100 };
      setCrop(initialCrop);
      setCompletedCrop(convertToPixelCrop(initialCrop, newRenderDim.w, newRenderDim.h));
    } else if (crop && newRenderDim.w > 0) {
      setCompletedCrop(convertToPixelCrop(crop, newRenderDim.w, newRenderDim.h));
    }
  }, [containerSize, naturalDim, aspect]);
  const processNewFile = (file) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    const url = URL.createObjectURL(file);
    onImageSelected(url, file);
    setNaturalDim({ w: 0, h: 0 });
    setRenderDim({ w: 0, h: 0 });
    setCrop(void 0);
    setCompletedCrop(null);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processNewFile(e.dataTransfer.files[0]);
    }
  };
  const onImageLoad = useCallback((e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNaturalDim({ w: naturalWidth, h: naturalHeight });
  }, []);
  const handleRatioChange = (newAspect) => {
    setAspect(newAspect);
    if (renderDim.w > 0) {
      const newCrop = newAspect ? centerCrop(makeAspectCrop({ unit: "%", width: 100 }, newAspect, renderDim.w, renderDim.h), renderDim.w, renderDim.h) : { unit: "%", x: 0, y: 0, width: 100, height: 100 };
      setCrop(newCrop);
      setCompletedCrop(convertToPixelCrop(newCrop, renderDim.w, renderDim.h));
    }
  };
  const handleDownload = async () => {
    if (!completedCrop || !imgRef.current) return;
    if (isExporting) return;
    setIsExporting(true);
    try {
      const localUrl = await exportCroppedImage(imgRef.current, completedCrop);
      const a = document.createElement("a");
      a.href = localUrl;
      a.download = `recorte-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(localUrl);
    } catch (error) {
      console.error("Error exportando:", error);
      showToast("No se pudo procesar la imagen. Asegúrate de que el archivo aún sea accesible.", "error");
    } finally {
      setIsExporting(false);
    }
  };
  if (!imageUrl) {
    return /* @__PURE__ */ jsx(DragAndDrop, { onImageSelected });
  }
  return /* @__PURE__ */ jsxs("div", { className: "cropper-container fade-in", children: [
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
    ),
    /* @__PURE__ */ jsx("div", { className: "cropper-top-bar", children: /* @__PURE__ */ jsxs("button", { className: "btn-text-action", onClick: () => {
      var _a;
      return (_a = fileInputRef.current) == null ? void 0 : _a.click();
    }, children: [
      /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { marginRight: "8px" }, children: [
        /* @__PURE__ */ jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
        /* @__PURE__ */ jsx("polyline", { points: "17 8 12 3 7 8" }),
        /* @__PURE__ */ jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15" })
      ] }),
      "Subir Otra Foto"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "cropper-main-layout", children: [
      /* @__PURE__ */ jsx("div", { className: "cropper-workspace", children: /* @__PURE__ */ jsx(
        ImagePreviewCanvas,
        {
          imageUrl,
          maxHeight: "65vh",
          className: isDragOver ? "cropper-drag-over" : "",
          children: /* @__PURE__ */ jsxs(
            "div",
            {
              ref: stageRef,
              className: "cropper-canvas-inner",
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
                renderDim.w > 0 && /* @__PURE__ */ jsx(
                  ReactCrop,
                  {
                    crop,
                    onChange: (c) => setCrop(c),
                    onComplete: (c) => setCompletedCrop(c),
                    aspect,
                    keepSelection: true,
                    style: { width: renderDim.w, height: renderDim.h },
                    children: /* @__PURE__ */ jsx(
                      "img",
                      {
                        ref: imgRef,
                        src: imageUrl,
                        alt: "Imagen para recortar",
                        style: { width: renderDim.w, height: renderDim.h, display: "block" },
                        onLoad: onImageLoad
                      }
                    )
                  }
                ),
                renderDim.w === 0 && /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: imageUrl,
                    alt: "Loading",
                    style: { opacity: 0, position: "absolute" },
                    onLoad: onImageLoad
                  }
                )
              ]
            }
          )
        }
      ) }),
      /* @__PURE__ */ jsxs("aside", { className: "cropper-sidebar", children: [
        /* @__PURE__ */ jsx(
          AspectRatioControls,
          {
            currentRatio: aspect,
            disabled: !imageUrl,
            onChangeRatio: handleRatioChange
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "cropper-actions-panel", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "btn-download-primary",
              onClick: handleDownload,
              disabled: !completedCrop || isExporting,
              children: isExporting ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("div", { className: "btn-spinner" }),
                "Procesando..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", style: { marginRight: "10px" }, children: [
                  /* @__PURE__ */ jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
                  /* @__PURE__ */ jsx("polyline", { points: "7 10 12 15 17 10" }),
                  /* @__PURE__ */ jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
                ] }),
                "Descargar Recorte"
              ] })
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "cropper-legal-hint", children: "Máxima calidad. 100% privado." })
        ] })
      ] })
    ] })
  ] });
};
const AspectRatioTool = () => {
  const [currentImage, setCurrentImage] = useState(null);
  return /* @__PURE__ */ jsxs("div", { className: "home-container", style: { paddingBottom: "80px" }, children: [
    /* @__PURE__ */ jsxs("header", { className: "tool-header", children: [
      /* @__PURE__ */ jsxs("h1", { className: "tool-title", children: [
        "Recorte y ",
        /* @__PURE__ */ jsx("span", { children: "Aspect Ratio." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "tool-subtitle", children: "Ajusta tus fotos a los formatos ideales para Instagram, TikTok o Web. Todo el procesamiento es local y privado en tu navegador." })
    ] }),
    /* @__PURE__ */ jsx(Workspace, { children: /* @__PURE__ */ jsx(
      CropperModule,
      {
        imageUrl: currentImage,
        onImageSelected: (url) => setCurrentImage(url)
      }
    ) })
  ] });
};
export {
  AspectRatioTool
};
