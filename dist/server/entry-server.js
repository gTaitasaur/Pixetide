var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { useState, Suspense, Component, createContext, useCallback } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { useLocation, useNavigate, Link, Outlet, Routes, Route, Navigate } from "react-router-dom";
const Logo = ({ size = 32, className = "" }) => {
  return /* @__PURE__ */ jsxs("div", { className: `pixetide-logo-standalone ${className}`, children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "pixetide-logo-icon",
        style: { width: size, height: size },
        children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
          /* @__PURE__ */ jsx("rect", { x: "6", y: "6", width: "4", height: "4", fill: "black" }),
          /* @__PURE__ */ jsx("rect", { x: "14", y: "6", width: "4", height: "4", fill: "black" }),
          /* @__PURE__ */ jsx("rect", { x: "6", y: "14", width: "4", height: "4", fill: "black" }),
          /* @__PURE__ */ jsx("rect", { x: "14", y: "14", width: "4", height: "4", fill: "black" }),
          /* @__PURE__ */ jsx("rect", { x: "10", y: "10", width: "4", height: "4", fill: "#a855f7" })
        ] })
      }
    ),
    /* @__PURE__ */ jsx("span", { className: "pixetide-logo-text", children: "Pixetide" })
  ] });
};
const SITE_CONFIG = {
  /** Dominio canónico con protocolo. SIN trailing slash. */
  canonicalOrigin: "https://www.pixetide.com",
  /** Nombre de la marca */
  siteName: "Pixetide",
  /** Todos los idiomas soportados */
  locales: ["en", "es"],
  /** Ruta de la imagen OG por defecto (relativa a public/) */
  defaultOgImage: "/og-image.png"
};
const SEO_PAGES = [
  // ─── Home ───
  {
    id: "home",
    path: { en: "/", es: "/es/" },
    title: {
      en: "Pixetide — Free Online Image Tools | 100% Private, No Upload",
      es: "Pixetide — Herramientas de Imagen Gratis | 100% Privado, Sin Subir Archivos"
    },
    description: {
      en: "Free browser-based image tools. Compress, convert, crop, remove backgrounds & more. Your files never leave your device. No signup required.",
      es: "Suite de herramientas de imagen en tu navegador. Comprime, convierte, recorta y más. Tus archivos nunca salen de tu dispositivo. Sin registro."
    },
    h1: {
      en: "Pixetide: Your Private, Fast & Free Image Editing Suite",
      es: "Pixetide: Tu Suite de Edición Local, Rápida y Privada"
    },
    keywords: {
      en: ["free image tools", "online image editor", "private image processing", "no upload image tools", "browser image tools"],
      es: ["herramientas de imagen gratis", "editor de imágenes online", "procesamiento privado de imágenes", "sin subir archivos"]
    }
  },
  // ─── Compress / Optimizar ───
  {
    id: "compress",
    path: { en: "/tools/compress-image", es: "/es/herramientas/comprimir-imagen" },
    title: {
      en: "Compress Images Online Free — No Upload Required | Pixetide",
      es: "Comprimir Imágenes Online Gratis — Sin Subir Archivos | Pixetide"
    },
    description: {
      en: "Reduce image file size up to 80% without quality loss. Works offline in your browser. Supports JPG, PNG, WebP, AVIF. 100% private.",
      es: "Reduce el peso de tus imágenes hasta un 80% sin perder calidad. Funciona en tu navegador. Soporta JPG, PNG, WebP, AVIF. 100% privado."
    },
    h1: {
      en: "Compress Images Online — Fast, Free & Private",
      es: "Comprimir Imágenes Online — Rápido, Gratis y Privado"
    },
    keywords: {
      en: ["compress image online", "reduce image size", "image compressor", "compress jpg", "compress png", "compress webp"],
      es: ["comprimir imagen online", "reducir peso imagen", "compresor de imágenes", "comprimir jpg", "comprimir png"]
    }
  },
  // ─── Convert / Convertir ───
  {
    id: "convert",
    path: { en: "/tools/convert-image", es: "/es/herramientas/convertir-imagen" },
    title: {
      en: "Convert Images Online Free — JPG, PNG, WebP, AVIF | Pixetide",
      es: "Convertir Imágenes Online Gratis — JPG, PNG, WebP, AVIF | Pixetide"
    },
    description: {
      en: "Convert images between formats instantly. Batch convert to WebP or AVIF for faster websites. No upload, runs locally in your browser.",
      es: "Convierte imágenes entre formatos al instante. Conversión masiva a WebP o AVIF. Sin subir archivos, procesamiento local."
    },
    h1: {
      en: "Convert Images to Any Format — Free & Private",
      es: "Convertir Imágenes a Cualquier Formato — Gratis y Privado"
    },
    keywords: {
      en: ["convert image online", "jpg to png", "convert to webp", "image format converter", "convert to avif"],
      es: ["convertir imagen online", "jpg a png", "convertir a webp", "convertidor de formato"]
    }
  },
  // ─── Crop / Recortar ───
  {
    id: "crop",
    path: { en: "/tools/crop-image", es: "/es/herramientas/recortar-imagen" },
    title: {
      en: "Crop Images Online Free — Social Media Presets | Pixetide",
      es: "Recortar Imágenes Online Gratis — Presets Redes Sociales | Pixetide"
    },
    description: {
      en: "Crop photos to perfect aspect ratios for Instagram, Facebook, Twitter. Browser-based, private, instant results. No signup.",
      es: "Recorta fotos con proporciones perfectas para Instagram, Facebook, Twitter. En tu navegador, privado, resultados instantáneos."
    },
    h1: {
      en: "Crop Images for Social Media — Free & Private",
      es: "Recortar Imágenes para Redes Sociales — Gratis y Privado"
    },
    keywords: {
      en: ["crop image online", "crop photo for instagram", "image cropper", "aspect ratio crop", "resize image"],
      es: ["recortar imagen online", "recortar foto instagram", "recortador de imágenes"]
    }
  },
  // ─── Rotate & Flip / Girar y Voltear ───
  {
    id: "rotate-flip",
    path: { en: "/tools/rotate-flip-image", es: "/es/herramientas/girar-voltear-imagen" },
    title: {
      en: "Rotate & Flip Images Online Free | Pixetide",
      es: "Girar y Voltear Imágenes Online Gratis | Pixetide"
    },
    description: {
      en: "Rotate photos any angle or mirror flip them. Quick, private, browser-based. No upload needed. Supports JPG, PNG, WebP.",
      es: "Rota fotos a cualquier ángulo o aplica efecto espejo. Rápido, privado, en tu navegador. Sin subir archivos."
    },
    h1: {
      en: "Rotate & Flip Images — Free & Private",
      es: "Girar y Voltear Imágenes — Gratis y Privado"
    },
    keywords: {
      en: ["rotate image online", "flip image", "mirror image", "rotate photo"],
      es: ["girar imagen online", "voltear imagen", "efecto espejo imagen", "rotar foto"]
    }
  },
  // ─── Watermark / Marca de Agua ───
  {
    id: "watermark",
    path: { en: "/tools/watermark-image", es: "/es/herramientas/marca-de-agua" },
    title: {
      en: "Add Watermark to Images Free — Logo & Text | Pixetide",
      es: "Poner Marca de Agua a Imágenes Gratis — Logo y Texto | Pixetide"
    },
    description: {
      en: "Protect your photos with custom text or logo watermarks. Batch processing, 100% private, no upload required.",
      es: "Protege tus fotos con marcas de agua de texto o logo. Procesamiento masivo, 100% privado, sin subir archivos."
    },
    h1: {
      en: "Add Watermark to Your Images — Free & Private",
      es: "Poner Marca de Agua a tus Imágenes — Gratis y Privado"
    },
    keywords: {
      en: ["add watermark to image", "watermark photo online", "logo watermark", "protect photos"],
      es: ["poner marca de agua", "marca de agua online", "proteger fotos con logo"]
    }
  },
  // ─── Remove Background / Quitar Fondo ───
  {
    id: "remove-bg",
    path: { en: "/tools/remove-background", es: "/es/herramientas/quitar-fondo" },
    title: {
      en: "Remove Background from Image Free — AI Powered | Pixetide",
      es: "Quitar Fondo de Imagen Gratis — Con IA | Pixetide"
    },
    description: {
      en: "Remove image backgrounds instantly using AI. Runs 100% in your browser. No upload, no signup, no watermark on results.",
      es: "Elimina fondos de imágenes con IA directamente en tu navegador. Sin subir archivos, sin registro, sin marca de agua."
    },
    h1: {
      en: "Remove Background from Images — AI-Powered, Free & Private",
      es: "Quitar Fondo de Imágenes — Con IA, Gratis y Privado"
    },
    keywords: {
      en: ["remove background", "background remover", "remove bg online", "transparent background"],
      es: ["quitar fondo", "eliminar fondo imagen", "fondo transparente", "quitar fondo online"]
    }
  },
  // ─── Color Palette / Paleta de Colores ───
  {
    id: "color-palette",
    path: { en: "/tools/color-palette", es: "/es/herramientas/paleta-colores" },
    title: {
      en: "Extract Color Palette from Image Free | Pixetide",
      es: "Extraer Paleta de Colores de Imagen Gratis | Pixetide"
    },
    description: {
      en: "Extract dominant colors from any image. Get HEX codes instantly. Perfect for designers and developers. Runs locally in your browser.",
      es: "Extrae colores dominantes de cualquier imagen. Códigos HEX al instante. Ideal para diseñadores. Procesamiento local."
    },
    h1: {
      en: "Extract Color Palette from Any Image — Free & Private",
      es: "Extraer Paleta de Colores de Cualquier Imagen — Gratis y Privado"
    },
    keywords: {
      en: ["extract color palette", "color picker from image", "get hex colors", "image color extractor"],
      es: ["extraer paleta de colores", "colores de imagen", "obtener código hex", "extractor de colores"]
    }
  },
  // ─── Base64 Converter / Convertidor Base64 ───
  {
    id: "base64",
    path: { en: "/tools/base64-converter", es: "/es/herramientas/convertidor-base64" },
    title: {
      en: "Image to Base64 Converter Free — Encode & Decode | Pixetide",
      es: "Convertidor de Imagen a Base64 Gratis — Codificar y Decodificar | Pixetide"
    },
    description: {
      en: "Convert images to Base64 for HTML/CSS embedding or decode Base64 to image. Bidirectional, instant, 100% private.",
      es: "Convierte imágenes a Base64 para HTML/CSS o decodifica Base64 a imagen. Bidireccional, instantáneo, 100% privado."
    },
    h1: {
      en: "Image to Base64 Converter — Free & Private",
      es: "Convertidor de Imagen a Base64 — Gratis y Privado"
    },
    keywords: {
      en: ["image to base64", "base64 encoder", "base64 to image", "base64 converter"],
      es: ["imagen a base64", "codificador base64", "base64 a imagen", "convertidor base64"]
    }
  }
];
function getSeoByPath(pathname) {
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return SEO_PAGES.find((page) => {
    for (const locale of SITE_CONFIG.locales) {
      const pagePath = page.path[locale];
      const normalizedPagePath = pagePath.endsWith("/") ? pagePath : `${pagePath}/`;
      if (normalizedPagePath === normalized) return true;
    }
    return false;
  });
}
function getLocaleFromPath(pathname) {
  return pathname.startsWith("/es/") || pathname === "/es" ? "es" : "en";
}
function getCanonicalUrl(path) {
  return `${SITE_CONFIG.canonicalOrigin}${path}`;
}
const en = {
  // ─── Navbar ───
  "nav.home": "Home",
  "nav.tools": "Tools",
  "nav.about": "About",
  "nav.openMenu": "Open menu",
  "nav.closeMenu": "Close menu",
  "nav.support": "Support Pixetide ☕",
  "nav.supportMicrocopy": "No ads, no subscriptions. Help me keep it that way.",
  // ─── Language Switcher ───
  "lang.switch": "ES",
  "lang.switchLabel": "Cambiar a español",
  // ─── Footer ───
  "footer.tagline": "Pixetide — 100% browser-powered. Your images never leave your device.",
  "footer.privacy": "Privacy",
  "footer.tools": "All Tools",
  "footer.about": "About",
  "footer.rights": "All rights reserved.",
  // ─── Home Hero ───
  "home.heroTitle": "Pixetide: Your Private, Fast & Free Image Editing Suite",
  "home.heroSubtitle": "Edit, compress, and convert your images without uploading anything. All processing runs locally in your browser to guarantee your privacy. A suite built with care to save you hours of work.",
  // ─── Home Cards ───
  "card.crop.title": "Crop Images for Social Media",
  "card.crop.desc": "Resize your photos to the perfect aspect ratio for Instagram, Facebook, or Pinterest. Crop images online easily without losing quality.",
  "card.compress.title": "Compress Images Without Quality Loss",
  "card.compress.desc": "Reduce the size of your JPG, PNG, or WebP images by up to 80% so your website loads faster. Smart, secure, and instant compression.",
  "card.convert.title": "Convert Image Format",
  "card.convert.desc": "Convert images to WebP, AVIF, JPG, or PNG in bulk. The ideal format to optimize your SEO and improve user experience.",
  "card.rotateFlip.title": "Rotate & Flip Images",
  "card.rotateFlip.desc": "Rotate your photos or apply a mirror effect easily. Ideal for straightening crooked images or creating symmetric compositions — 100% private.",
  "card.watermark.title": "Add Watermark to Photos",
  "card.watermark.desc": "Protect your photographs by adding your logo or text as a watermark. Everything is processed locally in your browser for maximum privacy.",
  "card.upscale.title": "Enhance Image Quality",
  "card.upscale.desc": "Increase the resolution of blurry or old photos. Enlarge images without pixelation using advanced upscaling technology — right in your browser. (Coming Soon)",
  "card.removeBg.title": "Remove Background",
  "card.removeBg.desc": "Magically remove the background from any image using AI directly in your browser. Compare before and after instantly.",
  "card.colorPalette.title": "Extract Color Palette",
  "card.colorPalette.desc": "Extract the dominant colors from any image and get their HEX codes. The ideal tool for web designers and creatives. Instant and local processing.",
  "card.photoEditor.title": "Online Photo Editor",
  "card.photoEditor.desc": "Adjust brightness, contrast, and apply professional filters for free. Fast and private photo editing from the comfort of your screen. (Coming Soon)",
  "card.base64.title": "Base64 Converter",
  "card.base64.desc": "Encode your images to Base64 for embedding in HTML or CSS, or decode Base64 back to an image. Bidirectional, instant, and 100% private.",
  "card.favicon.title": "Favicon ICO Generator",
  "card.favicon.desc": "Create the perfect icon for your website. Upload your logo and convert it to .ico and other standardized formats ready to use. (Coming Soon)",
  // ─── 404 ───
  "notFound.title": "Oops! 404",
  "notFound.message": "This photo got lost in development. The page you're looking for doesn't exist or has been moved.",
  "notFound.backHome": "Back to Home"
};
const es = {
  // ─── Navbar ───
  "nav.home": "Inicio",
  "nav.tools": "Herramientas",
  "nav.about": "Acerca de",
  "nav.openMenu": "Abrir menú",
  "nav.closeMenu": "Cerrar menú",
  "nav.support": "Apoya a Pixetide ☕",
  "nav.supportMicrocopy": "Sin anuncios, sin suscripciones. Ayúdame a que siga así.",
  // ─── Language Switcher ───
  "lang.switch": "EN",
  "lang.switchLabel": "Switch to English",
  // ─── Footer ───
  "footer.tagline": "Pixetide — Rendimiento 100% en tu navegador. Tus imágenes nunca salen de tu dispositivo.",
  "footer.privacy": "Privacidad",
  "footer.tools": "Herramientas",
  "footer.about": "Información",
  "footer.rights": "Todos los derechos reservados.",
  // ─── Home Hero ───
  "home.heroTitle": "Pixetide: Tu Suite de Edición Local, Rápida y Privada",
  "home.heroSubtitle": "Edita, comprime y convierte tus fotos sin subir nada a internet. Todo el procesamiento se realiza localmente en tu navegador para garantizar tu privacidad y ahorrarte horas de trabajo. Una suite creada con dedicación para hacerte la vida más fácil.",
  // ─── Home Cards ───
  "card.crop.title": "Recortar Fotos para Redes",
  "card.crop.desc": "Adapta tus imágenes al tamaño perfecto para Instagram, Facebook o Pinterest. Recorta fotos online fácilmente y sin perder calidad.",
  "card.compress.title": "Comprimir Imágenes sin Perder Calidad",
  "card.compress.desc": "Reduce el peso de tus fotos JPG, PNG o WebP hasta en un 80% para que tu web cargue más rápido. Compresión inteligente, segura y al instante.",
  "card.convert.title": "Convertir Formato de Imagen",
  "card.convert.desc": "Convierte fotos a WebP, AVIF, JPG o PNG de forma masiva. El formato ideal para optimizar tu SEO y mejorar la experiencia de tus usuarios.",
  "card.rotateFlip.title": "Girar y Voltear Imágenes",
  "card.rotateFlip.desc": "Rota tus fotos o aplícales un efecto espejo fácilmente. Ideal para enderezar imágenes torcidas o crear composiciones simétricas de forma 100% privada.",
  "card.watermark.title": "Poner Marca de Agua a Fotos",
  "card.watermark.desc": "Protege tus fotografías añadiendo tu logo o texto como marca de agua. Todo se procesa localmente en tu navegador para garantizar tu privacidad.",
  "card.upscale.title": "Mejorar Calidad de Imagen",
  "card.upscale.desc": "Aumenta la resolución de fotos borrosas o antiguas. Agranda imágenes sin pixelarlas usando tecnología de escalado avanzada desde tu navegador. (Próximamente)",
  "card.removeBg.title": "Quitar Fondo",
  "card.removeBg.desc": "Elimina el fondo de cualquier imagen mágicamente usando IA directamente en tu navegador. Compara el antes y después al instante.",
  "card.colorPalette.title": "Extraer Paleta de Colores",
  "card.colorPalette.desc": "Saca los colores predominantes de cualquier imagen y obtén sus códigos HEX. La herramienta ideal para diseñadores web y creativos. Procesamiento instantáneo y local.",
  "card.photoEditor.title": "Editor de Fotos Online",
  "card.photoEditor.desc": "Ajusta el brillo, contraste y aplica filtros profesionales gratis. Edición fotográfica rápida y privada desde la comodidad de tu pantalla. (Próximamente)",
  "card.base64.title": "Convertidor Base64",
  "card.base64.desc": "Codifica tus imágenes a Base64 para incrustarlas en HTML o CSS, o decodifica un código Base64 a imagen. Bidireccional, instantáneo y 100% privado.",
  "card.favicon.title": "Generador de Favicon ICO",
  "card.favicon.desc": "Crea el icono perfecto para tu página web. Sube tu logo y conviértelo a .ico y otros formatos estandarizados listos para usar. (Próximamente)",
  // ─── 404 ───
  "notFound.title": "¡Ups! 404",
  "notFound.message": "Esta foto se nos ha perdido en el revelado. La página que buscas no existe o ha sido movida a otro álbum.",
  "notFound.backHome": "Volver al Inicio"
};
const translations = {
  en,
  es
};
function useLocale() {
  const { pathname } = useLocation();
  const locale = getLocaleFromPath(pathname);
  const t = (key) => {
    const localeTranslations = translations[locale];
    if (localeTranslations[key]) return localeTranslations[key];
    return translations["en"][key];
  };
  const pathPrefix = locale === "es" ? "/es" : "";
  const getAlternateUrl = (currentPath) => {
    if (locale === "en") {
      return `/es${currentPath}`;
    }
    return currentPath.replace(/^\/es/, "") || "/";
  };
  return { locale, t, pathPrefix, getAlternateUrl };
}
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t, locale } = useLocale();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const homePath = locale === "es" ? "/es/" : "/";
  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  };
  const closeMenu = () => {
    setIsOpen(false);
    document.body.style.overflow = "unset";
  };
  const switchLanguage = () => {
    const targetLocale = locale === "en" ? "es" : "en";
    const currentPage = SEO_PAGES.find((page) => {
      const enPath = page.path.en.replace(/\/$/, "") || "/";
      const esPath = page.path.es.replace(/\/$/, "") || "/es";
      const normalizedCurrent = pathname.replace(/\/$/, "") || "/";
      return normalizedCurrent === enPath || normalizedCurrent === esPath;
    });
    if (currentPage) {
      navigate(currentPage.path[targetLocale]);
    } else {
      navigate(targetLocale === "es" ? "/es/" : "/");
    }
    closeMenu();
  };
  return /* @__PURE__ */ jsxs("div", { className: "navbar-wrapper", children: [
    /* @__PURE__ */ jsx("nav", { className: "navbar", children: /* @__PURE__ */ jsxs("div", { className: "navbar-container", children: [
      /* @__PURE__ */ jsx(Link, { to: homePath, className: "brand-link", onClick: closeMenu, children: /* @__PURE__ */ jsx(Logo, { size: 64 }) }),
      /* @__PURE__ */ jsxs("div", { className: "navbar-links desktop-only", children: [
        /* @__PURE__ */ jsx(Link, { to: homePath, className: "nav-link", children: t("nav.home") }),
        /* @__PURE__ */ jsx(Link, { to: homePath, className: "nav-link", children: t("nav.tools") }),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "lang-switch-btn",
            onClick: switchLanguage,
            "aria-label": t("lang.switchLabel"),
            title: t("lang.switchLabel"),
            children: t("lang.switch")
          }
        ),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "https://ko-fi.com/taitasaur",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "nav-btn-support",
            children: t("nav.support")
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: `burger-menu ${isOpen ? "open" : ""}`,
          onClick: toggleMenu,
          "aria-label": t("nav.openMenu"),
          children: [
            /* @__PURE__ */ jsx("span", { className: "burger-line" }),
            /* @__PURE__ */ jsx("span", { className: "burger-line" }),
            /* @__PURE__ */ jsx("span", { className: "burger-line" })
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: `nav-overlay ${isOpen ? "active" : ""}`, children: [
      /* @__PURE__ */ jsx("button", { className: "close-overlay", onClick: closeMenu, "aria-label": t("nav.closeMenu"), children: "×" }),
      /* @__PURE__ */ jsxs("div", { className: "overlay-content", children: [
        /* @__PURE__ */ jsx(Link, { to: homePath, className: "overlay-link", onClick: closeMenu, children: t("nav.home") }),
        /* @__PURE__ */ jsx(Link, { to: homePath, className: "overlay-link", onClick: closeMenu, children: t("nav.tools") }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: "overlay-link lang-switch-mobile",
            onClick: switchLanguage,
            children: [
              "🌐 ",
              locale === "en" ? "Español" : "English"
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "mobile-support-wrapper", children: [
          /* @__PURE__ */ jsx("span", { className: "mobile-support-microcopy", children: t("nav.supportMicrocopy") }),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "https://ko-fi.com/taitasaur",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "overlay-link support-btn",
              onClick: closeMenu,
              children: t("nav.support")
            }
          )
        ] })
      ] })
    ] })
  ] });
};
const Footer = () => {
  const { t, locale } = useLocale();
  const tools = SEO_PAGES.filter((page) => page.id !== "home");
  return /* @__PURE__ */ jsx("footer", { className: "main-footer", children: /* @__PURE__ */ jsxs("div", { className: "footer-container", children: [
    /* @__PURE__ */ jsxs("div", { className: "footer-grid", children: [
      /* @__PURE__ */ jsxs("div", { className: "footer-col branding", children: [
        /* @__PURE__ */ jsx("h3", { className: "footer-logo", children: "Pixetide" }),
        /* @__PURE__ */ jsx("p", { className: "footer-tagline", children: t("footer.tagline") }),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "https://ko-fi.com/taitasaur",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "footer-kofi",
            children: t("nav.support")
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("nav", { className: "footer-col", "aria-label": t("footer.tools"), children: [
        /* @__PURE__ */ jsx("h4", { className: "footer-title", children: t("footer.tools") }),
        /* @__PURE__ */ jsx("ul", { className: "footer-links", children: tools.map((tool) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: tool.path[locale], className: "footer-link", children: tool.h1[locale].replace(/\s—.*$/, "") }) }, tool.id)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "footer-col", children: [
        /* @__PURE__ */ jsx("h4", { className: "footer-title", children: t("footer.about") }),
        /* @__PURE__ */ jsxs("ul", { className: "footer-links", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: locale === "es" ? "/es/" : "/", className: "footer-link", children: t("nav.home") }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
            "a",
            {
              href: "https://ko-fi.com/taitasaur",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "footer-link",
              children: "Ko-fi"
            }
          ) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "footer-bottom", children: /* @__PURE__ */ jsxs("p", { className: "footer-copy", children: [
      "© ",
      (/* @__PURE__ */ new Date()).getFullYear(),
      " ",
      SITE_CONFIG.siteName,
      ". ",
      t("footer.rights")
    ] }) })
  ] }) });
};
const MainLayout = () => {
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", minHeight: "100vh" }, children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { style: { flex: 1, display: "flex", flexDirection: "column" }, children: /* @__PURE__ */ jsx(Outlet, {}) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
};
const Card = ({ to, icon, title, description, disabled = false }) => {
  const content = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "card-fold" }),
    /* @__PURE__ */ jsx("div", { className: "card-icon", children: icon }),
    /* @__PURE__ */ jsx("h3", { className: "card-title", children: title }),
    /* @__PURE__ */ jsx("p", { className: "card-description", children: description })
  ] });
  if (disabled || !to) {
    return /* @__PURE__ */ jsxs("div", { className: `neobrutal-card-wrapper disabled`, children: [
      /* @__PURE__ */ jsx("div", { className: "card-shadow" }),
      /* @__PURE__ */ jsx("div", { className: "neobrutal-card", children: content })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "neobrutal-card-wrapper", children: [
    /* @__PURE__ */ jsx("div", { className: "card-shadow" }),
    /* @__PURE__ */ jsx(Link, { to, className: "neobrutal-card", children: content })
  ] });
};
function getToolPath(id, locale) {
  const page = SEO_PAGES.find((p) => p.id === id);
  return (page == null ? void 0 : page.path[locale]) ?? "/";
}
const Home = () => {
  const { t, locale } = useLocale();
  return /* @__PURE__ */ jsx("div", { className: "home-container", children: /* @__PURE__ */ jsxs("div", { className: "hub-wrapper", children: [
    /* @__PURE__ */ jsxs("section", { className: "hero-section", children: [
      /* @__PURE__ */ jsx("h1", { className: "hero-title", children: t("home.heroTitle") }),
      /* @__PURE__ */ jsx("p", { className: "hero-subtitle", children: t("home.heroSubtitle") })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "tools-grid", children: [
      /* @__PURE__ */ jsx(
        Card,
        {
          to: getToolPath("crop", locale),
          icon: /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" }) }),
          title: t("card.crop.title"),
          description: t("card.crop.desc")
        }
      ),
      /* @__PURE__ */ jsx(
        Card,
        {
          to: getToolPath("compress", locale),
          icon: /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" }) }),
          title: t("card.compress.title"),
          description: t("card.compress.desc")
        }
      ),
      /* @__PURE__ */ jsx(
        Card,
        {
          to: getToolPath("convert", locale),
          icon: /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" }) }),
          title: t("card.convert.title"),
          description: t("card.convert.desc")
        }
      ),
      /* @__PURE__ */ jsx(
        Card,
        {
          to: getToolPath("rotate-flip", locale),
          icon: /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }),
          title: t("card.rotateFlip.title"),
          description: t("card.rotateFlip.desc")
        }
      ),
      /* @__PURE__ */ jsx(
        Card,
        {
          to: getToolPath("watermark", locale),
          icon: /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" }) }),
          title: t("card.watermark.title"),
          description: t("card.watermark.desc")
        }
      ),
      /* @__PURE__ */ jsx(
        Card,
        {
          disabled: true,
          icon: /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" }) }),
          title: t("card.upscale.title"),
          description: t("card.upscale.desc")
        }
      ),
      /* @__PURE__ */ jsx(
        Card,
        {
          to: getToolPath("remove-bg", locale),
          icon: /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" }) }),
          title: t("card.removeBg.title"),
          description: t("card.removeBg.desc")
        }
      ),
      /* @__PURE__ */ jsx(
        Card,
        {
          to: getToolPath("color-palette", locale),
          icon: /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" }) }),
          title: t("card.colorPalette.title"),
          description: t("card.colorPalette.desc")
        }
      ),
      /* @__PURE__ */ jsx(
        Card,
        {
          disabled: true,
          icon: /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" }) }),
          title: t("card.photoEditor.title"),
          description: t("card.photoEditor.desc")
        }
      ),
      /* @__PURE__ */ jsx(
        Card,
        {
          to: getToolPath("base64", locale),
          icon: /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" }) }),
          title: t("card.base64.title"),
          description: t("card.base64.desc")
        }
      ),
      /* @__PURE__ */ jsx(
        Card,
        {
          disabled: true,
          icon: /* @__PURE__ */ jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" }) }),
          title: t("card.favicon.title"),
          description: t("card.favicon.desc")
        }
      )
    ] })
  ] }) });
};
const NotFound = () => {
  const { t, locale } = useLocale();
  const homePath = locale === "es" ? "/es/" : "/";
  return /* @__PURE__ */ jsx("div", { className: "error-page-container", children: /* @__PURE__ */ jsxs("div", { className: "error-content-card", children: [
    /* @__PURE__ */ jsx("div", { className: "error-icon-wrapper", children: /* @__PURE__ */ jsxs(
      "svg",
      {
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "error-svg",
        children: [
          /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
          /* @__PURE__ */ jsx("line", { x1: "8", y1: "15", x2: "16", y2: "15" }),
          /* @__PURE__ */ jsx("line", { x1: "9", y1: "9", x2: "9.01", y2: "9" }),
          /* @__PURE__ */ jsx("line", { x1: "15", y1: "9", x2: "15.01", y2: "9" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx("h1", { className: "error-title", children: t("notFound.title") }),
    /* @__PURE__ */ jsx("p", { className: "error-message", children: t("notFound.message") }),
    /* @__PURE__ */ jsx(Link, { to: homePath, className: "error-btn-primary", children: t("notFound.backHome") })
  ] }) });
};
const AspectRatioTool = React.lazy(
  () => import("./assets/AspectRatioTool-DPMVfdkd.js").then((m) => ({ default: m.AspectRatioTool }))
);
const OptimizerTool = React.lazy(
  () => import("./assets/OptimizerTool-DjPIBY3J.js").then((m) => ({ default: m.OptimizerTool }))
);
const ConverterTool = React.lazy(
  () => import("./assets/ConverterTool-DW87CxyH.js").then((m) => ({ default: m.ConverterTool }))
);
const RotateFlipTool = React.lazy(
  () => import("./assets/RotateFlipTool-Ds8SXAiq.js").then((m) => ({ default: m.RotateFlipTool }))
);
const WatermarkTool = React.lazy(
  () => import("./assets/WatermarkTool-BjFjop71.js").then((m) => ({ default: m.WatermarkTool }))
);
const ColorPaletteTool = React.lazy(
  () => import("./assets/ColorPaletteTool-DZ2xw084.js").then((m) => ({ default: m.ColorPaletteTool }))
);
const Base64Tool = React.lazy(
  () => import("./assets/Base64Tool-DU3nuGrI.js").then((m) => ({ default: m.Base64Tool }))
);
const BackgroundRemoverTool = React.lazy(
  () => import("./assets/BackgroundRemoverTool-C9EsEBaG.js").then((m) => ({ default: m.BackgroundRemoverTool }))
);
const LazyTool = ({ children }) => /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx("div", { style: { minHeight: "60vh" } }), children });
const TOOL_ROUTES = [
  { en: "tools/crop-image", es: "herramientas/recortar-imagen", element: /* @__PURE__ */ jsx(LazyTool, { children: /* @__PURE__ */ jsx(AspectRatioTool, {}) }) },
  { en: "tools/compress-image", es: "herramientas/comprimir-imagen", element: /* @__PURE__ */ jsx(LazyTool, { children: /* @__PURE__ */ jsx(OptimizerTool, {}) }) },
  { en: "tools/convert-image", es: "herramientas/convertir-imagen", element: /* @__PURE__ */ jsx(LazyTool, { children: /* @__PURE__ */ jsx(ConverterTool, {}) }) },
  { en: "tools/rotate-flip-image", es: "herramientas/girar-voltear-imagen", element: /* @__PURE__ */ jsx(LazyTool, { children: /* @__PURE__ */ jsx(RotateFlipTool, {}) }) },
  { en: "tools/watermark-image", es: "herramientas/marca-de-agua", element: /* @__PURE__ */ jsx(LazyTool, { children: /* @__PURE__ */ jsx(WatermarkTool, {}) }) },
  { en: "tools/color-palette", es: "herramientas/paleta-colores", element: /* @__PURE__ */ jsx(LazyTool, { children: /* @__PURE__ */ jsx(ColorPaletteTool, {}) }) },
  { en: "tools/base64-converter", es: "herramientas/convertidor-base64", element: /* @__PURE__ */ jsx(LazyTool, { children: /* @__PURE__ */ jsx(Base64Tool, {}) }) },
  { en: "tools/remove-background", es: "herramientas/quitar-fondo", element: /* @__PURE__ */ jsx(LazyTool, { children: /* @__PURE__ */ jsx(BackgroundRemoverTool, {}) }) }
];
const AppRoutes = () => {
  return /* @__PURE__ */ jsxs(Routes, { children: [
    /* @__PURE__ */ jsxs(Route, { path: "/", element: /* @__PURE__ */ jsx(MainLayout, {}), children: [
      /* @__PURE__ */ jsx(Route, { index: true, element: /* @__PURE__ */ jsx(Home, {}) }),
      TOOL_ROUTES.map(({ en: en2, element }) => /* @__PURE__ */ jsx(Route, { path: en2, element }, en2)),
      /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(NotFound, {}) })
    ] }),
    /* @__PURE__ */ jsxs(Route, { path: "/es", element: /* @__PURE__ */ jsx(MainLayout, {}), children: [
      /* @__PURE__ */ jsx(Route, { index: true, element: /* @__PURE__ */ jsx(Home, {}) }),
      TOOL_ROUTES.map(({ es: es2, element }) => /* @__PURE__ */ jsx(Route, { path: es2, element }, es2)),
      /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(NotFound, {}) })
    ] }),
    /* @__PURE__ */ jsx(Route, { path: "/herramientas/recorte-aspect-ratio", element: /* @__PURE__ */ jsx(Navigate, { to: "/es/herramientas/recortar-imagen", replace: true }) }),
    /* @__PURE__ */ jsx(Route, { path: "/herramientas/optimizar-peso", element: /* @__PURE__ */ jsx(Navigate, { to: "/es/herramientas/comprimir-imagen", replace: true }) }),
    /* @__PURE__ */ jsx(Route, { path: "/herramientas/cambiar-formato", element: /* @__PURE__ */ jsx(Navigate, { to: "/es/herramientas/convertir-imagen", replace: true }) }),
    /* @__PURE__ */ jsx(Route, { path: "/herramientas/girar-voltear", element: /* @__PURE__ */ jsx(Navigate, { to: "/es/herramientas/girar-voltear-imagen", replace: true }) }),
    /* @__PURE__ */ jsx(Route, { path: "/herramientas/marca-de-agua", element: /* @__PURE__ */ jsx(Navigate, { to: "/es/herramientas/marca-de-agua", replace: true }) }),
    /* @__PURE__ */ jsx(Route, { path: "/herramientas/paleta-colores", element: /* @__PURE__ */ jsx(Navigate, { to: "/es/herramientas/paleta-colores", replace: true }) }),
    /* @__PURE__ */ jsx(Route, { path: "/herramientas/base64", element: /* @__PURE__ */ jsx(Navigate, { to: "/es/herramientas/convertidor-base64", replace: true }) }),
    /* @__PURE__ */ jsx(Route, { path: "/herramientas/quitar-fondo", element: /* @__PURE__ */ jsx(Navigate, { to: "/es/herramientas/quitar-fondo", replace: true }) })
  ] });
};
class ErrorBoundary extends Component {
  constructor() {
    super(...arguments);
    __publicField(this, "state", {
      hasError: false
    });
    __publicField(this, "handleRestart", () => {
      window.location.href = "/";
    });
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Error Crítico detectado:", error, errorInfo);
  }
  render() {
    var _a;
    if (this.state.hasError) {
      return /* @__PURE__ */ jsx("div", { className: "error-page-container", children: /* @__PURE__ */ jsxs("div", { className: "error-content-card critical", children: [
        /* @__PURE__ */ jsx("div", { className: "error-icon-wrapper", children: /* @__PURE__ */ jsxs(
          "svg",
          {
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            className: "error-svg",
            children: [
              /* @__PURE__ */ jsx("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }),
              /* @__PURE__ */ jsx("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
              /* @__PURE__ */ jsx("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
            ]
          }
        ) }),
        /* @__PURE__ */ jsx("h1", { className: "error-title", children: "Error Crítico" }),
        /* @__PURE__ */ jsx("p", { className: "error-message", children: "Algo ha explotado internamente. No te preocupes, tus archivos están seguros porque todo se procesa en tu navegador." }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: this.handleRestart,
            className: "error-btn-primary",
            children: "Reiniciar Aplicación"
          }
        ),
        process.env.NODE_ENV === "development" && /* @__PURE__ */ jsx("pre", { className: "error-debug", children: (_a = this.state.error) == null ? void 0 : _a.toString() })
      ] }) });
    }
    return this.props.children;
  }
}
const showToast = (message, type = "info", duration = 4e3) => {
  const event = new CustomEvent("show-toast", {
    detail: { message, type, duration }
  });
  window.dispatchEvent(event);
};
const ToastContext = createContext(void 0);
const ToastProvider = ({ children }) => {
  const showToast$1 = useCallback((message, type = "error") => {
    showToast(message, type);
  }, []);
  return /* @__PURE__ */ jsx(ToastContext.Provider, { value: { showToast: showToast$1 }, children });
};
const SchemaMarkup = () => {
  const { pathname } = useLocation();
  const locale = getLocaleFromPath(pathname);
  const seoEntry = getSeoByPath(pathname);
  if (!seoEntry) return null;
  const canonicalUrl = getCanonicalUrl(seoEntry.path[locale]);
  const title = seoEntry.title[locale];
  const description = seoEntry.description[locale];
  const ogImage = `${SITE_CONFIG.canonicalOrigin}${SITE_CONFIG.defaultOgImage}`;
  const inLanguage = locale === "es" ? "es-ES" : "en-US";
  const webApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_CONFIG.siteName,
    url: SITE_CONFIG.canonicalOrigin,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    description: seoEntry.id === "home" ? description : "Free browser-based image tools. Compress, convert, crop, remove backgrounds & more. 100% private.",
    image: ogImage,
    inLanguage,
    featureList: [
      "Image Compression",
      "Image Format Conversion",
      "Image Cropping",
      "Image Rotation",
      "Watermark Addition",
      "Background Removal",
      "Color Palette Extraction",
      "Base64 Encoding"
    ]
  };
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: canonicalUrl,
    inLanguage,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_CONFIG.siteName,
      url: SITE_CONFIG.canonicalOrigin
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "script",
      {
        type: "application/ld+json",
        dangerouslySetInnerHTML: { __html: JSON.stringify(webApplicationSchema) }
      }
    ),
    /* @__PURE__ */ jsx(
      "script",
      {
        type: "application/ld+json",
        dangerouslySetInnerHTML: { __html: JSON.stringify(webPageSchema) }
      }
    )
  ] });
};
function render(url) {
  return renderToString(
    /* @__PURE__ */ jsx(React.StrictMode, { children: /* @__PURE__ */ jsx(StaticRouter, { location: url, children: /* @__PURE__ */ jsx(ToastProvider, { children: /* @__PURE__ */ jsxs(ErrorBoundary, { children: [
      /* @__PURE__ */ jsx(SchemaMarkup, {}),
      /* @__PURE__ */ jsx(AppRoutes, {})
    ] }) }) }) })
  );
}
export {
  render,
  showToast as s
};
