import React, { useState, useEffect, useRef } from 'react';
import { useLocale } from '../../core/i18n/useLocale';
import { useToast } from '../../shared/components/Errors/ToastContext';
import { ImagePreviewCanvas } from '../../shared/components/UI/ImagePreviewCanvas/ImagePreviewCanvas';
import { LoaderPrime } from '../../shared/components/UI/Loader/LoaderPrime';
import { Sheet, SheetContent } from '../../shared/components/ui/sheet';
import { validateImageFile } from '../../shared/utils/fileUpload';
import { extractColorsFromImage, generateHarmonies } from './colorExtractor';
import { ExtractedSwatch, ColorFormat, HarmonicColor } from './color';
import { cn } from '../../shared/utils/cn';
import { 
  Trash2, 
  Upload, 
  Download, 
  HelpCircle, 
  Image as ImageIcon,
  Sliders,
  X 
} from 'lucide-react';
import JSZip from 'jszip';
import './ColorPaletteModule.css';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  swatches: ExtractedSwatch[] | null;
  harmonies: HarmonicColor[] | null;
  isProcessing: boolean;
}

export const ColorPaletteModule: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [format, setFormat] = useState<ColorFormat>('HEX');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  
  const { t, locale } = useLocale();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeImage = activeIndex >= 0 && activeIndex < images.length ? images[activeIndex] : null;

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  // Mapeo de traducciones para nombres de colores y armonías
  const translateName = (name: string) => {
    const translations: Record<string, Record<string, string>> = {
      'Vibrante': { en: 'Vibrant', es: 'Vibrante' },
      'Vibrante Claro': { en: 'Light Vibrant', es: 'Vibrante Claro' },
      'Vibrante Oscuro': { en: 'Dark Vibrant', es: 'Vibrante Oscuro' },
      'Apagado': { en: 'Muted', es: 'Apagado' },
      'Apagado Claro': { en: 'Light Muted', es: 'Apagado Claro' },
      'Apagado Oscuro': { en: 'Dark Muted', es: 'Apagado Oscuro' },
      'Monocromático': { en: 'Monochromatic', es: 'Monocromático' },
      'Análogo': { en: 'Analogous', es: 'Análogo' },
      'Complementario': { en: 'Complementary', es: 'Complementario' },
      'Triada': { en: 'Triadic', es: 'Triada' },
      'Análogo 1': { en: 'Analogous 1', es: 'Análogo 1' },
      'Análogo 2': { en: 'Analogous 2', es: 'Análogo 2' },
      'Triádico 1': { en: 'Triadic 1', es: 'Triádico 1' },
      'Triádico 2': { en: 'Triadic 2', es: 'Triádico 2' },
    };
    return translations[name]?.[locale] || name;
  };

  const getFormatCode = (color: ExtractedSwatch | import('../../tools/ColorPalette/color').HarmonicColorScale) => {
    switch (format) {
      case 'HEX': return color.hex;
      case 'RGB': return color.rgb;
      case 'HSL': return color.hsl;
      case 'OKLCH': return color.oklch;
      default: return color.hex;
    }
  };

  const handleCopyColor = (colorCode: string) => {
    navigator.clipboard.writeText(colorCode).then(() => {
      showToast(`${t('cp.copied')} ${colorCode}`, 'success');
    }).catch(() => {
      showToast(t('cp.copyError'), 'error');
    });
  };

  const extractColors = async (item: ImageItem) => {
    try {
      const swatchesResult = await extractColorsFromImage(item.previewUrl);
      let harmoniesResult: HarmonicColor[] | null = null;
      
      const vibrant = swatchesResult.find(s => s.name === 'Vibrante');
      if (vibrant) {
        harmoniesResult = await generateHarmonies(vibrant.hex);
      }

      setImages(prev => prev.map(img => img.id === item.id ? {
        ...img,
        swatches: swatchesResult,
        harmonies: harmoniesResult,
        isProcessing: false
      } : img));
    } catch (error: any) {
      console.error("Error extrayendo colores:", error);
      setImages(prev => prev.map(img => img.id === item.id ? {
        ...img,
        isProcessing: false
      } : img));
      
      const isNetworkError = error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk');
      showToast(
        isNetworkError 
          ? (locale === 'es' ? 'Error de red al cargar el motor de extracción.' : 'Network error loading extraction engine.')
          : (locale === 'es' ? 'No se pudieron extraer los colores de esta imagen.' : 'Could not extract colors from this image.'),
        'error'
      );
    }
  };

  const handleFilesSelected = (files: FileList | File[]) => {
    const newItems: ImageItem[] = [];
    const filesArr = Array.from(files);
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

    for (const file of filesArr) {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        showToast(validation.error || 'Archivo inválido', 'error');
        continue;
      }

      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        showToast(
          locale === 'es'
            ? `Formato no soportado (${ext.toUpperCase()}). Por favor, sube una imagen en formato JPG, JPEG, PNG o WebP.`
            : `Unsupported format (${ext.toUpperCase()}). Please upload a JPG, JPEG, PNG, or WebP image.`,
          'error'
        );
        continue;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);
      
      newItems.push({
        id,
        file,
        previewUrl,
        swatches: null,
        harmonies: null,
        isProcessing: true
      });
    }

    if (newItems.length > 0) {
      setImages(prev => {
        const updated = [...prev, ...newItems];
        if (activeIndex === -1) {
          setActiveIndex(prev.length);
        }
        return updated;
      });

      // Trigger extraction for each new image
      newItems.forEach(item => {
        extractColors(item);
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleClear = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setActiveIndex(-1);
    setIsMobileControlsOpen(false);
    showToast(locale === 'es' ? 'Se limpiaron todas las imágenes.' : 'All images cleared.', 'success');
  };

  const handleRemoveImage = (e: React.MouseEvent, idToRemove: string) => {
    e.stopPropagation();
    const idxToRemove = images.findIndex(img => img.id === idToRemove);
    if (idxToRemove === -1) return;

    URL.revokeObjectURL(images[idxToRemove].previewUrl);

    setImages(prev => {
      const updated = prev.filter(img => img.id !== idToRemove);
      
      if (updated.length === 0) {
        setActiveIndex(-1);
        setIsMobileControlsOpen(false);
      } else if (activeIndex === idxToRemove) {
        setActiveIndex(Math.max(0, idxToRemove - 1));
      } else if (activeIndex > idxToRemove) {
        setActiveIndex(activeIndex - 1);
      }
      return updated;
    });
  };

  const handleDownload = async () => {
    if (images.length === 0) return;
    
    const unprocessed = images.some(img => img.isProcessing || !img.swatches);
    if (unprocessed) {
      showToast(
        locale === 'es' 
          ? 'Espera a que termine el procesamiento de todas las imágenes.' 
          : 'Please wait for all images to finish processing.', 
        'error'
      );
      return;
    }

    try {
      if (images.length === 1) {
        const item = images[0];
        const paletteData = {
          imageName: item.file.name,
          extractedAt: new Date().toISOString(),
          dominantPalette: item.swatches?.map(s => ({
            name: s.name,
            hex: s.hex,
            rgb: s.rgb,
            hsl: s.hsl,
            oklch: s.oklch
          })),
          harmonies: item.harmonies?.map(h => ({
            type: h.type,
            colors: h.colors.map(c => ({
              hex: c.hex,
              rgb: c.rgb,
              hsl: c.hsl,
              oklch: c.oklch
            }))
          }))
        };

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(paletteData, null, 2))}`;
        const downloadAnchor = document.createElement('a');
        
        const prefix = locale === 'es' ? 'Pixetide_Paleta_' : 'Pixetide_Palette_';
        const originalNameWithoutExt = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
        
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', `${prefix}${originalNameWithoutExt}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        showToast(
          locale === 'es' ? 'Paleta descargada con éxito.' : 'Palette downloaded successfully.',
          'success'
        );
      } else {
        const zip = new JSZip();
        
        images.forEach(item => {
          const paletteData = {
            imageName: item.file.name,
            extractedAt: new Date().toISOString(),
            dominantPalette: item.swatches?.map(s => ({
              name: s.name,
              hex: s.hex,
              rgb: s.rgb,
              hsl: s.hsl,
              oklch: s.oklch
            })),
            harmonies: item.harmonies?.map(h => ({
              type: h.type,
              colors: h.colors.map(c => ({
                hex: c.hex,
                rgb: c.rgb,
                hsl: c.hsl,
                oklch: c.oklch
              }))
            }))
          };

          const originalNameWithoutExt = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
          const prefix = locale === 'es' ? 'Pixetide_Paleta_' : 'Pixetide_Palette_';
          
          zip.file(`${prefix}${originalNameWithoutExt}.json`, JSON.stringify(paletteData, null, 2));
        });

        const content = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(content);
        const downloadAnchor = document.createElement('a');
        
        const zipName = locale === 'es' ? 'Pixetide_Paletas_Colores.zip' : 'Pixetide_Color_Palettes.zip';
        
        downloadAnchor.setAttribute('href', zipUrl);
        downloadAnchor.setAttribute('download', zipName);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        URL.revokeObjectURL(zipUrl);

        showToast(
          locale === 'es' 
            ? `Descargadas ${images.length} paletas en archivo ZIP.` 
            : `Successfully downloaded ${images.length} palettes in a ZIP file.`,
          'success'
        );
      }
    } catch (err) {
      console.error("Error downloading palettes:", err);
      showToast(locale === 'es' ? 'Error al generar la descarga.' : 'Error generating download.', 'error');
    }
  };

  // Sub-componentes para evitar duplicar código entre la sidebar de escritorio y el drawer móvil
  const renderSettings = () => (
    <div className="space-y-3">
      <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
        {t('cp.colorFormat')}
      </label>
      <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/40">
        {(['HEX', 'RGB', 'HSL', 'OKLCH'] as ColorFormat[]).map(fmt => (
          <button 
            key={fmt} 
            type="button" 
            className={cn(
              "py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center",
              format === fmt 
                ? "bg-white text-primary shadow-sm" 
                : "text-muted-foreground hover:text-primary"
            )}
            onClick={() => setFormat(fmt)}
          >
            {fmt}
          </button>
        ))}
      </div>
    </div>
  );

  const renderSwatches = (isMobileGrid = false) => {
    if (activeImage?.isProcessing) {
      return (
        <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
          {locale === 'es' ? 'Extrayendo colores...' : 'Extrayendo colores...'}
        </div>
      );
    }

    if (!activeImage) {
      return (
        <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
          {locale === 'es' ? 'Sube una imagen para ver su paleta' : 'Upload an image to see its palette'}
        </div>
      );
    }

    if (activeImage.swatches) {
      return (
        <div className={cn("grid gap-2", isMobileGrid ? "grid-cols-2" : "grid-cols-1")}>
          {activeImage.swatches.map((swatch, idx) => {
            const code = getFormatCode(swatch);
            const name = translateName(swatch.name);
            return (
              <div 
                key={idx} 
                onClick={() => handleCopyColor(code)} 
                className="flex items-center gap-3 p-2 rounded-xl border border-border/60 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group shadow-sm min-w-0"
                title={`${t('cp.copy')} ${name}`}
              >
                <div 
                  className="size-10 rounded-lg shadow-inner border border-black/5 flex items-center justify-center relative overflow-hidden flex-shrink-0 transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)] group-hover:z-10" 
                  style={{ backgroundColor: swatch.hex }}
                >
                  <span className="text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none uppercase tracking-wider animate-fade-in" style={{ color: swatch.textColor }}>
                    {t('cp.copy')}
                  </span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-primary truncate leading-tight">{name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground truncate">{code}</span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  const renderHarmonies = () => {
    if (activeImage && !activeImage.isProcessing && activeImage.harmonies) {
      return (
        <div className="space-y-4 pt-4 border-t border-border/80">
          <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
            {t('cp.harmonicPalette')}
          </label>
          <div className="space-y-3">
            {activeImage.harmonies.map((harmony, idx) => (
              <div key={idx} className="space-y-1.5">
                <span className="text-[10px] font-semibold text-primary block leading-none">{translateName(harmony.type)}</span>
                <div className="flex h-7 rounded-lg border border-black/5 shadow-sm relative">
                  {harmony.colors.map((color, colorIdx) => {
                    const code = getFormatCode(color);
                    return (
                      <div 
                        key={colorIdx} 
                        onClick={() => handleCopyColor(code)} 
                        className="flex-1 h-full cursor-pointer relative group flex items-center justify-center transition-all duration-300 first:rounded-l-lg last:rounded-r-lg hover:scale-y-130 hover:scale-x-115 hover:z-10 hover:rounded-md hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                        style={{ backgroundColor: color.hex }}
                        title={`${t('cp.copy')} ${code}`}
                      >
                        <span className="text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none uppercase tracking-wider" style={{ color: color.textColor }}>
                          {t('cp.copy')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full lg:h-full select-none pb-20 lg:pb-0">
      <input 
        type="file" 
        accept="image/*" 
        multiple 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={(e) => {
          if (e.target.files) handleFilesSelected(e.target.files);
        }} 
      />

      {/* COLUMNA IZQUIERDA: ESPACIO DE TRABAJO */}
      <div className="flex-1 flex flex-col min-w-0 gap-6 lg:h-full">
        {/* Cabecera Interna de la Herramienta */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl md:text-3xl text-primary font-medium tracking-tight">
              {locale === 'es' ? 'Paleta de Colores' : 'Color Palette'}
            </h2>
            <p className="text-xs text-muted-foreground leading-normal max-w-xl">
              {locale === 'es' 
                ? 'Extrae colores de tus imágenes y genera armonías cromáticas locales.'
                : 'Extract colors from your images and generate local chromatic harmonies.'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={handleClear}
              disabled={images.length === 0}
              className="h-9 px-4 rounded-full border border-border hover:bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="size-3.5" />
              <span>{locale === 'es' ? 'Limpiar todo' : 'Clear all'}</span>
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="h-9 px-4 rounded-full bg-primary hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="size-3.5" />
              <span>{locale === 'es' ? 'Subir Nueva' : 'Upload New'}</span>
            </button>
          </div>
        </div>

        {/* Visor Principal / Dropzone */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={images.length === 0 ? () => fileInputRef.current?.click() : undefined}
          className={cn(
            "flex-1 min-h-[350px] dropzone-grid border border-border/80 rounded-2xl flex items-center justify-center p-6 relative overflow-hidden transition-colors bg-white group",
            images.length === 0 && "cursor-pointer",
            isDragOver && "bg-slate-50/80 border-purple-400"
          )}
        >
          {/* Esquinas decorativas */}
          <div className="corner-decorator corner-tl"></div>
          <div className="corner-decorator corner-tr"></div>
          <div className="corner-decorator corner-bl"></div>
          <div className="corner-decorator corner-br"></div>

          {/* Overlay de Carga */}
          {activeImage && activeImage.isProcessing && (
            <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-md flex items-center justify-center z-20 animate-fade-in">
              <LoaderPrime 
                message={locale === 'es' ? 'Analizando colores...' : 'Analyzing colors...'} 
              />
            </div>
          )}

          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center cursor-pointer group z-10 w-full">
              <div className="flex flex-col items-center gap-4 max-w-sm bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-border/40 shadow-sm transition-all group-hover:shadow-md animate-fade-in mx-auto w-full">
                <div className="size-14 rounded-full bg-white flex items-center justify-center border border-border/85 shadow-sm text-muted-foreground">
                  <ImageIcon className="size-6" />
                </div>
                <div className="space-y-3 w-full text-center">
                  <div className="space-y-1.5 text-center">
                    <p className="text-sm font-semibold text-primary text-center">
                      {locale === 'es' ? 'Arrastra tu imagen aquí o haz clic' : 'Drag your image here or click'}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-normal text-center">
                      {locale === 'es' 
                        ? 'Procesamiento 100% local. Máximo 20MB por archivo.'
                        : '100% local processing. Maximum 20MB per file.'}
                    </p>
                  </div>
                  {/* Formatos Badges */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    {['PNG', 'JPG', 'JPEG', 'WEBP'].map((fmt) => (
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
          ) : (
            activeImage && (
              <div className="w-full h-full flex items-center justify-center relative z-10 max-h-[55vh]">
                <ImagePreviewCanvas 
                  imageUrl={activeImage.previewUrl} 
                  maxHeight="50vh" 
                  className={cn(
                    "max-w-full max-h-full object-contain rounded transition-all !bg-transparent !bg-none !border-none !shadow-none",
                    activeImage.isProcessing && "filter blur-[3px]"
                  )} 
                  alt="Vista previa" 
                />
              </div>
            )
          )}
        </div>

        {/* GALLERY AREA (Visualización de miniaturas) */}
        <div className="bg-white border border-border/80 rounded-2xl p-4 flex flex-col justify-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[128px]">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center space-y-1 py-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground/50">
                {locale === 'es' ? 'Área de Galería' : 'Gallery Area'}
              </span>
              <span className="text-xs text-muted-foreground/70">
                {locale === 'es' ? 'Sube una o varias imágenes para ver las miniaturas aquí' : 'Upload one or multiple images to see thumbnails here'}
              </span>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto py-2 px-1 scrollbar-thin">
              {images.map((img, idx) => (
                <div 
                  key={img.id}
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "relative size-16 rounded-xl border overflow-hidden cursor-pointer flex-shrink-0 transition-all shadow-sm hover:scale-105",
                    idx === activeIndex ? "border-[#a855f7] ring-2 ring-purple-500/20" : "border-border hover:border-muted-foreground/45"
                  )}
                >
                  <img 
                    src={img.previewUrl} 
                    alt="Thumbnail" 
                    className="w-full h-full object-cover transition-transform origin-center"
                  />
                  {/* Botón de borrar miniatura */}
                  <button 
                    onClick={(e) => handleRemoveImage(e, img.id)}
                    className="absolute -top-1 -right-1 size-5 bg-black/60 hover:bg-black rounded-full flex items-center justify-center text-white transition-colors cursor-pointer"
                    title={locale === 'es' ? 'Quitar' : 'Quitar'}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ENLACES / INFORMACIÓN DE PIE DE PÁGINA */}
        <div className="flex flex-col md:flex-row items-center gap-4 select-none w-full">
          <div className="flex-1 w-full bg-slate-50/60 hover:bg-slate-50/80 border border-border/80 hover:border-[#a855f7]/30 p-5 rounded-2xl transition-all cursor-pointer group flex justify-between items-center relative overflow-hidden hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)] hover:-translate-y-0.5 active:translate-y-0 duration-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/[0.005] to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 bg-[#a855f7]/[0.02] rounded-full pointer-events-none"></div>

            <div className="space-y-1 z-10">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <HelpCircle className="size-3 text-muted-foreground/80" />
                {locale === 'es' ? 'Guía del usuario' : 'Guía del usuario'}
              </span>
              <p className="text-sm font-serif text-primary font-medium">
                {locale === 'es' ? '¿Cómo funciona la extracción local y los formatos de color?' : 'How does local extraction and color formats work?'}
              </p>
            </div>
            <span className="text-primary group-hover:translate-x-1.5 transition-transform duration-300 font-bold z-10">→</span>
          </div>

          <div className="hidden md:flex items-center justify-center text-border/60 text-lg font-light font-sans px-1 pointer-events-none self-center">
            |
          </div>

          <div 
            onClick={() => window.location.href = locale === 'es' ? '/es/herramientas/quitar-fondo/' : '/tools/remove-background/'}
            className="flex-1 w-full bg-slate-50/60 hover:bg-slate-50/80 border border-border/80 hover:border-[#a855f7]/30 p-5 rounded-2xl transition-all cursor-pointer group flex justify-between items-center relative overflow-hidden hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)] hover:-translate-y-0.5 active:translate-y-0 duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/[0.005] to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 bg-[#a855f7]/[0.02] rounded-full pointer-events-none"></div>
            
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-white bg-[#a855f7] px-1.5 py-0.5 rounded-md">
                  {locale === 'es' ? 'Recomendado' : 'Recomendado'}
                </span>
              </div>
              <p className="text-sm font-serif text-primary font-medium">
                {locale === 'es' ? 'Quitar fondo a imágenes con IA local' : 'Remove background from images with local AI'}
              </p>
            </div>
            <span className="text-primary group-hover:translate-x-1.5 transition-transform duration-300 font-bold z-10">→</span>
          </div>
        </div>
      </div>

      {/* COLUMNA DERECHA: Sidebar de Control y Resultados (Desktop) */}
      <aside className="hidden lg:flex w-[320px] bg-white border border-border/80 rounded-2xl flex-col justify-between overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-thin">
          {/* Sección Ajustes */}
          {renderSettings()}

          {/* Muestras de la paleta dominante */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
              {locale === 'es' ? 'Paleta Dominante' : 'Dominant Palette'}
            </label>
            {renderSwatches(false)}
          </div>

          {/* Armonías cromáticas */}
          {renderHarmonies()}
        </div>

        {/* Botón de descarga principal */}
        <div className="p-6 border-t border-border/80 bg-slate-50/60 backdrop-blur-sm">
          <button 
            onClick={handleDownload}
            disabled={images.length === 0 || images.some(img => img.isProcessing)}
            className="w-full py-3 px-4 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white font-semibold text-xs uppercase tracking-[0.15em] transition-all shadow-sm active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="size-4" />
            <span>
              {locale === 'es' 
                ? (images.length > 1 ? 'DESCARGAR (.zip)' : 'DESCARGAR .JSON')
                : (images.length > 1 ? 'DOWNLOAD (.zip)' : 'DOWNLOAD .JSON')}
            </span>
          </button>
        </div>
      </aside>



      {/* DRAWER MÓVIL DE AJUSTES Y RESULTADOS */}
      <Sheet open={isMobileControlsOpen} onOpenChange={setIsMobileControlsOpen}>
        <SheetContent side="bottom" className="h-[80vh] p-0 flex flex-col rounded-t-3xl overflow-hidden bg-white border-t border-border z-50 animate-fade-in">
          <div className="p-4 border-b border-border/80 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Sliders className="size-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {locale === 'es' ? 'Ajustes y Paletas' : 'Ajustes y Paletas'}
              </span>
            </div>
            <button 
              onClick={() => setIsMobileControlsOpen(false)}
              className="size-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-muted-foreground transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {renderSettings()}

            <div className="space-y-3">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                {locale === 'es' ? 'Paleta Dominante' : 'Dominant Palette'}
              </label>
              {renderSwatches(true)}
            </div>

            {renderHarmonies()}
          </div>
        </SheetContent>
      </Sheet>

      {/* STICKY BOTTOM BAR MÓVIL */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-border/80 flex items-center justify-between px-6 z-40 lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.04)] select-none">
        <button
          onClick={() => setIsMobileControlsOpen(prev => !prev)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
            isMobileControlsOpen ? "text-[#a855f7]" : "text-muted-foreground hover:text-primary"
          )}
        >
          <Sliders className="size-5" />
          <span>{locale === 'es' ? 'Ajustes' : 'Ajustes'}</span>
        </button>

        <div className="h-8 w-[1px] bg-border/60 pointer-events-none mx-2"></div>

        <button
          onClick={handleDownload}
          disabled={images.length === 0 || images.some(img => img.isProcessing)}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-sm active:scale-98"
        >
          <Download className="size-4" />
          <span>
            {locale === 'es' 
              ? (images.length > 1 ? 'DESCARGAR (.zip)' : 'DESCARGAR .JSON')
              : (images.length > 1 ? 'DOWNLOAD (.zip)' : 'DOWNLOAD .JSON')}
          </span>
        </button>
      </div>
    </div>
  );
};
