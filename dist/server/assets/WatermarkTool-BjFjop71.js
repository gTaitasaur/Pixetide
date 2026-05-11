import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { fabric } from "fabric";
import { M as MultiDragAndDrop, p as packageZip } from "./formatConverter-CcW8Vbvh.js";
import { I as ImagePreviewCanvas } from "./ImagePreviewCanvas-Daf59Qua.js";
import { v as validateImageFile, W as Workspace } from "./Workspace-CQbPe-KQ.js";
import { s as showToast } from "../entry-server.js";
import "jszip";
import "./magickEngine-B7AqSoyl.js";
import "react-dom/server";
import "react-router";
import "react-router-dom";
const DEFAULT_TEXT_CONFIG = {
  id: "",
  type: "text",
  text: "Pixetide",
  color: "#ffffff",
  fontFamily: "Inter",
  fontWeight: "bold",
  x: 0.5,
  y: 0.5,
  scale: 0.3,
  rotation: 0,
  opacity: 0.8
};
const DEFAULT_IMAGE_CONFIG = {
  id: "",
  type: "image",
  url: null,
  x: 0.5,
  y: 0.5,
  scale: 0.25,
  rotation: 0,
  opacity: 0.8
};
const WatermarkModule = ({
  photos,
  onAddPhotos,
  onClearAll
}) => {
  const [photoList, setPhotoList] = useState([]);
  const [activePhotoId, setActivePhotoId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState("text");
  const [watermarks, setWatermarks] = useState([]);
  const [activeWmId, setActiveWmId] = useState(null);
  const [hasUploadedImage, setHasUploadedImage] = useState(false);
  useEffect(() => {
    const active = watermarks.find((w) => w.id === activeWmId);
    if (active) setMode(active.type);
  }, [activeWmId, watermarks]);
  const watermarksRef = useRef(watermarks);
  useEffect(() => {
    watermarksRef.current = watermarks;
  }, [watermarks]);
  const activeWmIdRef = useRef(activeWmId);
  useEffect(() => {
    activeWmIdRef.current = activeWmId;
  }, [activeWmId]);
  const processedFilesRef = useRef(/* @__PURE__ */ new Set());
  const hasInitializedRef = useRef(false);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const viewerWrapperRef = useRef(null);
  const [viewerDims, setViewerDims] = useState({ w: 0, h: 0 });
  const addPhotosInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const uploadActionRef = useRef("add");
  useEffect(() => {
    const newFiles = photos.filter((f) => !processedFilesRef.current.has(f));
    if (newFiles.length === 0) return;
    newFiles.forEach((f) => processedFilesRef.current.add(f));
    const newEntries = newFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "idle"
    }));
    setPhotoList((prev) => {
      const updated = [...prev, ...newEntries];
      if (!activePhotoId && updated.length > 0) setActivePhotoId(updated[0].id);
      return updated;
    });
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const initialWm = { ...DEFAULT_TEXT_CONFIG, id: "wm-init" };
      setWatermarks([initialWm]);
      setActiveWmId(initialWm.id);
    }
  }, [photos, activePhotoId]);
  useEffect(() => {
    if (!viewerWrapperRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewerDims({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(viewerWrapperRef.current);
    return () => observer.disconnect();
  }, [activePhotoId]);
  useEffect(() => {
    if (!canvasRef.current || !activePhotoId) return;
    if (!fabricCanvasRef.current) {
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
        selection: false,
        preserveObjectStacking: true
      });
      fabricCanvasRef.current.on("object:modified", handleFabricObjectModified);
      fabricCanvasRef.current.on("selection:created", handleSelection);
      fabricCanvasRef.current.on("selection:updated", handleSelection);
      fabricCanvasRef.current.on("selection:cleared", handleSelectionCleared);
    }
    const activePhoto2 = photoList.find((p) => p.id === activePhotoId);
    if (!activePhoto2) return;
    fabric.Image.fromURL(activePhoto2.previewUrl, (img) => {
      if (!viewerWrapperRef.current || !fabricCanvasRef.current) return;
      const currentCanvas = fabricCanvasRef.current;
      const wrapperW = viewerWrapperRef.current.clientWidth;
      const wrapperH = viewerWrapperRef.current.clientHeight;
      const scaleX = wrapperW / (img.width || 1);
      const scaleY = wrapperH / (img.height || 1);
      const scale = Math.min(scaleX, scaleY, 1);
      const renderW = (img.width || 1) * scale;
      const renderH = (img.height || 1) * scale;
      currentCanvas.setWidth(renderW);
      currentCanvas.setHeight(renderH);
      img.set({
        originX: "left",
        originY: "top",
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false
      });
      currentCanvas.setBackgroundImage(img, currentCanvas.renderAll.bind(currentCanvas));
      renderWatermarks();
    });
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.off("object:modified", handleFabricObjectModified);
        fabricCanvasRef.current.off("selection:created", handleSelection);
        fabricCanvasRef.current.off("selection:updated", handleSelection);
        fabricCanvasRef.current.off("selection:cleared", handleSelectionCleared);
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [activePhotoId, viewerDims.w]);
  const renderWatermarks = () => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas) return;
    const cWidth = fCanvas.getWidth();
    const cHeight = fCanvas.getHeight();
    const refDimension = Math.min(cWidth, cHeight);
    const existingObjects = fCanvas.getObjects();
    const existingMap = /* @__PURE__ */ new Map();
    existingObjects.forEach((obj) => {
      const id = obj.id;
      if (id) existingMap.set(id, obj);
    });
    existingObjects.forEach((obj) => {
      const id = obj.id;
      if (id && !watermarks.find((w) => w.id === id)) {
        fCanvas.remove(obj);
      }
    });
    const applyPropertiesAndClamp = (obj, config) => {
      const targetWidth = refDimension * config.scale;
      obj.scaleToWidth(targetWidth);
      let rawLeft = config.x * cWidth;
      let rawTop = config.y * cHeight;
      const scaledW = obj.getScaledWidth();
      const scaledH = obj.getScaledHeight();
      const halfW = scaledW / 2;
      const halfH = scaledH / 2;
      rawLeft = Math.max(halfW, Math.min(cWidth - halfW, rawLeft));
      rawTop = Math.max(halfH, Math.min(cHeight - halfH, rawTop));
      obj.set({
        left: rawLeft,
        top: rawTop,
        angle: config.rotation,
        opacity: config.opacity
      });
      if (config.id === activeWmId) {
        fCanvas.setActiveObject(obj);
      }
    };
    watermarks.forEach((config) => {
      let obj = existingMap.get(config.id);
      if (obj) {
        const isTypeMismatch = config.type === "text" && obj.type !== "text" || config.type === "image" && obj.type !== "image";
        const isImageChanged = config.type === "image" && obj._blobUrl !== config.url;
        if (isTypeMismatch || isImageChanged) {
          fCanvas.remove(obj);
          obj = void 0;
        }
      }
      if (!obj) {
        if (config.type === "text") {
          const txtCfg = config;
          const textObj = new fabric.Text(txtCfg.text, {
            fontFamily: txtCfg.fontFamily,
            fontWeight: txtCfg.fontWeight,
            fill: txtCfg.color,
            originX: "center",
            originY: "center",
            transparentCorners: false,
            cornerColor: "#2563eb",
            cornerStrokeColor: "#ffffff",
            borderColor: "#2563eb",
            cornerSize: 12,
            padding: 5,
            cornerStyle: "circle"
          });
          textObj.id = config.id;
          fCanvas.add(textObj);
          applyPropertiesAndClamp(textObj, config);
        } else if (config.type === "image" && config.url) {
          fabric.Image.fromURL(config.url, (imgObj) => {
            if (!fabricCanvasRef.current) return;
            imgObj.set({
              originX: "center",
              originY: "center",
              transparentCorners: false,
              cornerColor: "#2563eb",
              cornerStrokeColor: "#ffffff",
              borderColor: "#2563eb",
              cornerSize: 12,
              padding: 5,
              cornerStyle: "circle"
            });
            imgObj.id = config.id;
            imgObj._blobUrl = config.url;
            fabricCanvasRef.current.add(imgObj);
            applyPropertiesAndClamp(imgObj, config);
            fabricCanvasRef.current.renderAll();
          });
        }
      } else {
        if (config.type === "text" && obj.type === "text") {
          const txtCfg = config;
          obj.set({
            text: txtCfg.text,
            fontFamily: txtCfg.fontFamily,
            fontWeight: txtCfg.fontWeight,
            fill: txtCfg.color
          });
        }
        applyPropertiesAndClamp(obj, config);
      }
    });
    fCanvas.renderAll();
  };
  useEffect(() => {
    if (fabricCanvasRef.current) renderWatermarks();
  }, [watermarks, activeWmId]);
  const handleSelection = (e) => {
    var _a;
    const obj = (_a = e.selected) == null ? void 0 : _a[0];
    if (obj && obj.id && obj.id !== activeWmIdRef.current) {
      setActiveWmId(obj.id);
    }
  };
  const handleSelectionCleared = () => {
  };
  const handleFabricObjectModified = (e) => {
    const obj = e.target;
    if (!obj || !obj.id || !fabricCanvasRef.current) return;
    const fCanvas = fabricCanvasRef.current;
    const cWidth = fCanvas.getWidth();
    const cHeight = fCanvas.getHeight();
    const refDimension = Math.min(cWidth, cHeight);
    const newX = (obj.left || 0) / cWidth;
    const newY = (obj.top || 0) / cHeight;
    const newRotation = obj.angle || 0;
    const action = e.action || e.transform && e.transform.action;
    const isDragOrRotate = action === "drag" || action === "rotate";
    let newScale;
    if (!isDragOrRotate) {
      const currentWidth = (obj.width || 1) * (obj.scaleX || 1);
      newScale = currentWidth / refDimension;
    }
    setWatermarks((prev) => prev.map((w) => {
      if (w.id === obj.id) {
        return {
          ...w,
          x: newX,
          y: newY,
          rotation: newRotation,
          ...newScale !== void 0 ? { scale: newScale } : {}
        };
      }
      return w;
    }));
    setPhotoList((prev) => prev.map((p) => p.status === "done" ? { ...p, status: "idle" } : p));
  };
  const updateActiveConfig = (partial) => {
    if (!activeWmId) return;
    setWatermarks((prev) => prev.map((w) => w.id === activeWmId ? { ...w, ...partial } : w));
    resetProcessingStatus();
  };
  const handleAddText = () => {
    const newWm = { ...DEFAULT_TEXT_CONFIG, id: "wm-" + Date.now() };
    setWatermarks([...watermarks, newWm]);
    setActiveWmId(newWm.id);
  };
  const handleTextTabClick = () => {
    setMode("text");
    const existingTextWm = watermarks.find((w) => w.type === "text");
    if (existingTextWm) {
      const currentActive = watermarks.find((w) => w.id === activeWmId);
      if (!currentActive || currentActive.type !== "text") {
        setActiveWmId(existingTextWm.id);
      }
    }
  };
  const handleImageTabClick = () => {
    setMode("image");
    const existingImageWm = watermarks.find((w) => w.type === "image");
    if (existingImageWm) {
      const currentActive = watermarks.find((w) => w.id === activeWmId);
      if (!currentActive || currentActive.type !== "image") {
        setActiveWmId(existingImageWm.id);
      }
    } else {
      if (!hasUploadedImage) {
        setHasUploadedImage(true);
        uploadActionRef.current = "add";
        setTimeout(() => {
          var _a;
          return (_a = logoInputRef.current) == null ? void 0 : _a.click();
        }, 100);
      }
    }
  };
  const handleDuplicate = () => {
    if (!activeWmId) return;
    const activeObj = watermarks.find((w) => w.id === activeWmId);
    if (!activeObj) return;
    const newWm = {
      ...activeObj,
      id: "wm-" + Date.now(),
      x: activeObj.x + 0.05,
      y: activeObj.y + 0.05
    };
    setWatermarks([...watermarks, newWm]);
    setActiveWmId(newWm.id);
  };
  const handleDelete = (id) => {
    const targetId = id || activeWmId;
    if (!targetId) return;
    const updated = watermarks.filter((w) => w.id !== targetId);
    setWatermarks(updated);
    if (activeWmId === targetId) {
      setActiveWmId(updated.length > 0 ? updated[updated.length - 1].id : null);
    }
  };
  const resetProcessingStatus = () => {
    setPhotoList((prev) => prev.map((p) => p.status === "done" ? { ...p, status: "idle" } : p));
  };
  const handleLogoUpload = (file) => {
    const valid = validateImageFile(file);
    if (!valid.isValid) {
      showToast(valid.error || "Archivo inválido", "error");
      return;
    }
    const url = URL.createObjectURL(file);
    if (uploadActionRef.current === "change" && activeWmId) {
      const active = watermarks.find((w) => w.id === activeWmId);
      if (active && active.type === "image" && active.url) {
        URL.revokeObjectURL(active.url);
      }
      updateActiveConfig({ url });
    } else {
      const newWm = { ...DEFAULT_IMAGE_CONFIG, id: "wm-" + Date.now(), url };
      setWatermarks((prev) => [...prev, newWm]);
      setActiveWmId(newWm.id);
      setHasUploadedImage(true);
    }
  };
  const handleRemovePhoto = (id) => {
    setPhotoList((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
        processedFilesRef.current.delete(item.file);
      }
      const updated = prev.filter((p) => p.id !== id);
      if (activePhotoId === id && updated.length > 0) setActivePhotoId(updated[0].id);
      else if (updated.length === 0) setActivePhotoId(null);
      return updated;
    });
  };
  const handleClearAllInternal = () => {
    photoList.forEach((p) => {
      URL.revokeObjectURL(p.previewUrl);
      if (p.resultUrl) URL.revokeObjectURL(p.resultUrl);
    });
    setPhotoList([]);
    setActivePhotoId(null);
    processedFilesRef.current.clear();
    onClearAll();
  };
  const processBatchItem = async (item) => {
    return new Promise((resolve) => {
      fabric.Image.fromURL(item.previewUrl, (bgImg) => {
        const origW = bgImg.width || 800;
        const origH = bgImg.height || 600;
        const refDimension = Math.min(origW, origH);
        const exportCanvas = new fabric.StaticCanvas(null, {
          width: origW,
          height: origH
        });
        bgImg.set({ originX: "left", originY: "top" });
        exportCanvas.setBackgroundImage(bgImg, () => {
        });
        let loadedCount = 0;
        if (watermarks.length === 0) {
          exportCanvas.renderAll();
          const mime = item.file.type === "image/png" ? "image/png" : "image/jpeg";
          const blob = fetch(exportCanvas.toDataURL({ format: mime === "image/png" ? "png" : "jpeg", quality: 0.92 })).then((r) => r.blob());
          resolve(blob);
          return;
        }
        watermarks.forEach((config) => {
          const addObjAndExport = (obj) => {
            const targetWidth = refDimension * config.scale;
            obj.scaleToWidth(targetWidth);
            let rawLeft = config.x * origW;
            let rawTop = config.y * origH;
            const scaledW = obj.getScaledWidth();
            const scaledH = obj.getScaledHeight();
            const halfW = scaledW / 2;
            const halfH = scaledH / 2;
            rawLeft = Math.max(halfW, Math.min(origW - halfW, rawLeft));
            rawTop = Math.max(halfH, Math.min(origH - halfH, rawTop));
            obj.set({
              left: rawLeft,
              top: rawTop,
              originX: "center",
              originY: "center",
              opacity: config.opacity,
              angle: config.rotation
            });
            exportCanvas.add(obj);
            loadedCount++;
            if (loadedCount === watermarks.length) {
              exportCanvas.renderAll();
              const dataUrl = exportCanvas.toDataURL({
                format: item.file.type === "image/png" ? "png" : "jpeg",
                quality: 0.92,
                multiplier: 1
              });
              const arr = dataUrl.split(",");
              const mime = arr[0].match(/:(.*?);/)[1];
              const bstr = atob(arr[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) u8arr[n] = bstr.charCodeAt(n);
              exportCanvas.dispose();
              resolve(new Blob([u8arr], { type: mime }));
            }
          };
          if (config.type === "text") {
            const txtCfg = config;
            const textObj = new fabric.Text(txtCfg.text, {
              fontFamily: txtCfg.fontFamily,
              fontWeight: txtCfg.fontWeight,
              fill: txtCfg.color
            });
            addObjAndExport(textObj);
          } else if (config.type === "image" && config.url) {
            fabric.Image.fromURL(config.url, (imgObj) => {
              addObjAndExport(imgObj);
            });
          } else {
            addObjAndExport(new fabric.Object({ opacity: 0 }));
          }
        });
      });
    });
  };
  const handleProcessAndDownload = async () => {
    setIsProcessing(true);
    const newPhotoList = [...photoList];
    let hasNewResults = false;
    for (let i = 0; i < newPhotoList.length; i++) {
      const item = newPhotoList[i];
      if (item.status !== "done") {
        newPhotoList[i] = { ...item, status: "processing" };
        setPhotoList([...newPhotoList]);
        try {
          const blob = await processBatchItem(item);
          const url = URL.createObjectURL(blob);
          newPhotoList[i] = { ...item, status: "done", resultBlob: blob, resultUrl: url };
          hasNewResults = true;
        } catch (err) {
          console.error(err);
          newPhotoList[i] = { ...item, status: "error" };
        }
        setPhotoList([...newPhotoList]);
      }
    }
    setIsProcessing(false);
    const doneItems = newPhotoList.filter((p) => p.status === "done" && p.resultBlob);
    if (doneItems.length === 0) return;
    if (doneItems.length === 1) {
      const item = doneItems[0];
      const a = document.createElement("a");
      a.href = item.resultUrl;
      const baseName = item.file.name.replace(/\.[^/.]+$/, "");
      const ext = item.file.name.split(".").pop();
      a.download = `${baseName}_watermark.${ext}`;
      a.click();
    } else if (hasNewResults) {
      const zipFiles = doneItems.map((item) => {
        const baseName = item.file.name.replace(/\.[^/.]+$/, "");
        const ext = item.file.name.split(".").pop();
        return { blob: item.resultBlob, filename: `${baseName}_watermark.${ext}` };
      });
      const zipBlob = await packageZip(zipFiles);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(zipBlob);
      a.download = "fotos_watermark.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5e3);
    }
  };
  if (photoList.length === 0) {
    return /* @__PURE__ */ jsx(MultiDragAndDrop, { onFilesSelected: onAddPhotos });
  }
  const activePhoto = photoList.find((p) => p.id === activePhotoId);
  const currentConfig = watermarks.find((w) => w.id === activeWmId) || watermarks[0];
  return /* @__PURE__ */ jsxs("div", { className: "wm-container fade-in", children: [
    /* @__PURE__ */ jsxs("div", { className: "wm-top-bar", children: [
      /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", multiple: true, ref: addPhotosInputRef, style: { display: "none" }, onChange: (e) => {
        if (e.target.files && e.target.files.length > 0) {
          onAddPhotos(Array.from(e.target.files));
          e.target.value = "";
        }
      } }),
      /* @__PURE__ */ jsx("button", { className: "btn-text-action", onClick: () => {
        var _a;
        return (_a = addPhotosInputRef.current) == null ? void 0 : _a.click();
      }, disabled: isProcessing, children: "+ Agregar fotos" }),
      /* @__PURE__ */ jsx("button", { className: "btn-text-action danger", onClick: handleClearAllInternal, disabled: isProcessing, children: "Borrar todo" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "wm-main-layout", children: [
      /* @__PURE__ */ jsxs("div", { className: "wm-workspace", children: [
        activePhoto && /* @__PURE__ */ jsx(ImagePreviewCanvas, { imageUrl: activePhoto.previewUrl, maxHeight: "65vh", className: "wm-preview-wrapper", children: /* @__PURE__ */ jsx("div", { className: "wm-fabric-container", ref: viewerWrapperRef, children: /* @__PURE__ */ jsx("canvas", { ref: canvasRef }) }) }),
        /* @__PURE__ */ jsx("div", { className: "wm-gallery-track", children: photoList.map((item) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: `wm-gallery-thumb ${item.id === activePhotoId ? "is-active" : ""}`,
            onClick: () => setActivePhotoId(item.id),
            children: [
              /* @__PURE__ */ jsx("img", { src: item.previewUrl, alt: "thumb" }),
              item.status === "done" && /* @__PURE__ */ jsx("span", { className: "wm-thumb-badge done", children: "✓" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: "wm-thumb-remove",
                  onClick: (e) => {
                    e.stopPropagation();
                    handleRemovePhoto(item.id);
                  },
                  title: "Eliminar foto",
                  children: /* @__PURE__ */ jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", children: [
                    /* @__PURE__ */ jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                    /* @__PURE__ */ jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
                  ] })
                }
              )
            ]
          },
          item.id
        )) })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "wm-sidebar", children: [
        /* @__PURE__ */ jsxs("div", { className: "wm-layers", children: [
          /* @__PURE__ */ jsx("h4", { children: "Capas" }),
          /* @__PURE__ */ jsx("div", { className: "wm-layers-list", children: watermarks.map((wm) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: `wm-layer-item ${wm.id === activeWmId ? "active" : ""}`,
              onClick: () => setActiveWmId(wm.id),
              children: [
                /* @__PURE__ */ jsx("span", { className: "wm-layer-icon", children: wm.type === "text" ? "T" : "🖼️" }),
                /* @__PURE__ */ jsx("span", { className: "wm-layer-name", children: wm.type === "text" ? wm.text || "Texto" : "Imagen" }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    className: "wm-layer-remove",
                    onClick: (e) => {
                      e.stopPropagation();
                      handleDelete(wm.id);
                    },
                    title: "Eliminar capa",
                    children: /* @__PURE__ */ jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", children: [
                      /* @__PURE__ */ jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                      /* @__PURE__ */ jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
                    ] })
                  }
                )
              ]
            },
            wm.id
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "wm-action-buttons", children: [
            /* @__PURE__ */ jsxs("button", { className: "btn-action-brutal duplicate", onClick: handleDuplicate, title: "Duplicar marca seleccionada", children: [
              /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
                /* @__PURE__ */ jsx("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
              ] }),
              "Duplicar"
            ] }),
            /* @__PURE__ */ jsxs("button", { className: "btn-action-brutal delete", onClick: () => handleDelete(), title: "Eliminar marca seleccionada", children: [
              /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx("polyline", { points: "3 6 5 6 21 6" }),
                /* @__PURE__ */ jsx("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
              ] }),
              "Eliminar"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "wm-tabs", children: [
          /* @__PURE__ */ jsx("button", { className: `wm-tab ${mode === "text" ? "active" : ""}`, onClick: handleTextTabClick, children: "Texto" }),
          /* @__PURE__ */ jsx("button", { className: `wm-tab ${mode === "image" ? "active" : ""}`, onClick: handleImageTabClick, children: "Imagen" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "wm-panel", children: [
          mode === "text" && /* @__PURE__ */ jsx("button", { className: "wm-btn-outline", onClick: handleAddText, style: { marginBottom: "5px" }, children: "+ Agregar otro texto" }),
          mode === "image" && /* @__PURE__ */ jsxs("div", { style: { marginBottom: "5px" }, children: [
            /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", ref: logoInputRef, style: { display: "none" }, onChange: (e) => {
              if (e.target.files && e.target.files[0]) handleLogoUpload(e.target.files[0]);
              e.target.value = "";
            } }),
            /* @__PURE__ */ jsx("button", { className: "wm-btn-outline", onClick: () => {
              var _a;
              uploadActionRef.current = "add";
              (_a = logoInputRef.current) == null ? void 0 : _a.click();
            }, children: "+ Agregar otra imagen" })
          ] }),
          !currentConfig || currentConfig.type !== mode ? /* @__PURE__ */ jsx("div", { style: { textAlign: "center", color: "#666", padding: "20px" }, children: mode === "text" ? "Agrega un texto para comenzar" : "Sube una imagen para comenzar" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            currentConfig.type === "text" ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "wm-control-group", children: [
                /* @__PURE__ */ jsx("label", { children: "Texto de la Marca" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    className: "wm-input",
                    value: currentConfig.text,
                    onChange: (e) => updateActiveConfig({ text: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "wm-control-group split", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { children: "Color" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "color",
                      className: "wm-color-picker",
                      value: currentConfig.color,
                      onChange: (e) => updateActiveConfig({ color: e.target.value })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { children: "Peso" }),
                  /* @__PURE__ */ jsxs("select", { className: "wm-select", value: currentConfig.fontWeight, onChange: (e) => updateActiveConfig({ fontWeight: e.target.value }), children: [
                    /* @__PURE__ */ jsx("option", { value: "normal", children: "Normal" }),
                    /* @__PURE__ */ jsx("option", { value: "bold", children: "Negrita" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "wm-control-group", children: [
                /* @__PURE__ */ jsx("label", { children: "Tipografía" }),
                /* @__PURE__ */ jsxs("select", { className: "wm-select", value: currentConfig.fontFamily, onChange: (e) => updateActiveConfig({ fontFamily: e.target.value }), children: [
                  /* @__PURE__ */ jsx("option", { value: "Inter", children: "Inter" }),
                  /* @__PURE__ */ jsx("option", { value: "Arial", children: "Arial" }),
                  /* @__PURE__ */ jsx("option", { value: "Courier New", children: "Monospace" }),
                  /* @__PURE__ */ jsx("option", { value: "Georgia", children: "Serif" })
                ] })
              ] })
            ] }) : /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("div", { className: "wm-control-group", children: [
              /* @__PURE__ */ jsx("label", { children: "Logo o Firma (PNG/SVG)" }),
              /* @__PURE__ */ jsx("button", { className: "btn-text-action", onClick: () => {
                var _a;
                uploadActionRef.current = "change";
                (_a = logoInputRef.current) == null ? void 0 : _a.click();
              }, children: currentConfig.url ? "Cambiar Imagen" : "Subir Imagen" }),
              currentConfig.url && /* @__PURE__ */ jsx("img", { src: currentConfig.url, alt: "Logo", style: { maxHeight: "40px", marginTop: "10px", objectFit: "contain" } })
            ] }) }),
            /* @__PURE__ */ jsx("hr", { className: "wm-divider" }),
            /* @__PURE__ */ jsxs("div", { className: "wm-control-group", children: [
              /* @__PURE__ */ jsxs("label", { children: [
                "Tamaño (",
                Math.round(currentConfig.scale * 100),
                "%)"
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "range",
                  min: "5",
                  max: "100",
                  value: currentConfig.scale * 100,
                  onChange: (e) => updateActiveConfig({ scale: Number(e.target.value) / 100 })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "wm-control-group", children: [
              /* @__PURE__ */ jsxs("label", { children: [
                "Rotación (",
                Math.round(currentConfig.rotation),
                "°)"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "wm-slider-with-input", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "range",
                    min: "-180",
                    max: "180",
                    value: currentConfig.rotation,
                    onChange: (e) => updateActiveConfig({ rotation: Number(e.target.value) })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    className: "wm-input-number",
                    min: "-180",
                    max: "180",
                    value: Math.round(currentConfig.rotation),
                    onChange: (e) => updateActiveConfig({ rotation: Number(e.target.value) })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "wm-control-group", children: [
              /* @__PURE__ */ jsxs("label", { children: [
                "Opacidad (",
                Math.round(currentConfig.opacity * 100),
                "%)"
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "range",
                  min: "10",
                  max: "100",
                  value: currentConfig.opacity * 100,
                  onChange: (e) => updateActiveConfig({ opacity: Number(e.target.value) / 100 })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "wm-control-group", children: [
              /* @__PURE__ */ jsx("label", { children: "Posición Rápida" }),
              /* @__PURE__ */ jsxs("div", { className: "wm-grid-positioner", children: [
                /* @__PURE__ */ jsx("button", { onClick: () => updateActiveConfig({ x: 0.1, y: 0.1, rotation: 0 }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => updateActiveConfig({ x: 0.5, y: 0.1, rotation: 0 }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => updateActiveConfig({ x: 0.9, y: 0.1, rotation: 0 }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => updateActiveConfig({ x: 0.1, y: 0.5, rotation: 0 }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => updateActiveConfig({ x: 0.5, y: 0.5, rotation: 0 }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => updateActiveConfig({ x: 0.9, y: 0.5, rotation: 0 }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => updateActiveConfig({ x: 0.1, y: 0.9, rotation: 0 }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => updateActiveConfig({ x: 0.5, y: 0.9, rotation: 0 }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => updateActiveConfig({ x: 0.9, y: 0.9, rotation: 0 }) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "btn-download-primary", onClick: handleProcessAndDownload, disabled: isProcessing || watermarks.length === 0, children: isProcessing ? "Procesando..." : "Aplicar y Descargar" })
        ] })
      ] })
    ] })
  ] });
};
const WatermarkTool = () => {
  const [photos, setPhotos] = useState([]);
  const handleAddPhotos = (newFiles) => {
    setPhotos((prev) => [...prev, ...newFiles]);
  };
  const handleClearAll = () => {
    setPhotos([]);
  };
  return /* @__PURE__ */ jsxs("div", { className: "home-container", style: { paddingBottom: "80px" }, children: [
    /* @__PURE__ */ jsxs("header", { className: "tool-header", children: [
      /* @__PURE__ */ jsxs("h1", { className: "tool-title", children: [
        "Poner Marca de ",
        /* @__PURE__ */ jsx("span", { children: "Agua a Fotos." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "tool-subtitle", children: "Protege tus fotos añadiendo tu logo o firma como marca de agua. Todo se procesa localmente en tu navegador para garantizar tu privacidad." })
    ] }),
    /* @__PURE__ */ jsx(Workspace, { children: /* @__PURE__ */ jsx(
      WatermarkModule,
      {
        photos,
        onAddPhotos: handleAddPhotos,
        onClearAll: handleClearAll
      }
    ) })
  ] });
};
export {
  WatermarkTool
};
