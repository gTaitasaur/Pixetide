import React, { useState, useEffect, useRef } from 'react';
import { useLocale } from '../../core/i18n/useLocale';
import './OptimizerModule.css';
import { 
  Minimize2, 
  Trash2, 
  Upload, 
  Download, 
  Sliders,
  X,
  HelpCircle
} from 'lucide-react';
import { validateImageFile } from '../../shared/utils/fileUpload';
import { useToast } from '../../shared/components/Errors/ToastContext';
import { Sheet, SheetContent } from '../../shared/components/ui/sheet';
import { cn } from '../../shared/utils/cn';
import LoaderPrime from '../../shared/components/UI/Loader/LoaderPrime';
// @ts-expect-error - Vite Web Worker import syntax
import OptimizerWorker from './optimizer.worker?worker';
import JSZip from 'jszip';
import { COMPRESSION_PRESETS, OptimizerImageItem, CompressionPresetId } from './optimizer';

export const OptimizerModule: React.FC = () => {
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  
  // Galería de imágenes cargadas en memoria
  const [images, setImages] = useState<OptimizerImageItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  const [isImagesLoading, setIsImagesLoading] = useState<boolean>(false);
  const [uploadCount, setUploadCount] = useState<number>(0);
  const [vipsState, setVipsState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [globalProcessing, setGlobalProcessing] = useState<boolean>(false);

  const isFirstLoadRef = useRef<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [processingError, setProcessingError] = useState<{ id: string; message: string } | null>(null);

  const activeImage = activeIndex >= 0 && activeIndex < images.length ? images[activeIndex] : null;

  // Liberar ObjectURLs para evitar fugas de memoria
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  // Limpieza del Worker al desmontar
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);



  // Inicialización del Worker de Optimización
  const initializeWorker = () => {
    if (workerRef.current) return;

    let hasLoadedBefore = false;
    try {
      hasLoadedBefore = localStorage.getItem('pixetide_optimizer_loaded') === 'true';
    } catch (err) {
      console.warn('LocalStorage unavailable', err);
    }

    const startTime = Date.now();
    try {
      const worker = new OptimizerWorker() as Worker;
      workerRef.current = worker;

      worker.onerror = (err) => {
        console.error('Worker global error:', err);
        showToast(
          locale === 'es'
            ? 'Ocurrió un error desconocido. Por favor, intenta de nuevo.'
            : 'An unknown error occurred. Please try again.',
          'error'
        );
        setVipsState('error');
      };

      worker.onmessage = (e) => {
        const { type, message, id, blob, size, isSavingOriginal } = e.data;

        if (type === 'initialized') {
          const elapsed = Date.now() - startTime;
          const minDelay = hasLoadedBefore ? 1000 : 2000;
          const remaining = Math.max(0, minDelay - elapsed);
          
          setTimeout(() => {
            setVipsState('loaded');
            try {
              localStorage.setItem('pixetide_optimizer_loaded', 'true');
            } catch (err) {
              console.warn('LocalStorage unavailable', err);
            }
          }, remaining);
        } else if (type === 'init_error') {
          console.error('Worker error:', message);
          showToast(
            locale === 'es'
              ? 'Ocurrió un error desconocido. Por favor, intenta de nuevo.'
              : 'An unknown error occurred. Please try again.',
            'error'
          );
          setVipsState('error');
        } else if (type === 'result') {
          setImages(prev => prev.map(img => {
            if (img.id === id) {
              return {
                ...img,
                optimizedBlob: blob,
                optimizedSize: size,
                isSavingOriginal,
                isProcessing: false
              };
            }
            return img;
          }));
        } else if (type === 'process_error') {
          console.error('Processing error:', message);
          setImages(prev => prev.map(img => {
            if (img.id === id) {
              return { ...img, isProcessing: false };
            }
            return img;
          }));
          if (e.data.code === 'FILE_NOT_FOUND') {
            setProcessingError({
              id,
              message: message || (locale === 'es' ? 'No se pudo encontrar el archivo original sobre el que se está trabajando.' : 'Could not find the original file you are working on.')
            });
          } else {
            showToast(
              locale === 'es'
                ? 'No se pudo optimizar una de las imágenes.'
                : 'Could not optimize one of the images.',
              'error'
            );
          }
        }
      };

      worker.postMessage({ action: 'init' });
    } catch (err) {
      console.error('Error instantiating or initializing worker:', err);
      showToast(
        locale === 'es'
          ? 'Ocurrió un error desconocido. Por favor, intenta de nuevo.'
          : 'An unknown error occurred. Please try again.',
        'error'
      );
      setVipsState('error');
    }
  };

  // Disparar procesamiento de una imagen en el Worker
  const requestImageOptimization = (item: OptimizerImageItem) => {
    if (!workerRef.current) return;

    setImages(prev => prev.map(img => {
      if (img.id === item.id) {
        return { ...img, isProcessing: true };
      }
      return img;
    }));

    const preset = COMPRESSION_PRESETS.find(p => p.id === item.selectedPreset);
    try {
      workerRef.current.postMessage({
        action: 'process',
        id: item.id,
        file: item.file,
        presetId: item.selectedPreset,
        quality: preset?.quality ?? 80,
        keepDimensions: item.keepDimensions,
        webpFormat: item.webpFormat
      });
    } catch (err) {
      // Capturar fallas de clonación si el archivo desaparece del disco
      setImages(prev => prev.map(img => {
        if (img.id === item.id) {
          return { ...img, isProcessing: false };
        }
        return img;
      }));
      setProcessingError({
        id: item.id,
        message: locale === 'es'
          ? 'No se pudo encontrar el archivo original sobre el que se está trabajando.'
          : 'Could not find the original file you are working on.'
      });
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;

    setUploadCount(filesList.length);
    setIsImagesLoading(true);

    if (vipsState === 'idle') {
      let hasLoadedBefore = false;
      try {
        hasLoadedBefore = localStorage.getItem('pixetide_optimizer_loaded') === 'true';
      } catch (err) {
        console.warn('LocalStorage unavailable', err);
      }
      isFirstLoadRef.current = !hasLoadedBefore;
      setVipsState('loading');
      initializeWorker();
    }

    // Espera del loader
    await new Promise((resolve) => setTimeout(resolve, 300));

    const validImages: OptimizerImageItem[] = [];
    const supportedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    const supportedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      const isMimeSupported = supportedMimeTypes.includes(file.type);
      const isExtensionSupported = supportedExtensions.includes(extension);

      if (!isMimeSupported || !isExtensionSupported) {
        showToast(
          locale === 'es'
            ? `El archivo "${file.name}" no se pudo cargar porque no tiene el formato correcto.`
            : `The file "${file.name}" could not be loaded because it is not in the correct format.`,
          'error'
        );
        continue;
      }

      const validation = validateImageFile(file);
      if (!validation.isValid) {
        showToast(validation.error || 'Archivo inválido', 'error');
        continue;
      }

      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      
      const newItem: OptimizerImageItem = {
        id,
        file,
        previewUrl,
        selectedPreset: 'normal',
        keepDimensions: true,
        webpFormat: false,
        optimizedBlob: null,
        optimizedSize: null,
        isSavingOriginal: false,
        isProcessing: false
      };

      validImages.push(newItem);
    }

    if (validImages.length > 0) {
      setProcessingError(null); // Limpiar error si subimos archivos nuevos
      setImages(prev => {
        const next = [...prev, ...validImages];
        if (prev.length === 0) {
          setActiveIndex(0);
        }
        return next;
      });

      // Procesar cada imagen inicialmente
      setTimeout(() => {
        validImages.forEach(img => requestImageOptimization(img));
      }, 100);
    }

    const delay = images.length === 0 && isFirstLoadRef.current ? 1200 : 1000;
    setTimeout(() => {
      setIsImagesLoading(false);
    }, delay);
  };

  const handleClearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setActiveIndex(-1);
    setProcessingError(null);
    showToast(
      locale === 'es' ? 'Se han eliminado todas las imágenes.' : 'All images have been removed.',
      undefined
    );
  };

  const handleRemoveImage = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (processingError && processingError.id === id) {
      setProcessingError(null);
    }
    const indexToRemove = images.findIndex(img => img.id === id);
    if (indexToRemove !== -1) {
      URL.revokeObjectURL(images[indexToRemove].previewUrl);
      const updated = images.filter(img => img.id !== id);
      setImages(updated);
      
      if (updated.length === 0) {
        setActiveIndex(-1);
      } else if (activeIndex === indexToRemove) {
        setActiveIndex(Math.max(0, indexToRemove - 1));
      } else if (activeIndex > indexToRemove) {
        setActiveIndex(activeIndex - 1);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSelectPreset = (presetId: CompressionPresetId) => {
    if (!activeImage) return;
    const updated = { ...activeImage, selectedPreset: presetId };
    setImages(prev => prev.map((img, idx) => idx === activeIndex ? updated : img));
    requestImageOptimization(updated);
  };

  const handleToggleKeepDimensions = () => {
    if (!activeImage) return;
    const updated = { ...activeImage, keepDimensions: !activeImage.keepDimensions };
    setImages(prev => prev.map((img, idx) => idx === activeIndex ? updated : img));
    requestImageOptimization(updated);
  };

  const handleToggleWebpFormat = () => {
    if (!activeImage) return;
    const updated = { ...activeImage, webpFormat: !activeImage.webpFormat };
    setImages(prev => prev.map((img, idx) => idx === activeIndex ? updated : img));
    requestImageOptimization(updated);
  };

  // Descarga
  const handleDownload = async () => {
    if (images.length === 0 || globalProcessing) return;

    setGlobalProcessing(true);
    try {
      if (images.length === 1) {
        const item = images[0];
        if (!item.optimizedBlob) return;
        
        const url = URL.createObjectURL(item.optimizedBlob);
        const a = document.createElement('a');
        const originalName = item.file.name;
        const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
        const ext = item.webpFormat ? '.webp' : originalName.substring(originalName.lastIndexOf('.'));
        
        a.href = url;
        a.download = `Optimizada_Pixetide_${baseName}${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast(
          locale === 'es' ? 'Imagen descargada correctamente.' : 'Image downloaded successfully.',
          'success'
        );
      } else {
        const zip = new JSZip();
        
        for (let i = 0; i < images.length; i++) {
          const item = images[i];
          if (item.optimizedBlob) {
            const originalName = item.file.name;
            const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
            const ext = item.webpFormat ? '.webp' : originalName.substring(originalName.lastIndexOf('.'));
            zip.file(`Optimizada_Pixetide_${baseName}${ext}`, item.optimizedBlob);
          }
        }
        
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Pixetide_Imagenes_Optimizadas.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast(
          locale === 'es'
            ? `Descargadas ${images.length} imágenes en ZIP.`
            : `Successfully downloaded ${images.length} images in ZIP.`,
          'success'
        );
      }
    } catch (err) {
      console.error(err);
      showToast(
        locale === 'es' ? 'Ocurrió un error al descargar.' : 'An error occurred during download.',
        'error'
      );
    } finally {
      setGlobalProcessing(false);
    }
  };

  const formatSize = (bytes: number | null): string => {
    if (bytes === null || bytes === undefined) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };


  const activePreset = COMPRESSION_PRESETS.find(p => p.id === activeImage?.selectedPreset);

  const renderControls = () => (
    <div className="space-y-8 flex-1 flex flex-col">
      {/* Sección: Preajustes de Compresión */}
      <div className="space-y-4">
        <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
          {locale === 'es' ? 'Nivel de Compresión' : 'Compression Level'}
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {COMPRESSION_PRESETS.map((preset) => {
            const isActive = activeImage?.selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                disabled={!activeImage || activeImage.isProcessing}
                className={cn(
                  "flex flex-col items-start text-left p-3 rounded-xl border transition-all relative overflow-hidden group select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-semibold",
                  isActive 
                    ? "border-[#a855f7] bg-purple-50/40 text-[#a855f7]" 
                    : "border-border hover:bg-slate-50 text-muted-foreground"
                )}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Minimize2 className={cn("size-4 transition-colors", isActive ? "text-[#a855f7]" : "text-muted-foreground group-hover:text-primary")} />
                </div>
                <span className={cn(
                  "text-xs font-semibold transition-colors",
                  isActive ? "text-[#a855f7]" : "text-muted-foreground group-hover:text-primary"
                )}>
                  {preset.label[locale]}
                </span>
                <span className={cn(
                  "text-[9px] font-mono mt-0.5 line-clamp-1 transition-colors",
                  isActive ? "text-[#a855f7]/70" : "text-muted-foreground/75"
                )}>
                  {preset.subLabel[locale]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Descripción contextual del preajuste activo */}
        {activeImage && activePreset && (
          <p className="text-xs text-muted-foreground/90 bg-slate-50/80 p-3 rounded-lg border border-border/50 leading-relaxed font-light">
            {activePreset.description[locale]}
          </p>
        )}
      </div>

      {/* Sección: Opciones Avanzadas */}
      <div className="space-y-4">
        <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
          {locale === 'es' ? 'Opciones Avanzadas' : 'Advanced Options'}
        </label>
        
        <div className="space-y-3">
          {/* Conservar dimensiones */}
          <div 
            onClick={activeImage && !activeImage.isProcessing ? handleToggleKeepDimensions : undefined}
            className={cn(
              "flex items-center justify-between p-3.5 rounded-xl border border-border bg-white cursor-pointer select-none transition-all hover:border-muted-foreground/35",
              (!activeImage || activeImage.isProcessing) && "opacity-40 cursor-not-allowed"
            )}
          >
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-foreground block">
                {locale === 'es' ? 'Mantener dimensiones' : 'Keep dimensions'}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground/80 block leading-normal">
                {locale === 'es' ? 'No reduce el tamaño en píxeles' : 'Do not resize width and height'}
              </span>
            </div>
            <input 
              type="checkbox" 
              checked={activeImage ? activeImage.keepDimensions : true}
              onChange={() => {}}
              disabled={!activeImage || activeImage.isProcessing}
              className="accent-[#a855f7] size-4 rounded cursor-pointer"
            />
          </div>

          {/* Formato WebP */}
          <div 
            onClick={activeImage && !activeImage.isProcessing ? handleToggleWebpFormat : undefined}
            className={cn(
              "flex items-center justify-between p-3.5 rounded-xl border border-border bg-white cursor-pointer select-none transition-all hover:border-muted-foreground/35",
              (!activeImage || activeImage.isProcessing) && "opacity-40 cursor-not-allowed"
            )}
          >
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-foreground block">
                {locale === 'es' ? 'Forzar formato WebP' : 'Force WebP format'}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground/80 block leading-normal">
                {locale === 'es' ? 'Conversión recomendada por Google' : 'Maximum compression recommended by Google'}
              </span>
            </div>
            <input 
              type="checkbox" 
              checked={activeImage ? activeImage.webpFormat : false}
              onChange={() => {}}
              disabled={!activeImage || activeImage.isProcessing}
              className="accent-[#a855f7] size-4 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>



      {/* Sección: Comparación de Tamaños */}
      {activeImage && activeImage.optimizedSize && (
        <div className="border-t border-border/80 pt-6 space-y-4">
          <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
            {locale === 'es' ? 'Comparativa de Peso' : 'File Size Comparison'}
          </label>

          <div className="bg-slate-50/60 p-4 rounded-xl border border-border/60 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">{locale === 'es' ? 'Tamaño Original:' : 'Original Size:'}</span>
              <span className="font-mono font-medium">{formatSize(activeImage.file.size)}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">{locale === 'es' ? 'Tamaño Optimizado:' : 'Optimized Size:'}</span>
              <span className={cn(
                "font-mono font-bold transition-colors",
                activeImage.optimizedSize > activeImage.file.size ? "text-red-500" : "text-primary"
              )}>
                {formatSize(activeImage.optimizedSize)}
                {activeImage.optimizedSize > activeImage.file.size && " ↑"}
              </span>
            </div>

            {activeImage.optimizedSize > activeImage.file.size && (
              <div className="pt-2 border-t border-border/60 text-[10px] text-red-500 leading-relaxed font-sans">
                {t('opt.warningLargerWebp')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full lg:h-full select-none pb-20 lg:pb-0">
      
      {/* Input de archivos oculto */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        className="hidden" 
        multiple
        accept="image/png, image/jpeg, image/webp, image/gif"
      />

      {/* ─── COLUMNA IZQUIERDA: VISUALIZADOR Y GALERÍA ─── */}
      <div className="flex-1 flex flex-col min-w-0 gap-6 lg:h-full">
        
        {/* Cabecera del Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl md:text-3xl text-primary font-medium tracking-tight">
              {locale === 'es' ? 'Comprimir Imágenes Gratis' : 'Compress Images Free'}
            </h2>
            <p className="text-xs text-muted-foreground leading-normal max-w-xl">
              {locale === 'es' 
                ? 'Optimiza tus imágenes JPG, PNG y WebP al instante. Reduce el peso de tus archivos para acelerar tu web garantizando la privacidad de tus fotos.'
                : 'Optimize your JPG, PNG, and WebP images instantly. Reduce file sizes to speed up your website while guaranteeing complete photo privacy.'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={handleClearAll}
              disabled={images.length === 0 || globalProcessing}
              className="h-9 px-4 rounded-full border border-border hover:bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="size-3.5" />
              <span>{locale === 'es' ? 'Limpiar todo' : 'Clear all'}</span>
            </button>
            <button 
              onClick={handleTriggerUpload}
              disabled={globalProcessing}
              className="h-9 px-4 rounded-full bg-primary hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Upload className="size-3.5" />
              <span>{locale === 'es' ? 'Subir Nueva' : 'Upload New'}</span>
            </button>
          </div>
        </div>

        {/* Visualizador Principal */}
        {processingError ? (
          <div className="flex-1 min-h-[250px] border border-border/80 rounded-2xl flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="corner-decorator corner-tl"></div>
            <div className="corner-decorator corner-tr"></div>
            <div className="corner-decorator corner-bl"></div>
            <div className="corner-decorator corner-br"></div>
            <div className="max-w-md mx-auto flex flex-col items-center gap-4">
              <h3 className="font-serif text-lg font-medium text-red-600">
                {locale === 'es' ? 'Archivo no disponible' : 'File unavailable'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {locale === 'es' 
                  ? 'No se pudo encontrar el archivo original sobre el que se está trabajando.' 
                  : 'Could not find the original file you are working on.'}
              </p>
              <button 
                onClick={(e) => {
                  const idToRemove = processingError.id;
                  setProcessingError(null);
                  handleRemoveImage(e, idToRemove);
                }}
                className="px-6 py-2 bg-red-600 text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-red-700 transition-all cursor-pointer shadow-sm animate-fade-in"
              >
                {locale === 'es' ? 'Eliminar imagen' : 'Remove image'}
              </button>
            </div>
          </div>
        ) : vipsState === 'error' ? (
          <div className="flex-1 min-h-[250px] border border-border/80 rounded-2xl flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="corner-decorator corner-tl"></div>
            <div className="corner-decorator corner-tr"></div>
            <div className="corner-decorator corner-bl"></div>
            <div className="corner-decorator corner-br"></div>
            <div className="max-w-md mx-auto flex flex-col items-center gap-4">
              <h3 className="font-serif text-lg font-medium text-red-600">
                {locale === 'es' ? 'Error de inicialización' : 'Initialization error'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {locale === 'es' 
                  ? 'Ocurrió un error al cargar el motor de compresión de imágenes. Por favor, intenta de nuevo.' 
                  : 'An error occurred while loading the image compression engine. Please try again.'}
              </p>
              <button 
                onClick={() => {
                  if (workerRef.current) {
                    workerRef.current.terminate();
                    workerRef.current = null;
                  }
                  setVipsState('loading');
                  initializeWorker();
                }}
                className="px-6 py-2 bg-primary text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-neutral-800 transition-all cursor-pointer shadow-sm"
              >
                {locale === 'es' ? 'Reintentar' : 'Retry'}
              </button>
            </div>
          </div>
        ) : vipsState === 'loading' || (vipsState === 'loaded' && isImagesLoading) ? (
          <div className="flex-1 min-h-[250px] border border-border/80 rounded-2xl flex flex-col items-center justify-center p-4 md:p-8 text-center relative overflow-hidden bg-slate-50/40">
            <div className="corner-decorator corner-tl"></div>
            <div className="corner-decorator corner-tr"></div>
            <div className="corner-decorator corner-bl"></div>
            <div className="corner-decorator corner-br"></div>
            <LoaderPrime 
              message={
                vipsState === 'loading' 
                  ? isFirstLoadRef.current
                    ? (locale === 'es' ? 'Cargando la herramienta por primera vez...' : 'Loading the tool for the first time...')
                    : (locale === 'es' ? 'Iniciando motor de compresión...' : 'Starting compression engine...')
                  : uploadCount > 1
                    ? (locale === 'es' ? 'Cargando las imágenes...' : 'Loading images...')
                    : (locale === 'es' ? 'Cargando imagen...' : 'Loading image...')
              } 
            />
          </div>
        ) : !activeImage ? (
          <div 
            onClick={handleTriggerUpload}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex-1 min-h-[250px] dropzone-grid border border-border/80 rounded-2xl flex items-center justify-center p-4 md:p-8 text-center relative overflow-hidden transition-colors group cursor-pointer"
          >
            <div className="corner-decorator corner-tl"></div>
            <div className="corner-decorator corner-tr"></div>
            <div className="corner-decorator corner-bl"></div>
            <div className="corner-decorator corner-br"></div>
 
            <div className="flex flex-col items-center gap-4 max-w-sm z-10 bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-border/40 shadow-sm transition-all group-hover:shadow-md">
              <div className="size-14 rounded-full bg-white flex items-center justify-center border border-border/85 shadow-sm text-muted-foreground">
                <Minimize2 className="size-6 text-primary" />
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-primary">
                    {locale === 'es' ? 'Arrastra tus imágenes aquí o haz clic' : 'Drag your images here or click'}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    {locale === 'es' 
                      ? 'Procesamiento 100% local en tu navegador. Máximo 20MB por archivo.'
                      : '100% local processing in your browser. Maximum 20MB per file.'}
                  </p>
                </div>
                
                {/* Formatos soportados */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  {['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF'].map((fmt) => (
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
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex-1 min-h-[250px] dropzone-grid border border-border/80 rounded-2xl flex items-center justify-center p-8 relative overflow-hidden transition-colors group"
          >
            {/* Esquinas visor fotográfico */}
            <div className="corner-decorator corner-tl"></div>
            <div className="corner-decorator corner-tr"></div>
            <div className="corner-decorator corner-bl"></div>
            <div className="corner-decorator corner-br"></div>

            {/* Imagen en visualización estática */}
            <div className="w-full h-full flex items-center justify-center relative z-10 max-h-[50vh] md:max-h-full">
              {activeImage.isProcessing ? (
                <LoaderPrime message={locale === 'es' ? 'Optimizando imagen...' : 'Optimizing image...'} />
              ) : (
                <img 
                  src={activeImage.previewUrl} 
                  alt={activeImage.file.name}
                  className="max-w-full max-h-full object-contain rounded shadow-md"
                />
              )}
            </div>
          </div>
        )}

        {/* Galería de miniaturas */}
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
                  onClick={() => {
                    if (!globalProcessing) {
                      setActiveIndex(idx);
                    }
                  }}
                  className={cn(
                    "relative size-16 rounded-xl border overflow-hidden flex-shrink-0 transition-all shadow-sm hover:scale-105",
                    idx === activeIndex ? "border-[#a855f7] ring-2 ring-purple-500/20" : "border-border hover:border-muted-foreground/45",
                    globalProcessing ? "opacity-60 cursor-not-allowed pointer-events-none" : "cursor-pointer"
                  )}
                >
                  <img 
                    src={img.previewUrl} 
                    alt="Thumbnail" 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={(e) => handleRemoveImage(e, img.id)}
                    disabled={globalProcessing}
                    className="absolute -top-1 -right-1 size-5 bg-black/60 hover:bg-black rounded-full flex items-center justify-center text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title={locale === 'es' ? 'Quitar' : 'Remove'}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ENLACES / INFORMACIÓN DE PIE DE PÁGINA ASIMÉTRICOS CON SEPARADOR Y GLOW */}
        <div className="flex flex-col md:flex-row items-center gap-4 select-none w-full">
          {/* Tarjeta 1: Editorial Limpia con Elevación y Brillo Sutil */}
          <div className="flex-1 w-full bg-slate-50/60 hover:bg-slate-50/80 border border-border/80 hover:border-[#a855f7]/30 p-5 rounded-2xl transition-all cursor-pointer group flex justify-between items-center relative overflow-hidden hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)] hover:-translate-y-0.5 active:translate-y-0 duration-300">
            {/* Destello de gradiente morado en hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/[0.005] to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 bg-[#a855f7]/[0.02] rounded-full pointer-events-none"></div>

            <div className="space-y-1 z-10">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <HelpCircle className="size-3 text-muted-foreground/80" />
                {locale === 'es' ? 'Guía del usuario' : 'User guide'}
              </span>
              <p className="text-sm font-serif text-primary font-medium">
                {locale === 'es' ? '¿Cómo funciona la compresión sin pérdida?' : 'How does lossless compression work?'}
              </p>
            </div>
            <span className="text-primary group-hover:translate-x-1.5 transition-transform duration-300 font-bold z-10">→</span>
          </div>

          {/* Separador vertical decorativo | en desktop */}
          <div className="hidden md:flex items-center justify-center text-border/60 text-lg font-light font-sans px-1 pointer-events-none self-center">
            |
          </div>

          {/* Tarjeta 2: Destacada con Glow de color morado y Badge */}
          <div 
            onClick={() => {
              if (!globalProcessing) {
                window.location.href = locale === 'es' ? '/es/herramientas/recortar-imagen/' : '/tools/crop-image/';
              }
            }}
            className="flex-1 w-full bg-slate-50/60 hover:bg-slate-50/80 border border-border/80 hover:border-[#a855f7]/30 p-5 rounded-2xl transition-all cursor-pointer group flex justify-between items-center relative overflow-hidden hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)] hover:-translate-y-0.5 active:translate-y-0 duration-300"
          >
            {/* Destello de gradiente morado en hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/[0.005] to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 bg-[#a855f7]/[0.02] rounded-full pointer-events-none"></div>
            
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-white bg-[#a855f7] px-1.5 py-0.5 rounded-md">
                  {locale === 'es' ? 'Recomendado' : 'Featured'}
                </span>
              </div>
              <p className="text-sm font-serif text-primary font-medium">
                {locale === 'es' ? 'Recortar fotos para redes sociales' : 'Crop images for social media'}
              </p>
            </div>
            <span className="text-primary group-hover:translate-x-1.5 transition-transform duration-300 font-bold z-10">→</span>
          </div>
        </div>

      </div>

      {/* ─── COLUMNA DERECHA: SIDEBAR DE AJUSTES ─── */}
      <div className="hidden lg:flex w-full lg:w-80 shrink-0 bg-white border border-border rounded-2xl flex-col lg:h-full overflow-hidden shadow-sm">
        <div className="p-6 flex-1 flex flex-col overflow-y-auto">
          <h3 className="font-serif text-lg font-medium text-primary border-b border-border/80 pb-4 mb-6">
            {locale === 'es' ? 'Ajustes de Compresión' : 'Compression Settings'}
          </h3>
          {renderControls()}
        </div>

        <div className="p-6 border-t border-border/80 bg-slate-50/60 backdrop-blur-sm">
          <button 
            onClick={handleDownload}
            disabled={images.length === 0 || globalProcessing}
            className="w-full py-3 px-4 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white font-semibold text-xs uppercase tracking-[0.15em] transition-all shadow-sm active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="size-4" />
            <span>
              {globalProcessing 
                ? (locale === 'es' ? 'PROCESANDO...' : 'PROCESSING...') 
                : images.length > 1
                  ? 'DESCARGAR (.zip)'
                  : 'DESCARGAR'}
            </span>
          </button>
        </div>
      </div>

      {/* ─── STICKY BOTTOM BAR MÓVIL ─── */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-border/80 flex items-center justify-between px-6 z-40 lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.04)] select-none">
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

        <div className="h-8 w-[1px] bg-border/60 pointer-events-none mx-2"></div>

        <button
          onClick={handleDownload}
          disabled={images.length === 0 || globalProcessing}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-sm active:scale-98"
        >
          <Download className="size-4" />
          <span>
            {globalProcessing 
              ? (locale === 'es' ? 'PROCESANDO...' : 'PROCESSING...') 
              : images.length > 1
                ? 'DESCARGAR (.zip)'
                : 'DESCARGAR'}
          </span>
        </button>
      </div>

      {/* Drawer Móvil */}
      <Sheet open={isMobileControlsOpen} onOpenChange={setIsMobileControlsOpen}>
        <SheetContent 
          side="bottom" 
          className="p-0 bg-white rounded-t-3xl border-t border-border max-h-[80vh] overflow-y-auto flex flex-col z-50"
          showCloseButton={true}
        >
          <div className="p-6 pb-20">
            <h3 className="font-serif text-lg font-medium text-primary border-b border-border/80 pb-4 mb-6">
              {locale === 'es' ? 'Ajustes de Compresión' : 'Compression Settings'}
            </h3>
            {renderControls()}
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
};
