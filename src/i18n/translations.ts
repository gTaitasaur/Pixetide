/**
 * translations/index.ts — Todos los textos de la UI por idioma.
 *
 * IMPORTANTE: Estos son solo textos de la interfaz (botones, labels, navegación).
 * Los títulos SEO, meta descriptions y H1 viven en seoConfig.ts.
 * Esta separación es intencional: el copy SEO necesita control fino por página,
 * mientras que estos textos son genéricos y compartidos.
 */

import type { SupportedLocale } from '../seo/seoConfig';

// ────────────────────────────────────────────────────────────────
// Definición de keys disponibles
// ────────────────────────────────────────────────────────────────

export type TranslationKey = keyof typeof en;

// ────────────────────────────────────────────────────────────────
// Inglés (idioma base)
// ────────────────────────────────────────────────────────────────

const en = {
  // ─── Navbar ───
  'nav.home': 'Home',
  'nav.tools': 'Tools',
  'nav.about': 'About',
  'nav.openMenu': 'Open menu',
  'nav.closeMenu': 'Close menu',
  'nav.support': 'Support Pixetide ☕',
  'nav.supportMicrocopy': 'No ads, no subscriptions. Help me keep it that way.',

  // ─── Language Switcher ───
  'lang.switch': 'ES',
  'lang.switchLabel': 'Cambiar a español',

  // ─── Footer ───
  'footer.tagline': 'Pixetide — 100% browser-powered. Your images never leave your device.',
  'footer.privacy': 'Privacy',
  'footer.tools': 'All Tools',
  'footer.about': 'About',
  'footer.rights': 'All rights reserved.',

  // ─── Home Hero ───
  'home.heroTitle': 'Pixetide: Your Private, Fast & Free Image Editing Suite',
  'home.heroSubtitle': 'Edit, compress, and convert your images without uploading anything. All processing runs locally in your browser to guarantee your privacy. A suite built with care to save you hours of work.',

  // ─── Home Cards ───
  'card.crop.title': 'Crop Images for Social Media',
  'card.crop.desc': 'Resize your photos to the perfect aspect ratio for Instagram, Facebook, or Pinterest. Crop images online easily without losing quality.',
  'card.compress.title': 'Compress Images Without Quality Loss',
  'card.compress.desc': 'Reduce the size of your JPG, PNG, or WebP images by up to 80% so your website loads faster. Smart, secure, and instant compression.',
  'card.convert.title': 'Convert Image Format',
  'card.convert.desc': 'Convert images to WebP, AVIF, JPG, or PNG in bulk. The ideal format to optimize your SEO and improve user experience.',
  'card.rotateFlip.title': 'Rotate & Flip Images',
  'card.rotateFlip.desc': 'Rotate your photos or apply a mirror effect easily. Ideal for straightening crooked images or creating symmetric compositions — 100% private.',
  'card.watermark.title': 'Add Watermark to Photos',
  'card.watermark.desc': 'Protect your photographs by adding your logo or text as a watermark. Everything is processed locally in your browser for maximum privacy.',
  'card.upscale.title': 'Enhance Image Quality',
  'card.upscale.desc': 'Increase the resolution of blurry or old photos. Enlarge images without pixelation using advanced upscaling technology — right in your browser. (Coming Soon)',
  'card.removeBg.title': 'Remove Background',
  'card.removeBg.desc': 'Magically remove the background from any image using AI directly in your browser. Compare before and after instantly.',
  'card.colorPalette.title': 'Extract Color Palette',
  'card.colorPalette.desc': 'Extract the dominant colors from any image and get their HEX codes. The ideal tool for web designers and creatives. Instant and local processing.',
  'card.photoEditor.title': 'Online Photo Editor',
  'card.photoEditor.desc': 'Adjust brightness, contrast, and apply professional filters for free. Fast and private photo editing from the comfort of your screen. (Coming Soon)',
  'card.base64.title': 'Base64 Converter',
  'card.base64.desc': 'Encode your images to Base64 for embedding in HTML or CSS, or decode Base64 back to an image. Bidirectional, instant, and 100% private.',
  'card.favicon.title': 'Favicon ICO Generator',
  'card.favicon.desc': 'Create the perfect icon for your website. Upload your logo and convert it to .ico and other standardized formats ready to use. (Coming Soon)',

  // ─── Shared: DragAndDrop ───
  'dragdrop.prompt': 'Choose an image to get started',
  'dragdrop.hint': 'Click or drag your file here (Max. 20MB)',
  'dragdrop.ariaLabel': 'Upload image',
  'dragdrop.multiPrompt': 'Upload multiple photos at once',
  'dragdrop.multiHint': 'Click or drag your files here',
  'dragdrop.multiAriaLabel': 'Upload images',

  // ─── Shared: Buttons & Labels ───
  'shared.uploadAnother': 'Upload another photo',
  'shared.uploadNew': 'Upload new photo',
  'shared.chooseAnother': 'Choose another photo',
  'shared.uploadMore': 'Upload more',
  'shared.addMore': 'Add more',
  'shared.text': 'Text',
  'shared.image': 'Image',
  'shared.color': 'Color',
  'shared.opacity': 'Opacity',
  'shared.size': 'Size',
  'shared.position': 'Position',
  'shared.processing': 'Processing...',
  'shared.downloading': 'Downloading...',
  'shared.download': 'Download Image',
  'shared.downloadOriginal': 'Download Original',
  'shared.downloadPng': 'Download PNG',
  'shared.downloadTxt': 'Download .txt',
  'shared.downloadCrop': 'Download Crop',
  'shared.privacyHint': 'Your images are processed locally. They never leave your device.',
  'shared.privacyShort': 'Full quality. 100% private.',
  'shared.privacyLocal': 'Local processing: your data is safe.',
  'shared.privacyColors': 'Colors are extracted locally. Total privacy guaranteed.',
  'shared.privacyBg': '100% processed locally. Total privacy guaranteed.',
  'shared.errorProcessing': 'There was an error processing the image.',
  'shared.errorValidation': 'Error validating the file.',
  'shared.errorExport': 'Could not process the image. Make sure the file is still accessible.',

  // ─── Tool Page Headers ───
  'tool.crop.h1': 'Crop & Resize Images.',
  'tool.crop.subtitle': 'Resize your photos to the ideal format for Instagram, TikTok, or the web. All processing is local and private in your browser.',
  'tool.compress.h1': 'Compress Images Without Losing Quality.',
  'tool.compress.subtitle': 'Drastically reduce the file size of your JPG, PNG, or WebP photos. Boost your website speed and SEO with secure local compression.',
  'tool.convert.h1': 'Image Format Converter.',
  'tool.convert.subtitle': 'Convert your photos to WebP, AVIF, JPG, or PNG in bulk. Everything is processed in your browser to protect your original files.',
  'tool.rotate.h1': 'Rotate & Flip Images.',
  'tool.rotate.subtitle': 'Rotate and apply mirror effects to your photos easily and quickly — 100% private from your browser.',
  'tool.watermark.h1': 'Add Watermark to Photos.',
  'tool.watermark.subtitle': 'Protect your photos by adding your logo or signature as a watermark. Everything is processed locally in your browser for maximum privacy.',
  'tool.palette.h1': 'Extract Color Palette.',
  'tool.palette.subtitle': 'Get the dominant, vibrant, and muted colors from any image. Ideal for web designers and creatives. Instant and 100% private processing.',
  'tool.base64.h1': 'Base64 Converter.',
  'tool.base64.subtitle': 'Encode your images to Base64 for embedding in HTML or CSS, or decode a Base64 string back to a downloadable image. 100% local and private.',
  'tool.removeBg.h1': 'Remove Background with AI.',
  'tool.removeBg.subtitle': 'Magically remove the background from any image using Artificial Intelligence directly in your browser. Private, fast, and professional.',

  // ─── Optimizer Module ───
  'opt.compression': 'Compression',
  'opt.compressionDesc': 'Lower quality means smaller file size. The <strong>Normal</strong> level works best for most use cases.',
  'opt.options': 'Options',
  'opt.keepDimensions': 'Keep dimensions',
  'opt.keepDimensionsDesc': 'Do not resize width and height.',
  'opt.webpFormat': 'WebP format',
  'opt.webpFormatDesc': 'Maximum compression recommended by Google.',
  'opt.optimizing': 'Optimizing...',
  'opt.original': 'Original',
  'opt.optimized': 'Optimized',
  'opt.errorOptimize': 'There was an error optimizing the image.',
  'opt.downloadSuccess': 'Image downloaded successfully.',
  'opt.presetLossless': 'Lossless',
  'opt.presetLosslessDesc': 'Original',
  'opt.presetNormal': 'Normal',
  'opt.presetNormalDesc': 'Balanced',
  'opt.presetAggressive': 'Aggressive',
  'opt.presetAggressiveDesc': 'For Web',
  'opt.presetMax': 'Maximum',
  'opt.presetMaxDesc': 'Smallest size',

  // ─── Cropper Module ───
  'crop.selectFormat': 'Select a format',
  'crop.formatHint': 'Adjust your image to the ideal dimensions',

  // ─── Rotate & Flip Module ───
  'rf.rotation': 'Rotation',
  'rf.reset': 'Reset',
  'rf.resetRotation': 'Reset rotation',
  'rf.mirror': 'Mirror Effect',
  'rf.horizontal': 'Horizontal',
  'rf.vertical': 'Vertical',

  // ─── Color Palette Module ───
  'cp.colorFormat': 'Color Format',
  'cp.help': 'Help',
  'cp.helpText': 'Click any color block to copy its code.',
  'cp.analyzing': 'Analyzing colors...',
  'cp.copied': 'Copied!',
  'cp.copyError': 'Error copying',
  'cp.copy': 'Copy',
  'cp.harmonicPalette': 'Harmonic Palette',
  'cp.networkError': 'Connection error: Could not download the color engines. Retry or reload the page.',
  'cp.extractError': 'Could not extract colors from this image.',

  // ─── Base64 Module ───
  'b64.encode': 'Encode',
  'b64.decode': 'Decode',
  'b64.pasteLabel': 'Paste your Base64 code here:',
  'b64.pasteHint': 'Paste a valid code in the text area to reveal the image.',
  'b64.uploadHint': 'Upload an image to see encoding options.',
  'b64.copyBase64': 'Copy Base64 Text',
  'b64.copyHtml': 'Copy HTML tag',
  'b64.copyCss': 'Copy as CSS',
  'b64.copiedBase64': 'Base64 copied',
  'b64.copiedHtml': 'HTML copied',
  'b64.copiedCss': 'CSS copied',
  'b64.formatDetected': 'Format detected:',
  'b64.decodeError': 'The text does not appear to be a valid Base64 image. Make sure it starts with "data:image/..." or is a pure Base64 string.',
  'b64.decodeImageError': 'Could not decode the image. Verify that the Base64 code is complete and valid.',

  // ─── Background Remover Module ───
  'bgrm.title': 'Background Management',
  'bgrm.removeNow': '✨ Remove Background Now',
  'bgrm.downloadingAI': 'Downloading AI...',
  'bgrm.removingBg': 'Removing background...',
  'bgrm.downloadingDesc': 'Preparing the smart engine locally for the first time.',
  'bgrm.removingDesc': 'The AI is processing the edges of your image in your browser.',
  'bgrm.refineCut': '🖌️ Refine Cutout',
  'bgrm.errorTitle': 'AI Error',
  'bgrm.before': 'Before',
  'bgrm.after': 'After',

  // ─── Converter Module ───
  'conv.filesLoaded': 'Files loaded',
  'conv.globalSettings': 'Global Settings',
  'conv.globalDesc': 'Change the output format for all files at once.',
  'conv.convertTo': 'Convert to:',
  'conv.convertAll': 'Convert All',
  'conv.convertPending': 'Convert Pending',
  'conv.clearAll': 'Clear All',
  'conv.converting': 'Converting...',
  'conv.done': 'Done',
  'conv.error': 'Error',
  'conv.remove': 'Remove',
  'conv.noTransparency': 'does not support transparency. Choose background:',
  'conv.white': 'White',
  'conv.black': 'Black',
  'conv.performanceWarning': 'files detected. Local processing may take a few seconds.',
  'conv.privacyHint': 'Local processing: your photos never leave this browser.',
  'conv.noValidImages': 'No valid images found.',
  'conv.maxFilesError': 'You can upload a maximum of {max} images at once.',
  'conv.invalidFile': 'The file {name} is not valid: {error}',

  // ─── 404 ───
  'notFound.title': 'Oops! 404',
  'notFound.message': "This photo got lost in development. The page you're looking for doesn't exist or has been moved.",
  'notFound.backHome': 'Back to Home',


  // ─── Watermark Module ───
  'wm.addPhotos': 'Add photos',
  'wm.layers': 'Layers',
  'wm.removePhoto': 'Remove photo',
  'wm.duplicate': 'Duplicate',
  'wm.delete': 'Delete',
  'wm.textLabel': 'Watermark text',
  'wm.fontWeight': 'Weight',
  'wm.fontFamily': 'Typography',
  'wm.logoLabel': 'Logo or Signature',
  'wm.changeImage': 'Change image',
  'wm.uploadImage': 'Upload image',
  'wm.addOtherText': 'Add another text',
  'wm.addOtherImage': 'Add another image',
  'wm.placeholderText': 'Add a text to start',
  'wm.placeholderImage': 'Upload an image to start',
} as const;

