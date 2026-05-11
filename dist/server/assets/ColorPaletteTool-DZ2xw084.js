import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useRef } from "react";
import { D as DragAndDrop } from "./DragAndDrop-DMY7HzGo.js";
import { I as ImagePreviewCanvas } from "./ImagePreviewCanvas-Daf59Qua.js";
import { v as validateImageFile, W as Workspace } from "./Workspace-CQbPe-KQ.js";
import { s as showToast } from "../entry-server.js";
import "react-dom/server";
import "react-router";
import "react-router-dom";
const SWATCH_NAMES = {
  Vibrant: "Vibrante",
  DarkVibrant: "Vibrante Oscuro",
  LightVibrant: "Vibrante Claro",
  Muted: "Tenue",
  DarkMuted: "Tenue Oscuro",
  LightMuted: "Tenue Claro"
};
const extractColorsFromImage = async (imageUrl) => {
  const { Vibrant } = await import("node-vibrant/browser");
  const culori = await import("culori");
  const palette = await Vibrant.from(imageUrl).getPalette();
  const swatches = [];
  const keys = ["Vibrant", "LightVibrant", "DarkVibrant", "Muted", "LightMuted", "DarkMuted"];
  for (const key of keys) {
    const swatch = palette[key];
    if (!swatch) continue;
    const [r, g, b] = swatch.rgb;
    const baseColor = { mode: "rgb", r: r / 255, g: g / 255, b: b / 255 };
    const hex = culori.formatHex(baseColor) || "#000000";
    const rgbStr = culori.formatRgb(baseColor) || `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    const hslStr = culori.formatHsl(baseColor) || "";
    const oklchObj = culori.converter("oklch")(baseColor);
    let oklchStr = "";
    if (oklchObj) {
      const l = Math.round((oklchObj.l || 0) * 100);
      const c = (oklchObj.c || 0).toFixed(3);
      const h = Math.round(oklchObj.h || 0);
      oklchStr = `oklch(${l}% ${c} ${h})`;
    }
    const luminance = 0.299 * baseColor.r + 0.587 * baseColor.g + 0.114 * baseColor.b;
    const textColor = luminance > 0.65 ? "#1f2937" : "#ffffff";
    swatches.push({
      name: SWATCH_NAMES[key] || key,
      hex: hex.toUpperCase(),
      rgb: rgbStr,
      hsl: hslStr,
      oklch: oklchStr,
      textColor
    });
  }
  return swatches;
};
const generateHarmonies = async (baseHex) => {
  const culori = await import("culori");
  const chromaModule = await import("chroma-js");
  const chroma = chromaModule.default || chromaModule;
  const baseColor = culori.parse(baseHex);
  if (!baseColor) return [];
  const oklch = culori.converter("oklch")(baseColor);
  const { c, h } = oklch;
  const hue = h || 0;
  const rotate = (angle) => (hue + angle + 360) % 360;
  const types = [
    { name: "Complementario", angle: 180 },
    { name: "Análogo 1", angle: 30 },
    { name: "Análogo 2", angle: -30 },
    { name: "Triádico 1", angle: 120 },
    { name: "Triádico 2", angle: 240 }
  ];
  return types.map((t) => {
    const newColor = { mode: "oklch", l: oklch.l, c, h: rotate(t.angle) };
    const hexCenter = culori.formatHex(newColor) || "#000000";
    const scale = chroma.scale(["#ffffff", hexCenter, "#000000"]).mode("oklch").colors(7);
    const selectedColors = scale.slice(1, 6);
    const colors = selectedColors.map((hex) => {
      const parsed = culori.parse(hex);
      const colorOklch = culori.converter("oklch")(parsed);
      const textL = (colorOklch == null ? void 0 : colorOklch.l) || 0;
      const textColor = textL > 0.65 ? "#1f2937" : "#ffffff";
      const rgb = culori.converter("rgb")(parsed);
      const rgbStr = `rgb(${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(rgb.b * 255)})`;
      const hsl = culori.converter("hsl")(parsed);
      const hslStr = `hsl(${Math.round(hsl.h || 0)}°, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`;
      const oklchStr = `oklch(${colorOklch.l.toFixed(2)}, ${colorOklch.c.toFixed(2)}, ${Math.round(colorOklch.h || 0)}°)`;
      return {
        hex: hex.toUpperCase(),
        rgb: rgbStr,
        hsl: hslStr,
        oklch: oklchStr,
        textColor
      };
    });
    return {
      type: t.name,
      colors
    };
  });
};
const ColorPaletteModule = () => {
  const [imageUrl, setImageUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [swatches, setSwatches] = useState(null);
  const [harmonies, setHarmonies] = useState(null);
  const [format, setFormat] = useState("HEX");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const processNewFile = async (file) => {
    var _a;
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      showToast(validation.error || "Error al validar el archivo.", "error");
      return;
    }
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setIsProcessing(true);
    try {
      const extracted = await extractColorsFromImage(url);
      setSwatches(extracted);
      const vibrant = extracted.find((s) => s.name === "Vibrante");
      if (vibrant) {
        const generated = await generateHarmonies(vibrant.hex);
        setHarmonies(generated);
      } else {
        setHarmonies(null);
      }
    } catch (error) {
      console.error("Error extrayendo colores:", error);
      const isNetworkError = error.name === "ChunkLoadError" || ((_a = error.message) == null ? void 0 : _a.includes("Loading chunk"));
      if (isNetworkError) {
        showToast("Error de conexión: No se pudieron descargar los motores de color. Reintenta o recarga la página.", "error", 6e3);
      } else {
        showToast("No se pudieron extraer los colores de esta imagen.", "error");
      }
      setSwatches(null);
      setHarmonies(null);
    } finally {
      setIsProcessing(false);
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processNewFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };
  const handleCopyColor = (colorCode) => {
    navigator.clipboard.writeText(colorCode).then(() => {
      showToast(`¡Copiado! ${colorCode}`, "success", 2500);
    }).catch(() => {
      showToast("Error al copiar", "error");
    });
  };
  if (!imageUrl) {
    return /* @__PURE__ */ jsx(DragAndDrop, { onImageSelected: (_url, file) => processNewFile(file) });
  }
  const getFormatCode = (color) => {
    switch (format) {
      case "HEX":
        return color.hex;
      case "RGB":
        return color.rgb;
      case "HSL":
        return color.hsl;
      case "OKLCH":
        return color.oklch;
      default:
        return color.hex;
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "cp-container fade-in", children: [
    /* @__PURE__ */ jsxs("div", { className: "cp-top-bar", children: [
      /* @__PURE__ */ jsxs("button", { className: "btn-text-action", onClick: () => {
        var _a;
        return (_a = fileInputRef.current) == null ? void 0 : _a.click();
      }, disabled: isProcessing, children: [
        /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { marginRight: "8px" }, children: [
          /* @__PURE__ */ jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
          /* @__PURE__ */ jsx("polyline", { points: "17 8 12 3 7 8" }),
          /* @__PURE__ */ jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15" })
        ] }),
        "Subir otra foto"
      ] }),
      /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*", ref: fileInputRef, style: { display: "none" }, onChange: (e) => {
        if (e.target.files && e.target.files.length > 0) {
          processNewFile(e.target.files[0]);
          e.target.value = "";
        }
      } })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "cp-main-layout", children: [
      /* @__PURE__ */ jsxs("div", { className: "cp-preview-card", onDragOver: (e) => {
        e.preventDefault();
        setIsDragOver(true);
      }, onDragLeave: (e) => {
        e.preventDefault();
        setIsDragOver(false);
      }, onDrop: handleDrop, children: [
        /* @__PURE__ */ jsx(ImagePreviewCanvas, { imageUrl, maxHeight: "60vh", className: `cp-preview-img ${isProcessing ? "is-processing" : ""} ${isDragOver ? "cropper-drag-over" : ""}`, alt: "Vista previa" }),
        isProcessing && /* @__PURE__ */ jsxs("div", { className: "cp-processing-overlay", children: [
          /* @__PURE__ */ jsx("div", { className: "cp-spinner" }),
          /* @__PURE__ */ jsx("span", { className: "cp-processing-text", children: "Analizando colores..." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "cp-sidebar", children: [
        /* @__PURE__ */ jsxs("div", { className: "cp-section", children: [
          /* @__PURE__ */ jsx("h4", { className: "cp-section-title", children: "Formato de Color" }),
          /* @__PURE__ */ jsx("div", { className: "cp-format-grid", children: ["HEX", "RGB", "HSL", "OKLCH"].map((fmt) => /* @__PURE__ */ jsx("button", { type: "button", className: `cp-format-btn ${format === fmt ? "is-active" : ""}`, onClick: () => setFormat(fmt), children: fmt }, fmt)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "cp-section", children: [
          /* @__PURE__ */ jsx("h4", { className: "cp-section-title", children: "Ayuda" }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.4" }, children: "Haz clic en cualquier bloque de color para copiar su código." })
        ] })
      ] }),
      swatches && !isProcessing && /* @__PURE__ */ jsx("div", { className: "cp-palette-dock", children: swatches.map((swatch, idx) => {
        const code = getFormatCode(swatch);
        return /* @__PURE__ */ jsxs("div", { className: "cp-swatch-item", onClick: () => handleCopyColor(code), title: `Copiar ${swatch.name}`, children: [
          /* @__PURE__ */ jsx("div", { className: "cp-swatch-color", style: { backgroundColor: swatch.hex }, children: /* @__PURE__ */ jsx("span", { className: "cp-swatch-label-overlay", style: { color: swatch.textColor }, children: "Copiar" }) }),
          /* @__PURE__ */ jsxs("div", { className: "cp-swatch-info", children: [
            /* @__PURE__ */ jsx("span", { className: "cp-swatch-name", children: swatch.name }),
            /* @__PURE__ */ jsx("span", { className: "cp-swatch-code", children: code })
          ] })
        ] }, idx);
      }) }),
      harmonies && !isProcessing && /* @__PURE__ */ jsxs("div", { className: "cp-harmonies-wrapper", children: [
        /* @__PURE__ */ jsx("h3", { className: "cp-section-title", style: { marginBottom: "16px", fontSize: "1.5rem" }, children: "Paleta Armónica" }),
        /* @__PURE__ */ jsx("div", { className: "cp-harmonies-list", children: harmonies.map((harmony, idx) => /* @__PURE__ */ jsxs("div", { className: "cp-harmony-row", children: [
          /* @__PURE__ */ jsx("h4", { className: "cp-harmony-type-title", children: harmony.type }),
          /* @__PURE__ */ jsx("div", { className: "cp-harmony-scale", children: harmony.colors.map((color, colorIdx) => {
            const code = getFormatCode(color);
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: "cp-harmony-scale-item",
                onClick: () => handleCopyColor(code),
                title: `Copiar ${code}`,
                children: [
                  /* @__PURE__ */ jsx("div", { className: "cp-harmony-scale-color", style: { backgroundColor: color.hex }, children: /* @__PURE__ */ jsx("span", { className: "cp-harmony-copy-text", style: { color: color.textColor }, children: "Copiar" }) }),
                  /* @__PURE__ */ jsx("span", { className: "cp-harmony-scale-hex", children: code })
                ]
              },
              colorIdx
            );
          }) })
        ] }, idx)) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "cp-legal-hint", children: "Tus colores se extraen localmente. Privacidad total garantizada." })
    ] })
  ] });
};
const ColorPaletteTool = () => {
  return /* @__PURE__ */ jsxs("div", { className: "home-container", style: { paddingBottom: "80px" }, children: [
    /* @__PURE__ */ jsxs("header", { className: "tool-header", children: [
      /* @__PURE__ */ jsxs("h1", { className: "tool-title", children: [
        "Extraer ",
        /* @__PURE__ */ jsx("span", { children: "Paleta de Colores." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "tool-subtitle", children: "Obtén los colores predominantes, vibrantes y tenues de cualquier imagen. Ideal para diseñadores web y creativos. Procesamiento instantáneo y 100% privado." })
    ] }),
    /* @__PURE__ */ jsx(Workspace, { children: /* @__PURE__ */ jsx(ColorPaletteModule, {}) })
  ] });
};
export {
  ColorPaletteTool
};
