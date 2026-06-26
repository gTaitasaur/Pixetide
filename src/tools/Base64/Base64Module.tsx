import React, { useState, useRef, useEffect } from 'react';
import { ImagePreviewCanvas } from '../../shared/components/UI/ImagePreviewCanvas/ImagePreviewCanvas';
import { useLocale } from '../../core/i18n/useLocale';
import { Sheet, SheetContent } from '../../shared/components/ui/sheet';
import { cn } from '../../shared/utils/cn';
import { useToast } from '../../shared/components/Errors/ToastContext';
import { 
  Copy, 
  FileCode, 
  Code, 
  Download, 
  Image as ImageIcon,
  Sliders, 
  AlertTriangle,
  HelpCircle,
  Upload,
  Trash2
} from 'lucide-react';
import './Base64Module.css';

type TabMode = 'encode' | 'decode';
type CopyFormat = 'raw' | 'html' | 'css';

export const Base64Module: React.FC = () => {
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabMode>('encode');
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);

  // ── Estado para CODIFICAR ──
  const [base64String, setBase64String] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Estado para DECODIFICAR ──
  const [decodeInput, setDecodeInput] = useState<string>('');
  const [decodePreview, setDecodePreview] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodedFormat, setDecodedFormat] = useState<string>('png');

  // ── Estado general ──
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, [previewUrl]);

  // ══════════════════════════════════════════
  // MODO 1: CODIFICAR (Imagen → Base64)
  // ══════════════════════════════════════════

  const validateFile = (file: File): boolean => {
    const supportedMimeTypes = [
      'image/png', 'image/jpeg', 'image/webp', 'image/gif', 
      'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon', 
      'image/bmp', 'image/x-ms-bmp'
    ];
    
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const supportedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico', '.bmp'];

    const isMimeSupported = supportedMimeTypes.includes(file.type);
    const isExtensionSupported = supportedExtensions.includes(fileExtension);

    if (!isMimeSupported && !isExtensionSupported) {
      showToast(
        locale === 'es'
          ? "El archivo seleccionado no es un formato de imagen soportado. Usa JPG, PNG, WebP, GIF, SVG, ICO o BMP."
          : "The selected file is not a supported image format. Use JPG, PNG, WebP, GIF, SVG, ICO or BMP.",
        'error'
      );
      return false;
    }

    // Límite de tamaño sugerido para Base64 (20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast(
        locale === 'es'
          ? "El archivo supera el límite de 20MB."
          : "The file exceeds the 20MB limit.",
        'error'
      );
      return false;
    }

    return true;
  };

  const handleImageSelected = (_url: string, file: File) => {
    if (!validateFile(file)) return;

    setFileName(file.name);
    setFileSize(file.size);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64String(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleChangeImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      handleImageSelected(url, file);
      e.target.value = '';
    }
  };

  const getFormattedCode = (format: CopyFormat): string => {
    if (!base64String) return '';
    switch (format) {
      case 'raw':
        return base64String;
      case 'html':
        return `<img src="${base64String}" alt="${fileName}" />`;
      case 'css':
        return `background-image: url('${base64String}');`;
    }
  };

  const handleCopy = (format: CopyFormat) => {
    const text = getFormattedCode(format);
    navigator.clipboard.writeText(text).then(() => {
      const labels: Record<CopyFormat, string> = {
        raw: t('b64.copiedBase64'),
        html: t('b64.copiedHtml'),
        css: t('b64.copiedCss'),
      };
      setCopiedLabel(labels[format]);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => setCopiedLabel(null), 2000);
    });
  };

  const handleDownloadTxt = () => {
    if (!base64String) return;
    const blob = new Blob([base64String], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    const prefix = locale === 'es' ? 'Pixetide_Base64_' : 'Pixetide_Base64_';
    a.download = `${prefix}${baseName}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ══════════════════════════════════════════
  // MODO 2: DECODIFICAR (Base64 → Imagen)
  // ══════════════════════════════════════════

  const handleDecodeInput = (value: string) => {
    setDecodeInput(value);
    setDecodeError(null);
    setDecodePreview(null);

    if (!value.trim()) return;

    // Normalizar: si el usuario pegó solo la cadena sin el prefijo data:...
    let fullString = value.trim();
    if (!fullString.startsWith('data:')) {
      fullString = `data:image/png;base64,${fullString}`;
    }

    // Extraer formato del encabezado (soporta svg+xml, x-icon, vnd.microsoft.icon, etc.)
    const formatMatch = fullString.match(/^data:image\/([^;]+);base64,/);
    if (!formatMatch) {
      setDecodeError(t('b64.decodeError'));
      return;
    }

    // Normalizar el nombre del formato a mostrar en el badge
    const fmt = formatMatch[1].toLowerCase();
    let displayFormat = 'png';
    if (fmt.includes('svg')) {
      displayFormat = 'svg';
    } else if (fmt.includes('icon') || fmt.includes('ico')) {
      displayFormat = 'ico';
    } else if (fmt.includes('bmp')) {
      displayFormat = 'bmp';
    } else if (fmt === 'jpeg') {
      displayFormat = 'jpg';
    } else {
      displayFormat = fmt;
    }
    setDecodedFormat(displayFormat);

    // Validar que el Base64 sea legítimo intentando renderizarlo
    const img = new Image();
    img.onload = () => {
      setDecodePreview(fullString);
      setDecodeError(null);
    };
    img.onerror = () => {
      setDecodeError(t('b64.decodeImageError'));
      setDecodePreview(null);
    };
    img.src = fullString;
  };

  const handleDownloadDecoded = () => {
    if (!decodePreview) return;
    const a = document.createElement('a');
    a.href = decodePreview;
    const prefix = locale === 'es' ? 'Pixetide_Base64_ImagenDecodificada' : 'Pixetide_Base64_DecodedImage';
    a.download = `${prefix}.${decodedFormat}`;
    a.click();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full lg:h-full select-none pb-20 lg:pb-0">
      
      {/* Input de archivos oculto */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        className="hidden" 
        accept="image/*"
      />

      {/* ─── COLUMNA IZQUIERDA: ESPACIO DE TRABAJO ─── */}
      <div className="flex-1 flex flex-col min-w-0 gap-6 lg:h-full">
        
        {/* Header de la Herramienta */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl md:text-3xl text-primary font-medium tracking-tight">
              {locale === 'es' ? 'Convertidor Base64' : 'Base64 Converter'}
            </h2>
            <p className="text-xs text-muted-foreground leading-normal max-w-xl">
              {locale === 'es' 
                ? 'Codifica tus imágenes a código Base64 para HTML/CSS de forma privada, o decodifica cadenas de texto de vuelta a su imagen original.'
                : 'Encode your images to Base64 code for HTML/CSS privately, or decode text strings back to their original image.'}
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {activeTab === 'encode' && (
              <>
                <button 
                  onClick={() => {
                    setBase64String(null);
                    setFileName('');
                    setFileSize(0);
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }}
                  disabled={!base64String}
                  className="h-9 px-4 rounded-full border border-border hover:bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <Trash2 className="size-3.5" />
                  <span>{locale === 'es' ? 'Limpiar todo' : 'Clear all'}</span>
                </button>
                <button 
                  onClick={handleChangeImage}
                  className="h-9 px-4 rounded-full bg-primary hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="size-3.5" />
                  <span>
                    {base64String 
                      ? (locale === 'es' ? 'Cambiar Imagen' : 'Change Image') 
                      : (locale === 'es' ? 'Subir Imagen' : 'Upload Image')}
                  </span>
                </button>
              </>
            )}
            
            {activeTab === 'decode' && (
              <button 
                onClick={() => {
                  setDecodeInput('');
                  setDecodePreview(null);
                  setDecodeError(null);
                }}
                disabled={!decodeInput && !decodePreview}
                className="h-9 px-4 rounded-full border border-border hover:bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <Trash2 className="size-3.5" />
                <span>{locale === 'es' ? 'Limpiar todo' : 'Clear all'}</span>
              </button>
            )}
          </div>
        </div>

        {/* WORKSPACE AREA (Contenedor de edición simétrico de dos columnas) */}
        {activeTab === 'encode' ? (
          <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-[350px]">
            {/* Lado izquierdo: Previsualización de Imagen */}
            {base64String ? (
              <div 
                onClick={handleChangeImage}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0];
                    const url = URL.createObjectURL(file);
                    handleImageSelected(url, file);
                  }
                }}
                className="flex-1 border border-border/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center items-center bg-slate-50/40 cursor-pointer transition-colors"
              >
                <div className="corner-decorator corner-tl"></div>
                <div className="corner-decorator corner-tr"></div>
                <div className="corner-decorator corner-bl"></div>
                <div className="corner-decorator corner-br"></div>
                <div className="w-full h-full max-h-[40vh] flex items-center justify-center">
                  <ImagePreviewCanvas imageUrl={previewUrl!} maxHeight="40vh" />
                </div>
              </div>
            ) : (
              <div 
                onClick={handleChangeImage}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0];
                    const url = URL.createObjectURL(file);
                    handleImageSelected(url, file);
                  }
                }}
                className="flex-1 min-h-[300px] dropzone-grid border border-border/80 rounded-2xl flex items-center justify-center p-8 text-center relative overflow-hidden group cursor-pointer"
              >
                <div className="corner-decorator corner-tl"></div>
                <div className="corner-decorator corner-tr"></div>
                <div className="corner-decorator corner-bl"></div>
                <div className="corner-decorator corner-br"></div>
                
                <div className="flex flex-col items-center gap-4 max-w-sm z-10 bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-border/40 shadow-sm transition-all group-hover:shadow-md">
                  <div className="size-14 rounded-full bg-white flex items-center justify-center border border-border/85 shadow-sm text-muted-foreground">
                    <ImageIcon className="size-6" />
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-primary">
                        {locale === 'es' ? 'Arrastra tu imagen aquí o haz clic' : 'Drag your image here or click'}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        {locale === 'es' 
                          ? 'Procesamiento 100% local en tu navegador. Máximo 20MB por archivo.'
                          : '100% local processing in your browser. Maximum 20MB per file.'}
                      </p>
                    </div>
                    
                    {/* Formats Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                      {['PNG', 'JPG', 'WEBP', 'GIF', 'SVG', 'ICO', 'BMP'].map((fmt) => (
                        <span 
                          key={fmt} 
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-slate-100 text-slate-600 border border-slate-200/60"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Lado derecho: Textarea del código Base64 */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
                  {locale === 'es' ? 'Resultado Base64' : 'Base64 Result'}
                </label>
                {base64String && (
                  <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200/60">
                    {formatBytes(base64String.length)}
                  </span>
                )}
              </div>
              <div className="relative flex-1 min-h-[220px] flex flex-col">
                <textarea
                  className="flex-1 w-full p-4 border border-border rounded-xl font-mono text-[10px] leading-relaxed bg-white text-primary focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#a855f7] resize-none select-all break-all overflow-y-auto"
                  readOnly={!base64String}
                  disabled={!base64String}
                  value={base64String || ''}
                  placeholder={
                    locale === 'es'
                      ? 'El código Base64 de la imagen se generará aquí automáticamente al subir un archivo...'
                      : 'The Base64 code of the image will be generated here automatically once you upload a file...'
                  }
                  onClick={(e) => base64String && (e.target as HTMLTextAreaElement).select()}
                  title="Base64 Code"
                />
                {base64String && (
                  <button 
                    onClick={() => handleCopy('raw')}
                    className="absolute bottom-3 right-3 h-8 px-3 rounded-lg bg-white border border-border hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="size-3.5" />
                    <span>{locale === 'es' ? 'Copiar' : 'Copy'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-[350px]">
            {/* Caja para pegar */}
            <div className="flex-1 flex flex-col gap-3">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
                {t('b64.pasteLabel')}
              </label>
              <textarea
                className="flex-1 w-full p-4 border border-border rounded-xl font-mono text-[10px] leading-relaxed bg-white text-primary hover:border-[#a855f7] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#a855f7] transition-colors resize-none overflow-y-auto min-h-[220px]"
                placeholder="data:image/png;base64,iVBORw0KGgo..."
                value={decodeInput}
                onChange={(e) => handleDecodeInput(e.target.value)}
              />
              {decodeError && (
                <div className="p-3 bg-red-50 border border-red-200/60 rounded-xl text-xs text-red-600 font-medium flex items-start gap-2 animate-fade-in">
                  <AlertTriangle className="size-4 shrink-0 text-red-500" />
                  <span>{decodeError}</span>
                </div>
              )}
            </div>

            {/* Vista previa de decodificado */}
            <div className="flex-1 dropzone-grid border border-border/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center items-center">
              <div className="corner-decorator corner-tl"></div>
              <div className="corner-decorator corner-tr"></div>
              <div className="corner-decorator corner-bl"></div>
              <div className="corner-decorator corner-br"></div>
              
              {decodePreview ? (
                <div className="w-full h-full max-h-[40vh] flex items-center justify-center">
                  <ImagePreviewCanvas imageUrl={decodePreview} maxHeight="40vh" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 max-w-xs z-10 bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-border/40 shadow-sm">
                  <div className="size-12 rounded-full bg-slate-50 flex items-center justify-center border border-border/85 shadow-sm text-muted-foreground">
                    <ImageIcon className="size-5" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-normal text-center">
                    {t('b64.pasteHint')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PIE DE PÁGINA: TARJETAS EDITORIALES */}
        <div className="flex flex-col md:flex-row items-center gap-4 select-none w-full">
          {/* Tarjeta 1 */}
          <div className="flex-1 w-full bg-slate-50/60 hover:bg-slate-50/80 border border-border/80 hover:border-[#a855f7]/30 p-5 rounded-2xl transition-all cursor-pointer group flex justify-between items-center relative overflow-hidden hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)] hover:-translate-y-0.5 active:translate-y-0 duration-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/[0.005] to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 bg-[#a855f7]/[0.02] rounded-full pointer-events-none"></div>

            <div className="space-y-1 z-10">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <HelpCircle className="size-3 text-muted-foreground/80" />
                {locale === 'es' ? 'Guía del usuario' : 'User guide'}
              </span>
              <p className="text-sm font-serif text-primary font-medium">
                {locale === 'es' ? '¿Qué es una imagen en Base64?' : 'What is a Base64 image?'}
              </p>
            </div>
            <span className="text-primary group-hover:translate-x-1.5 transition-transform duration-300 font-bold z-10">→</span>
          </div>

          <div className="hidden md:flex items-center justify-center text-border/60 text-lg font-light font-sans px-1 pointer-events-none self-center">
            |
          </div>

          {/* Tarjeta 2 */}
          <div 
            onClick={() => window.location.href = locale === 'es' ? '/es/herramientas/comprimir-imagen' : '/tools/compress-image'}
            className="flex-1 w-full bg-slate-50/60 hover:bg-slate-50/80 border border-border/80 hover:border-[#a855f7]/30 p-5 rounded-2xl transition-all cursor-pointer group flex justify-between items-center relative overflow-hidden hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)] hover:-translate-y-0.5 active:translate-y-0 duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/[0.005] to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 bg-[#a855f7]/[0.02] rounded-full pointer-events-none"></div>
            
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-white bg-[#a855f7] px-1.5 py-0.5 rounded-md">
                  {locale === 'es' ? 'Recomendado' : 'Featured'}
                </span>
              </div>
              <p className="text-sm font-serif text-primary font-medium">
                {locale === 'es' ? 'Optimizar peso de las imágenes' : 'Optimize image file size'}
              </p>
            </div>
            <span className="text-primary group-hover:translate-x-1.5 transition-transform duration-300 font-bold z-10">→</span>
          </div>
        </div>

      </div>

      {/* ─── COLUMNA DERECHA: SIDEBAR DE CONTROLES (DESKTOP) ─── */}
      <div className="hidden lg:flex w-full lg:w-80 shrink-0 bg-white border border-border rounded-2xl flex-col lg:h-full overflow-hidden shadow-sm">
        
        {/* Panel de Controles */}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="font-serif text-lg font-medium text-primary border-b border-border/80 pb-4 mb-6">
            {locale === 'es' ? 'Ajustes de Conversión' : 'Conversion Settings'}
          </h3>
          
          <div className="space-y-8 flex-1">
            {/* Pestañas de Modo */}
            <div className="space-y-3.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                {locale === 'es' ? 'Operación' : 'Operation'}
              </label>
              <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                <button
                  onClick={() => setActiveTab('encode')}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                    activeTab === 'encode' 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <FileCode className="size-3.5" />
                  <span>{t('b64.encode')}</span>
                </button>
                <button
                  onClick={() => setActiveTab('decode')}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                    activeTab === 'decode' 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Code className="size-3.5" />
                  <span>{t('b64.decode')}</span>
                </button>
              </div>
            </div>

            {/* Controles para CODIFICAR */}
            {activeTab === 'encode' && (
              <div className="space-y-6">
                {base64String ? (
                  <>
                    {/* Información del archivo */}
                    <div className="space-y-3 p-4 bg-slate-50/80 border border-slate-100 rounded-xl">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <span className="text-xs font-semibold text-primary truncate max-w-[150px]" title={fileName}>
                          {fileName}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                          {fileName.substring(fileName.lastIndexOf('.')).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{t('opt.original')}:</span>
                        <span className="font-mono font-medium text-primary">{formatBytes(fileSize)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Base64:</span>
                        <span className="font-mono font-medium text-primary">{formatBytes(base64String.length)}</span>
                      </div>
                    </div>

                    {/* Botones de copia rápida */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                        {locale === 'es' ? 'Copiar Formato' : 'Copy Format'}
                      </label>
                      <button 
                        onClick={() => handleCopy('raw')}
                        className="w-full h-10 border border-border rounded-xl hover:bg-slate-50 text-xs font-semibold text-primary transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <Copy className="size-3.5" />
                        <span>{t('b64.copyBase64')}</span>
                      </button>
                      <button 
                        onClick={() => handleCopy('html')}
                        className="w-full h-10 border border-border rounded-xl hover:bg-slate-50 text-xs font-semibold text-primary transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <FileCode className="size-3.5" />
                        <span>{t('b64.copyHtml')}</span>
                      </button>
                      <button 
                        onClick={() => handleCopy('css')}
                        className="w-full h-10 border border-border rounded-xl hover:bg-slate-50 text-xs font-semibold text-primary transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <Code className="size-3.5" />
                        <span>{t('b64.copyCss')}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                      {locale === 'es' ? 'Copiar Formato' : 'Copy Format'}
                    </label>
                    {/* Botones deshabilitados para indicar visualmente que se activarán al subir la imagen */}
                    <button 
                      disabled
                      className="w-full h-10 border border-border rounded-xl text-xs font-semibold text-primary transition-all flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
                    >
                      <Copy className="size-3.5" />
                      <span>{t('b64.copyBase64')}</span>
                    </button>
                    <button 
                      disabled
                      className="w-full h-10 border border-border rounded-xl text-xs font-semibold text-primary transition-all flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
                    >
                      <FileCode className="size-3.5" />
                      <span>{t('b64.copyHtml')}</span>
                    </button>
                    <button 
                      disabled
                      className="w-full h-10 border border-border rounded-xl text-xs font-semibold text-primary transition-all flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
                    >
                      <Code className="size-3.5" />
                      <span>{t('b64.copyCss')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Controles para DECODIFICAR */}
            {activeTab === 'decode' && (
              <div className="space-y-6">
                {decodePreview ? (
                  <div className="space-y-3 p-4 bg-slate-50/80 border border-slate-100 rounded-xl">
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                      <span className="text-xs font-semibold text-primary">{t('b64.formatDetected')}</span>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200/40 font-mono">
                        {decodedFormat.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-normal">
                      {locale === 'es'
                        ? 'La imagen se ha decodificado correctamente y está lista para guardarse.'
                        : 'The image has been successfully decoded and is ready to be saved.'}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 border border-dashed border-border rounded-xl bg-slate-50/40">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('b64.pasteHint')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {copiedLabel && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-semibold text-center animate-fade-in my-2">
              ✅ {copiedLabel}
            </div>
          )}
        </div>

        {/* Sección de Descarga (Footer del Sidebar) */}
        <div className="p-6 border-t border-border/80 bg-slate-50/60 backdrop-blur-sm">
          {activeTab === 'encode' ? (
            <button 
              onClick={handleDownloadTxt}
              disabled={!base64String}
              className="w-full py-3 px-4 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white font-semibold text-xs uppercase tracking-[0.15em] transition-all shadow-sm active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="size-4" />
              <span>{t('shared.downloadTxt')}</span>
            </button>
          ) : (
            <button 
              onClick={handleDownloadDecoded}
              disabled={!decodePreview}
              className="w-full py-3 px-4 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white font-semibold text-xs uppercase tracking-[0.15em] transition-all shadow-sm active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="size-4" />
              <span>{t('shared.download')}</span>
            </button>
          )}
        </div>

      </div>

      {/* ─── STICKY BOTTOM BAR MÓVIL ─── */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-border/80 flex items-center justify-between px-6 z-40 lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.04)] select-none">
        
        {/* Tab 1: Botón Ajustes (Togglea el Drawer) */}
        <button
          onClick={() => setIsMobileControlsOpen(prev => !prev)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
            isMobileControlsOpen ? "text-[#a855f7]" : "text-muted-foreground hover:text-primary"
          )}
        >
          <Sliders className="size-5" />
          <span>{locale === 'es' ? 'Ajustes' : 'Settings'}</span>
        </button>

        {/* Separador vertical interno */}
        <div className="h-8 w-[1px] bg-border/60 pointer-events-none mx-2"></div>

        {/* Tab 2: Botón Descargar (Acción Directa) */}
        {activeTab === 'encode' ? (
          <button
            onClick={handleDownloadTxt}
            disabled={!base64String}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-sm active:scale-98"
          >
            <Download className="size-4" />
            <span>{t('shared.downloadTxt')}</span>
          </button>
        ) : (
          <button
            onClick={handleDownloadDecoded}
            disabled={!decodePreview}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-sm active:scale-98"
          >
            <Download className="size-4" />
            <span>{t('shared.download')}</span>
          </button>
        )}
      </div>

      {/* ─── DRAWER MÓVIL (BOTTOM SHEET) ─── */}
      <Sheet open={isMobileControlsOpen} onOpenChange={setIsMobileControlsOpen}>
        <SheetContent 
          side="bottom" 
          className="p-0 bg-white rounded-t-3xl border-t border-border max-h-[80vh] overflow-y-auto flex flex-col z-50"
          showCloseButton={true}
        >
          <div className="p-6 pb-20">
            <h3 className="font-serif text-lg font-medium text-primary border-b border-border/80 pb-4 mb-6">
              {locale === 'es' ? 'Ajustes de Conversión' : 'Conversion Settings'}
            </h3>
            
            <div className="space-y-8">
              {/* Sección: Operación */}
              <div className="space-y-3.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                  {locale === 'es' ? 'Operación' : 'Operation'}
                </label>
                <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                  <button
                    onClick={() => {
                      setActiveTab('encode');
                      setIsMobileControlsOpen(false);
                    }}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                      activeTab === 'encode' 
                        ? "bg-white text-primary shadow-sm" 
                        : "text-muted-foreground hover:text-primary"
                    )}
                  >
                    <FileCode className="size-3.5" />
                    <span>{t('b64.encode')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('decode');
                      setIsMobileControlsOpen(false);
                    }}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                      activeTab === 'decode' 
                        ? "bg-white text-primary shadow-sm" 
                        : "text-muted-foreground hover:text-primary"
                    )}
                  >
                    <Code className="size-3.5" />
                    <span>{t('b64.decode')}</span>
                  </button>
                </div>
              </div>

              {/* Controles para CODIFICAR en móvil */}
              {activeTab === 'encode' && base64String && (
                <div className="space-y-6">
                  <div className="space-y-3 p-4 bg-slate-50/80 border border-slate-100 rounded-xl">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <span className="text-xs font-semibold text-primary truncate max-w-[200px]">
                        {fileName}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('opt.original')}:</span>
                      <span className="font-mono font-medium text-primary">{formatBytes(fileSize)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Base64:</span>
                      <span className="font-mono font-medium text-primary">{formatBytes(base64String.length)}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <button 
                      onClick={() => {
                        handleCopy('raw');
                        setIsMobileControlsOpen(false);
                      }}
                      className="w-full h-10 border border-border rounded-xl hover:bg-slate-50 text-xs font-semibold text-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Copy className="size-3.5" />
                      <span>{t('b64.copyBase64')}</span>
                    </button>
                    <button 
                      onClick={() => {
                        handleCopy('html');
                        setIsMobileControlsOpen(false);
                      }}
                      className="w-full h-10 border border-border rounded-xl hover:bg-slate-50 text-xs font-semibold text-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileCode className="size-3.5" />
                      <span>{t('b64.copyHtml')}</span>
                    </button>
                    <button 
                      onClick={() => {
                        handleCopy('css');
                        setIsMobileControlsOpen(false);
                      }}
                      className="w-full h-10 border border-border rounded-xl hover:bg-slate-50 text-xs font-semibold text-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Code className="size-3.5" />
                      <span>{t('b64.copyCss')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Controles para DECODIFICAR en móvil */}
              {activeTab === 'decode' && decodePreview && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-50/80 border border-slate-100 rounded-xl">
                    <span className="text-xs font-semibold text-primary">{t('b64.formatDetected')}</span>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200/40 font-mono">
                      {decodedFormat.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
};