// ────────────────────────────────────────────────────────────────
// Español
// ────────────────────────────────────────────────────────────────

const es: Record<TranslationKey, string> = {
  // ─── Navbar ───
  'nav.home': 'Inicio',
  'nav.tools': 'Herramientas',
  'nav.about': 'Acerca de',
  'nav.openMenu': 'Abrir menú',
  'nav.closeMenu': 'Cerrar menú',
  'nav.support': 'Apoya a Pixetide ☕',
  'nav.supportMicrocopy': 'Sin anuncios, sin suscripciones. Ayúdame a que siga así.',

  // ─── Language Switcher ───
  'lang.switch': 'EN',
  'lang.switchLabel': 'Switch to English',

  // ─── Footer ───
  'footer.tagline': 'Pixetide — Rendimiento 100% en tu navegador. Tus imágenes nunca salen de tu dispositivo.',
  'footer.privacy': 'Privacidad',
  'footer.tools': 'Herramientas',
  'footer.about': 'Información',
  'footer.rights': 'Todos los derechos reservados.',

  // ─── Home Hero ───
  'home.heroTitle': 'Pixetide: Tu Suite de Edición Local, Rápida y Privada',
  'home.heroSubtitle': 'Edita, comprime y convierte tus fotos sin subir nada a internet. Todo el procesamiento se realiza localmente en tu navegador para garantizar tu privacidad y ahorrarte horas de trabajo. Una suite creada con dedicación para hacerte la vida más fácil.',

  // ─── Home Cards ───
  'card.crop.title': 'Recortar Fotos para Redes',
  'card.crop.desc': 'Adapta tus imágenes al tamaño perfecto para Instagram, Facebook o Pinterest. Recorta fotos online fácilmente y sin perder calidad.',
  'card.compress.title': 'Comprimir Imágenes sin Perder Calidad',
  'card.compress.desc': 'Reduce el peso de tus fotos JPG, PNG o WebP hasta en un 80% para que tu web cargue más rápido. Compresión inteligente, segura y al instante.',
  'card.convert.title': 'Convertir Formato de Imagen',
  'card.convert.desc': 'Convierte fotos a WebP, AVIF, JPG o PNG de forma masiva. El formato ideal para optimizar tu SEO y mejorar la experiencia de tus usuarios.',
  'card.rotateFlip.title': 'Girar y Voltear Imágenes',
  'card.rotateFlip.desc': 'Rota tus fotos o aplícales un efecto espejo fácilmente. Ideal para enderezar imágenes torcidas o crear composiciones simétricas de forma 100% privada.',
  'card.watermark.title': 'Poner Marca de Agua a Fotos',
  'card.watermark.desc': 'Protege tus fotografías añadiendo tu logo o texto como marca de agua. Todo se procesa localmente en tu navegador para garantizar tu privacidad.',
  'card.upscale.title': 'Mejorar Calidad de Imagen',
  'card.upscale.desc': 'Aumenta la resolución de fotos borrosas o antiguas. Agranda imágenes sin pixelarlas usando tecnología de escalado avanzada desde tu navegador. (Próximamente)',
  'card.removeBg.title': 'Quitar Fondo',
  'card.removeBg.desc': 'Elimina el fondo de cualquier imagen mágicamente usando IA directamente en tu navegador. Compara el antes y después al instante.',
  'card.colorPalette.title': 'Extraer Paleta de Colores',
  'card.colorPalette.desc': 'Saca los colores predominantes de cualquier imagen y obtén sus códigos HEX. La herramienta ideal para diseñadores web y creativos. Procesamiento instantáneo y local.',
  'card.photoEditor.title': 'Editor de Fotos Online',
  'card.photoEditor.desc': 'Ajusta el brillo, contraste y aplica filtros profesionales gratis. Edición fotográfica rápida y privada desde la comodidad de tu pantalla. (Próximamente)',
  'card.base64.title': 'Convertidor Base64',
  'card.base64.desc': 'Codifica tus imágenes a Base64 para incrustarlas en HTML o CSS, o decodifica un código Base64 a imagen. Bidireccional, instantáneo y 100% privado.',
  'card.favicon.title': 'Generador de Favicon ICO',
  'card.favicon.desc': 'Crea el icono perfecto para tu página web. Sube tu logo y conviértelo a .ico y otros formatos estandarizados listos para usar. (Próximamente)',

  // ─── Shared: DragAndDrop ───
  'dragdrop.prompt': 'Elige una imagen para empezar',
  'dragdrop.hint': 'Haz clic o arrastra tu archivo aquí (Máx. 20MB)',
  'dragdrop.ariaLabel': 'Subir imagen',
  'dragdrop.multiPrompt': 'Sube varias fotos a la vez',
  'dragdrop.multiHint': 'Haz clic o arrastra tus archivos aquí',
  'dragdrop.multiAriaLabel': 'Subir imágenes',

  // ─── Shared: Buttons & Labels ───
  'shared.uploadAnother': 'Subir otra foto',
  'shared.uploadNew': 'Subir nueva foto',
  'shared.chooseAnother': 'Elegir otra foto',
  'shared.uploadMore': 'Subir más',
  'shared.addMore': 'Subir más',
  'shared.text': 'Texto',
  'shared.image': 'Imagen',
  'shared.color': 'Color',
  'shared.opacity': 'Opacidad',
  'shared.size': 'Tamaño',
  'shared.position': 'Posición',
  'shared.processing': 'Procesando...',
  'shared.downloading': 'Descargando...',
  'shared.download': 'Descargar Imagen',
  'shared.downloadOriginal': 'Descargar Original',
  'shared.downloadPng': 'Descargar PNG',
  'shared.downloadTxt': 'Descargar .txt',
  'shared.downloadCrop': 'Descargar Recorte',
  'shared.privacyHint': 'Tus imágenes se procesan localmente. Nunca se envían a ningún servidor.',
  'shared.privacyShort': 'Máxima calidad. 100% privado.',
  'shared.privacyLocal': 'Procesamiento local: tus datos están seguros.',
  'shared.privacyColors': 'Tus colores se extraen localmente. Privacidad total garantizada.',
  'shared.privacyBg': '100% procesado localmente. Privacidad total garantizada.',
  'shared.errorProcessing': 'Hubo un error al procesar la imagen.',
  'shared.errorValidation': 'Error al validar el archivo.',
  'shared.errorExport': 'No se pudo procesar la imagen. Asegúrate de que el archivo aún sea accesible.',

  // ─── Tool Page Headers ───
  'tool.crop.h1': 'Recorte y Redimensión de Imágenes.',
  'tool.crop.subtitle': 'Ajusta tus fotos a los formatos ideales para Instagram, TikTok o Web. Todo el procesamiento es local y privado en tu navegador.',
  'tool.compress.h1': 'Comprimir Imágenes sin Perder Calidad.',
  'tool.compress.subtitle': 'Reduce drásticamente el peso de tus fotos JPG, PNG o WebP. Mejora la velocidad de tu web y tu SEO con nuestra compresión local segura.',
  'tool.convert.h1': 'Convertidor de Formatos de Imagen.',
  'tool.convert.subtitle': 'Cambia el formato de tus fotos a WebP, AVIF, JPG o PNG masivamente. Todo se procesa en tu navegador para proteger tus archivos originales.',
  'tool.rotate.h1': 'Girar y Voltear Imágenes.',
  'tool.rotate.subtitle': 'Rota y aplica efectos de espejo a tus fotos de manera fácil y rápida, 100% privado desde tu navegador.',
  'tool.watermark.h1': 'Poner Marca de Agua a Fotos.',
  'tool.watermark.subtitle': 'Protege tus fotos añadiendo tu logo o firma como marca de agua. Todo se procesa localmente en tu navegador para garantizar tu privacidad.',
  'tool.palette.h1': 'Extraer Paleta de Colores.',
  'tool.palette.subtitle': 'Obtén los colores predominantes, vibrantes y tenues de cualquier imagen. Ideal para diseñadores web y creativos. Procesamiento instantáneo y 100% privado.',
  'tool.base64.h1': 'Convertidor Base64.',
  'tool.base64.subtitle': 'Codifica tus imágenes a Base64 para incrustarlas en HTML o CSS, o decodifica un código Base64 a imagen descargable. Todo el procesamiento es 100% local y privado.',
  'tool.removeBg.h1': 'Quitar Fondo con IA.',
  'tool.removeBg.subtitle': 'Elimina el fondo de cualquier imagen mágicamente usando Inteligencia Artificial directamente en tu navegador. Privado, rápido y profesional.',

  // ─── Optimizer Module ───
  'opt.compression': 'Compresión',
  'opt.compressionDesc': 'A menor calidad, menor peso. El nivel <strong>Normal</strong> es ideal para la mayoría de casos.',
  'opt.options': 'Opciones',
  'opt.keepDimensions': 'Mantener dimensiones',
  'opt.keepDimensionsDesc': 'No redimensionar el ancho y alto.',
  'opt.webpFormat': 'Formato WebP',
  'opt.webpFormatDesc': 'Máxima compresión recomendada por Google.',
  'opt.optimizing': 'Optimizando...',
  'opt.original': 'Original',
  'opt.optimized': 'Optimizado',
  'opt.errorOptimize': 'Hubo un error al optimizar la imagen.',
  'opt.downloadSuccess': 'Imagen descargada correctamente.',
  'opt.presetLossless': 'Sin pérdida',
  'opt.presetLosslessDesc': 'Original',
  'opt.presetNormal': 'Normal',
  'opt.presetNormalDesc': 'Equilibrado',
  'opt.presetAggressive': 'Agresivo',
  'opt.presetAggressiveDesc': 'Para Web',
  'opt.presetMax': 'Máximo',
  'opt.presetMaxDesc': 'Mínimo peso',

  // ─── Cropper Module ───
  'crop.selectFormat': 'Selecciona un formato',
  'crop.formatHint': 'Ajusta tu imagen a las medidas ideales',

  // ─── Rotate & Flip Module ───
  'rf.rotation': 'Rotación',
  'rf.reset': 'Reiniciar',
  'rf.resetRotation': 'Resetear rotación',
  'rf.mirror': 'Efecto Espejo',
  'rf.horizontal': 'Horizontal',
  'rf.vertical': 'Vertical',

  // ─── Color Palette Module ───
  'cp.colorFormat': 'Formato de Color',
  'cp.help': 'Ayuda',
  'cp.helpText': 'Haz clic en cualquier bloque de color para copiar su código.',
  'cp.analyzing': 'Analizando colores...',
  'cp.copied': '¡Copiado!',
  'cp.copyError': 'Error al copiar',
  'cp.copy': 'Copiar',
  'cp.harmonicPalette': 'Paleta Armónica',
  'cp.networkError': 'Error de conexión: No se pudieron descargar los motores de color. Reintenta o recarga la página.',
  'cp.extractError': 'No se pudieron extraer los colores de esta imagen.',

  // ─── Base64 Module ───
  'b64.encode': 'Codificar',
  'b64.decode': 'Decodificar',
  'b64.pasteLabel': 'Pega tu código Base64 aquí:',
  'b64.pasteHint': 'Pega un código válido en el área de texto para revelar la imagen.',
  'b64.uploadHint': 'Sube una imagen para ver sus opciones de codificación.',
  'b64.copyBase64': 'Copiar Texto Base64',
  'b64.copyHtml': 'Copiar tag HTML',
  'b64.copyCss': 'Copiar como CSS',
  'b64.copiedBase64': 'Base64 copiado',
  'b64.copiedHtml': 'HTML copiado',
  'b64.copiedCss': 'CSS copiado',
  'b64.formatDetected': 'Formato detectado:',
  'b64.decodeError': 'El texto no parece ser una imagen en Base64 válida. Asegúrate de que comience con "data:image/..." o sea una cadena Base64 pura.',
  'b64.decodeImageError': 'No se pudo decodificar la imagen. Verifica que el código Base64 esté completo y sea válido.',

  // ─── Background Remover Module ───
  'bgrm.title': 'Gestión de Fondo',
  'bgrm.removeNow': '✨ Quitar Fondo Ahora',
  'bgrm.downloadingAI': 'Descargando IA...',
  'bgrm.removingBg': 'Quitando fondo...',
  'bgrm.downloadingDesc': 'Preparando motor inteligente localmente por primera vez.',
  'bgrm.removingDesc': 'La IA está procesando los bordes de tu imagen en tu navegador.',
  'bgrm.refineCut': '🖌️ Perfeccionar Recorte',
  'bgrm.errorTitle': 'Error de la IA',
  'bgrm.before': 'Antes',
  'bgrm.after': 'Después',

  // ─── Converter Module ───
  'conv.filesLoaded': 'Archivos cargados',
  'conv.globalSettings': 'Ajustes Globales',
  'conv.globalDesc': 'Cambia el formato de salida para todos los archivos a la vez.',
  'conv.convertTo': 'Convertir a:',
  'conv.convertAll': 'Convertir Todo',
  'conv.convertPending': 'Convertir Pendientes',
  'conv.clearAll': 'Borrar Todo',
  'conv.converting': 'Convirtiendo...',
  'conv.done': 'Listo',
  'conv.error': 'Error',
  'conv.remove': 'Quitar',
  'conv.noTransparency': 'no admite transparencia. Elija fondo:',
  'conv.white': 'Blanco',
  'conv.black': 'Negro',
  'conv.performanceWarning': 'archivos detectados. El proceso local puede tomar unos segundos.',
  'conv.privacyHint': 'Procesamiento local: tus fotos nunca salen de este navegador.',
  'conv.noValidImages': 'No se encontraron imágenes válidas.',
  'conv.maxFilesError': 'Solo puedes subir un máximo de {max} imágenes a la vez.',
  'conv.invalidFile': 'El archivo {name} no es válido: {error}',

  // ─── 404 ───
  'notFound.title': '¡Ups! 404',
  'notFound.message': 'Esta foto se nos ha perdido en el revelado. La página que buscas no existe o ha sido movida a otro álbum.',
  'notFound.backHome': 'Volver al Inicio',


  // ─── Watermark Module ───
  'wm.addPhotos': 'Agregar fotos',
  'wm.layers': 'Capas',
  'wm.removePhoto': 'Eliminar foto',
  'wm.duplicate': 'Duplicar',
  'wm.delete': 'Eliminar',
  'wm.textLabel': 'Texto de la marca',
  'wm.fontWeight': 'Peso',
  'wm.fontFamily': 'Tipografía',
  'wm.logoLabel': 'Logo o Firma',
  'wm.changeImage': 'Cambiar imagen',
  'wm.uploadImage': 'Subir imagen',
  'wm.addOtherText': 'Agregar otro texto',
  'wm.addOtherImage': 'Agregar otra imagen',
  'wm.placeholderText': 'Agrega un texto para comenzar',
  'wm.placeholderImage': 'Sube una imagen para comenzar',
};

// ────────────────────────────────────────────────────────────────
// Export
// ────────────────────────────────────────────────────────────────

export const translations: Record<SupportedLocale, Record<TranslationKey, string>> = {
  en,
  es,
};
