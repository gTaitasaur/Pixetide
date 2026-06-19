import React, { useState, useEffect, useRef } from 'react';
import { useLocale } from '../../core/i18n/useLocale';
import './RotateFlipModule.css';
import { 
  RotateCcw, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Trash2, 
  Upload, 
  Download, 
  HelpCircle, 
  Image as ImageIcon,
  Sliders,
  X
} from 'lucide-react';
import { validateImageFile } from '../../shared/utils/fileUpload';
import { useToast } from '../../shared/components/Errors/ToastContext';
import { Sheet, SheetContent } from '../../shared/components/ui/sheet';
import { cn } from '../../shared/utils/cn';
import LoaderPrime from '../../shared/components/UI/Loader/LoaderPrime';
// @ts-expect-error - Vite Web Worker import syntax
import VipsWorker from './vips.worker?worker';
import JSZip from 'jszip';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  rotation: number;         // 0, 90, 180, 270
  fineRotation: number;     // -180 a 180
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export const RotateFlipModule: React.FC = () => {
  const { locale } = useLocale();
  const { showToast } = useToast();
  
  // Lote de imágenes
  const [images, setImages] = useState<ImageItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados de carga de wasm-vips e imágenes
  const [vipsState, setVipsState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [isImagesLoading, setIsImagesLoading] = useState<boolean>(false);
  const [uploadCount, setUploadCount] = useState<number>(0);
  const [processingError, setProcessingError] = useState<{ id: string; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const isFirstLoadRef = useRef<boolean>(true);

  // Liberar previews ObjectURL al desmontar para evitar fugas de memoria (OWASP / Performance)
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  const activeImage = activeIndex >= 0 && activeIndex < images.length ? images[activeIndex] : null;

  // Limpieza del Worker al desmontar el componente (OWASP / Fugas de memoria)
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const initializeWorker = () => {
    if (workerRef.current) return;

    let hasLoadedBefore = false;
    try {
      hasLoadedBefore = localStorage.getItem('pixetide_vips_loaded') === 'true';
    } catch (err) {
      console.warn('LocalStorage unavailable', err);
    }

    const startTime = Date.now();
    try {
      const worker = new VipsWorker() as Worker;
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
        const { type, message } = e.data;

        if (type === 'initialized') {
          const elapsed = Date.now() - startTime;
          const minDelay = hasLoadedBefore ? 1000 : 2000;
          const remaining = Math.max(0, minDelay - elapsed);
          
          // Retardo mínimo (2s para primera descarga, 1000ms para recargas usando cache)
          setTimeout(() => {
            setVipsState('loaded');
            try {
              localStorage.setItem('pixetide_vips_loaded', 'true');
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

  // Manejadores de entrada de archivos asíncronos para permitir renderizado del loader
  const handleFiles = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;

    setUploadCount(filesList.length);
    setIsImagesLoading(true);

    if (vipsState === 'idle') {
      let hasLoadedBefore = false;
      try {
        hasLoadedBefore = localStorage.getItem('pixetide_vips_loaded') === 'true';
      } catch (err) {
        console.warn('LocalStorage unavailable', err);
      }
      isFirstLoadRef.current = !hasLoadedBefore;
      setVipsState('loading');
      initializeWorker();
    }

    // Retardo artificial mínimo de 300ms para permitir pintar la UI del loader
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const newItems: ImageItem[] = [];
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
            : `The file "${file.name}" could not be loaded because it does not have the correct format.`,
          'error'
        );
        continue;
      }

      const validation = validateImageFile(file);
      
      if (!validation.isValid) {
        showToast(validation.error || 'Archivo inválido', 'error');
        continue;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);
      
      newItems.push({
        id,
        file,
        previewUrl,
        rotation: 0,
        fineRotation: 0,
        flipHorizontal: false,
        flipVertical: false
      });
    }

    if (newItems.length > 0) {
      setImages(prev => {
        const updated = [...prev, ...newItems];
        // Si no había imagen activa, activar la primera del lote recién cargado
        if (activeIndex === -1) {
          setActiveIndex(prev.length);
        }
        return updated;
      });
      showToast(
        locale === 'es' 
          ? `Cargadas ${newItems.length} imágenes correctamente.` 
          : `Successfully loaded ${newItems.length} images.`,
        'success'
      );
    }

    setIsImagesLoading(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = ''; // Resetear input
  };

  // Eventos de Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Modificación de transformaciones en la imagen activa
  const updateActiveTransform = (updater: (img: ImageItem) => Partial<ImageItem>) => {
    if (activeIndex === -1) return;
    setImages(prev => prev.map((img, idx) => {
      if (idx === activeIndex) {
        return { ...img, ...updater(img) };
      }
      return img;
    }));
  };

  const handleRotateClick = (direction: number) => {
    updateActiveTransform(img => {
      const nextRotation = (img.rotation + direction + 360) % 360;
      return { rotation: nextRotation };
    });
  };

  const handleFlipHorizontal = () => {
    updateActiveTransform(img => ({ flipHorizontal: !img.flipHorizontal }));
  };

  const handleFlipVertical = () => {
    updateActiveTransform(img => ({ flipVertical: !img.flipVertical }));
  };

  const handleFineRotationChange = (val: number) => {
    updateActiveTransform(() => ({ fineRotation: val }));
  };

  const handleClearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setActiveIndex(-1);
    showToast(locale === 'es' ? 'Se limpiaron todas las imágenes.' : 'All images cleared.', 'success');
  };

  const handleRemoveImage = (e: React.MouseEvent, idToRemove: string) => {
    e.stopPropagation();
    const idxToRemove = images.findIndex(img => img.id === idToRemove);
    if (idxToRemove === -1) return;

    URL.revokeObjectURL(images[idxToRemove].previewUrl);
    
    setImages(prev => {
      const updated = prev.filter(img => img.id !== idToRemove);
      
      // Ajustar el activeIndex
      if (updated.length === 0) {
        setActiveIndex(-1);
      } else if (activeIndex === idxToRemove) {
        // Seleccionar la anterior o la primera disponible
        setActiveIndex(Math.max(0, idxToRemove - 1));
      } else if (activeIndex > idxToRemove) {
        setActiveIndex(activeIndex - 1);
      }
      return updated;
    });
  };

  // Procesamiento pesado con wasm-vips en el Web Worker sin bloquear la interfaz
  const processImageWithWorker = (item: ImageItem): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const processId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      const handleWorkerMessage = (e: MessageEvent) => {
        const { type, id: responseId, blob, message, code } = e.data;
        if (responseId === processId) {
          workerRef.current?.removeEventListener('message', handleWorkerMessage);
          if (type === 'result') {
            resolve(blob);
          } else if (type === 'process_error') {
            const error = new Error(message || 'Error processing image') as Error & { code?: string };
            error.code = code;
            reject(error);
          }
        }
      };

      workerRef.current.addEventListener('message', handleWorkerMessage);
      
      try {
        workerRef.current.postMessage({
          action: 'process',
          id: processId,
          file: item.file,
          angle: item.rotation,
          fineAngle: item.fineRotation,
          flipH: item.flipHorizontal,
          flipV: item.flipVertical
        });
      } catch (postErr) {
        workerRef.current.removeEventListener('message', handleWorkerMessage);
        const error = (postErr instanceof Error ? postErr : new Error(String(postErr))) as Error & { code?: string };
        error.code = 'FILE_NOT_FOUND';
        reject(error);
      }
    });
  };

  const handleDownload = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    setProcessingError(null);
    try {
      if (images.length === 1) {
        const item = images[0];
        const blob = await processImageWithWorker(item);
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        const fileName = `Girar_Pixetide_com_${item.file.name}`;
        
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        // Limpieza
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast(
          locale === 'es' ? 'Imagen descargada correctamente.' : 'Image downloaded successfully.', 
          'success'
        );
      } else {
        const zip = new JSZip();
        
        // Procesar imágenes de forma secuencial para evitar picos de memoria
        for (let i = 0; i < images.length; i++) {
          const item = images[i];
          try {
            const blob = await processImageWithWorker(item);
            const fileName = `Girar_Pixetide_com_${item.file.name}`;
            zip.file(fileName, blob);
          } catch (itemErr) {
            const error = (itemErr instanceof Error ? itemErr : new Error(String(itemErr))) as Error & { code?: string; itemId?: string };
            error.itemId = item.id;
            throw error;
          }
        }
        
        const zipContent = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipContent);
        
        const firstBaseName = images[0].file.name.substring(0, images[0].file.name.lastIndexOf('.')) || 'imagenes';
        const zipName = `Girar_Pixetide_com_${firstBaseName}.zip`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = zipName;
        document.body.appendChild(a);
        a.click();
        
        // Limpieza
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast(
          locale === 'es' 
            ? `Descargadas ${images.length} imágenes en archivo ZIP.` 
            : `Successfully downloaded ${images.length} images in a ZIP file.`,
          'success'
        );
      }
    } catch (err) {
      const error = err as Error & { code?: string; itemId?: string };
      if (error.code === 'FILE_NOT_FOUND') {
        const id = error.itemId || (images.length === 1 ? images[0].id : null);
        if (id) {
          setProcessingError({
            id,
            message: error.message || 'No se pudo encontrar el archivo original sobre el que se está trabajando.'
          });
        } else {
          showToast(
            locale === 'es' 
              ? 'No se pudo encontrar el archivo original de una de las imágenes.' 
              : 'Could not find the original file for one of the images.',
            'error'
          );
        }
      } else {
        showToast(
          locale === 'es' ? 'Ocurrió un error desconocido. Por favor, intenta de nuevo.' : 'An unknown error occurred. Please try again.',
          'error'
        );
      }
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Prepara los estilos de transformación en vivo de CSS para previsualizar
  const getPreviewTransformStyle = (item: ImageItem) => {
    const totalAngle = item.rotation + item.fineRotation;
    const scaleX = item.flipHorizontal ? -1 : 1;
    const scaleY = item.flipVertical ? -1 : 1;
    return `rotate(${totalAngle}deg) scaleX(${scaleX}) scaleY(${scaleY})`;
  };

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

      {/* ─── COLUMNA IZQUIERDA: ESPACIO DE TRABAJO ─── */}
      <div className="flex-1 flex flex-col min-w-0 gap-6 lg:h-full">
        
        {/* Header de la Herramienta */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl md:text-3xl text-primary font-medium tracking-tight">
              {locale === 'es' ? 'Girar y Voltear Imagen' : 'Rotate & Flip Image'}
            </h2>
            <p className="text-xs text-muted-foreground leading-normal max-w-xl">
              {locale === 'es' 
                ? 'Rota tus fotos en cualquier ángulo o aplica un efecto espejo horizontal/vertical de forma local.'
                : 'Rotate your photos to any angle or apply a horizontal/vertical mirror flip locally.'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={handleClearAll}
              disabled={images.length === 0}
              className="h-9 px-4 rounded-full border border-border hover:bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="size-3.5" />
              <span>{locale === 'es' ? 'Limpiar todo' : 'Clear all'}</span>
            </button>
            <button 
              onClick={handleTriggerUpload}
              className="h-9 px-4 rounded-full bg-primary hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="size-3.5" />
              <span>{locale === 'es' ? 'Subir Nueva' : 'Upload New'}</span>
            </button>
          </div>
        </div>

        {/* IMAGE AREA (Contenedor de previsualización) */}
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
                className="px-6 py-2 bg-red-600 text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-red-700 transition-all cursor-pointer shadow-sm"
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
                {locale === 'es' ? 'Error desconocido' : 'Unknown error'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {locale === 'es' 
                  ? 'Ocurrió un error desconocido. Por favor, intenta de nuevo.' 
                  : 'An unknown error occurred. Please try again.'}
              </p>
              <button 
                onClick={() => {
                  if (workerRef.current) {
                    workerRef.current.terminate();
                    workerRef.current = null;
                  }
                  let hasLoadedBefore = false;
                  try {
                    hasLoadedBefore = localStorage.getItem('pixetide_vips_loaded') === 'true';
                  } catch (err) {
                    console.warn(err);
                  }
                  isFirstLoadRef.current = !hasLoadedBefore;
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
          <div className="flex-1 min-h-[250px] border border-border/80 rounded-2xl flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-slate-50/40">
            <div className="corner-decorator corner-tl"></div>
            <div className="corner-decorator corner-tr"></div>
            <div className="corner-decorator corner-bl"></div>
            <div className="corner-decorator corner-br"></div>
            <LoaderPrime 
              message={
                vipsState === 'loading' 
                  ? isFirstLoadRef.current
                    ? (locale === 'es' ? 'Cargando la herramienta por primera vez...' : 'Loading the tool for the first time...')
                    : (locale === 'es' ? 'Iniciando motor de procesamiento...' : 'Starting processing engine...')
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
            className="flex-1 min-h-[250px] dropzone-grid border border-border/80 rounded-2xl flex items-center justify-center p-8 text-center relative overflow-hidden transition-colors group cursor-pointer"
          >
            {/* Esquinas estilo visor fotográfico */}
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

            {/* Imagen en visualización con transformación CSS en vivo */}
            <div className="w-full h-full flex items-center justify-center relative z-10 max-h-[50vh] md:max-h-full">
              <img 
                src={activeImage.previewUrl} 
                alt={activeImage.file.name}
                className="max-w-full max-h-full object-contain rounded shadow-md transition-transform duration-200 ease-out origin-center"
                style={{ transform: getPreviewTransformStyle(activeImage) }}
              />
            </div>
          </div>
        )}

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
                    style={{ transform: getPreviewTransformStyle(img) }}
                  />
                  {/* Botón de borrar miniatura */}
                  <button 
                    onClick={(e) => handleRemoveImage(e, img.id)}
                    className="absolute -top-1 -right-1 size-5 bg-black/60 hover:bg-black rounded-full flex items-center justify-center text-white transition-colors cursor-pointer"
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
                {locale === 'es' ? '¿Cómo funciona la rotación sin pérdida de calidad?' : 'How does lossless rotation work?'}
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
            onClick={() => window.location.href = locale === 'es' ? '/es/' : '/'}
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
                {locale === 'es' ? 'Recortar imágenes para redes sociales' : 'Crop images for social media'}
              </p>
            </div>
            <span className="text-primary group-hover:translate-x-1.5 transition-transform duration-300 font-bold z-10">→</span>
          </div>
        </div>

      </div>

      {/* ─── COLUMNA DERECHA: SIDEBAR DE CONTROLES (DESKTOP) ─── */}
      <div className="hidden lg:flex w-full lg:w-80 shrink-0 bg-white border border-border rounded-2xl flex-col lg:h-full overflow-hidden shadow-sm">
        
        {/* Panel de Controles de Edición */}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="font-serif text-lg font-medium text-primary border-b border-border/80 pb-4 mb-6">
            {locale === 'es' ? 'Controles de Edición' : 'Edit Controls'}
          </h3>
          
          <div className="space-y-8 flex-1">
            {/* Sección: Rotación Rápida */}
            <div className="space-y-3.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                {locale === 'es' ? 'Rotación Rápida' : 'Quick Rotation'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleRotateClick(-90)}
                  disabled={images.length === 0}
                  className="h-10 border border-border rounded-xl hover:bg-slate-50 text-xs font-semibold text-primary transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="size-3.5" />
                  <span>-90°</span>
                </button>
                <button 
                  onClick={() => handleRotateClick(90)}
                  disabled={images.length === 0}
                  className="h-10 border border-border rounded-xl hover:bg-slate-50 text-xs font-semibold text-primary transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCw className="size-3.5" />
                  <span>+90°</span>
                </button>
              </div>
            </div>

            {/* Sección: Voltear Imagen */}
            <div className="space-y-3.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                {locale === 'es' ? 'Voltear Imagen' : 'Flip Image'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleFlipHorizontal}
                  disabled={images.length === 0}
                  className={cn(
                    "h-10 border rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed",
                    activeImage?.flipHorizontal ? "border-[#a855f7] bg-purple-50/40 text-[#a855f7]" : "border-border hover:bg-slate-50 text-primary"
                  )}
                >
                  <FlipHorizontal className="size-3.5" />
                  <span>Horizontal</span>
                </button>
                <button 
                  onClick={handleFlipVertical}
                  disabled={images.length === 0}
                  className={cn(
                    "h-10 border rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed",
                    activeImage?.flipVertical ? "border-[#a855f7] bg-purple-50/40 text-[#a855f7]" : "border-border hover:bg-slate-50 text-primary"
                  )}
                >
                  <FlipVertical className="size-3.5" />
                  <span>Vertical</span>
                </button>
              </div>
            </div>

            {/* Sección: Ajuste Fino */}
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                  {locale === 'es' ? 'Ajuste Fino' : 'Fine Tuning'}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-primary bg-slate-100 px-2 py-0.5 rounded-md">
                    {(activeImage?.fineRotation) || 0}°
                  </span>
                  <button 
                    onClick={() => handleFineRotationChange(0)}
                    disabled={images.length === 0}
                    className="text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer underline decoration-dotted animate-fade-in disabled:opacity-40 disabled:cursor-not-allowed"
                    title={locale === 'es' ? 'Restablecer' : 'Reset'}
                  >
                    {locale === 'es' ? 'Restablecer' : 'Reset'}
                  </button>
                </div>
              </div>

              {/* Slider lineal */}
              <div className="space-y-2">
                <input 
                  type="range" 
                  min="-180" 
                  max="180" 
                  value={(activeImage?.fineRotation) || 0}
                  disabled={images.length === 0}
                  onChange={(e) => handleFineRotationChange(Number(e.target.value))}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary border border-border/80 disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-[9px] font-mono text-muted-foreground/60 px-0.5">
                  <span>-180°</span>
                  <span>0°</span>
                  <span>180°</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Sección de Descarga Inferior (Estilo Pixetide Premium) */}
        <div className="p-6 border-t border-border/80 bg-slate-50/60 backdrop-blur-sm">
          <button 
            onClick={handleDownload}
            disabled={images.length === 0 || isProcessing}
            className="w-full py-3 px-4 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white font-semibold text-xs uppercase tracking-[0.15em] transition-all shadow-sm active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="size-4" />
            <span>
              {isProcessing 
                ? (locale === 'es' ? 'PROCESANDO...' : 'PROCESSING...') 
                : images.length > 1
                  ? 'DESCARGAR (.zip)'
                  : 'DESCARGAR'}
            </span>
          </button>
        </div>

      </div>

      {/* ─── STICKY BOTTOM BAR MÓVIL (Fusión Opción A y B) ─── */}
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
          <span>{locale === 'es' ? 'Ajustes' : 'Ajustes'}</span>
        </button>

        {/* Separador vertical interno */}
        <div className="h-8 w-[1px] bg-border/60 pointer-events-none mx-2"></div>

        {/* Tab 2: Botón Descargar (Acción Directa) */}
        <button
          onClick={handleDownload}
          disabled={images.length === 0 || isProcessing}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-sm active:scale-98"
        >
          <Download className="size-4" />
          <span>
            {isProcessing 
              ? (locale === 'es' ? 'PROCESANDO...' : 'PROCESSING...') 
              : images.length > 1
                ? 'DESCARGAR (.zip)'
                : 'DESCARGAR'}
          </span>
        </button>
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
              {locale === 'es' ? 'Controles de Edición' : 'Edit Controls'}
            </h3>
            
            <div className="space-y-8">
              {/* Sección: Rotación Rápida */}
              <div className="space-y-3.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                  {locale === 'es' ? 'Rotación Rápida' : 'Quick Rotation'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleRotateClick(-90)}
                    disabled={images.length === 0}
                    className="h-10 border border-border rounded-xl hover:bg-slate-50 text-xs font-semibold text-primary transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>-90°</span>
                  </button>
                  <button 
                    onClick={() => handleRotateClick(90)}
                    disabled={images.length === 0}
                    className="h-10 border border-border rounded-xl hover:bg-slate-50 text-xs font-semibold text-primary transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RotateCw className="size-3.5" />
                    <span>+90°</span>
                  </button>
                </div>
              </div>

              {/* Sección: Voltear Imagen */}
              <div className="space-y-3.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                  {locale === 'es' ? 'Voltear Imagen' : 'Flip Image'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleFlipHorizontal}
                    disabled={images.length === 0}
                    className={cn(
                      "h-10 border rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed",
                      activeImage?.flipHorizontal ? "border-[#a855f7] bg-purple-50/40 text-[#a855f7]" : "border-border hover:bg-slate-50 text-primary"
                    )}
                  >
                    <FlipHorizontal className="size-3.5" />
                    <span>Horizontal</span>
                  </button>
                  <button 
                    onClick={handleFlipVertical}
                    disabled={images.length === 0}
                    className={cn(
                      "h-10 border rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed",
                      activeImage?.flipVertical ? "border-[#a855f7] bg-purple-50/40 text-[#a855f7]" : "border-border hover:bg-slate-50 text-primary"
                    )}
                  >
                    <FlipVertical className="size-3.5" />
                    <span>Vertical</span>
                  </button>
                </div>
              </div>

              {/* Sección: Ajuste Fino */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                    {locale === 'es' ? 'Ajuste Fino' : 'Fine Tuning'}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-primary bg-slate-100 px-2 py-0.5 rounded-md">
                      {(activeImage?.fineRotation) || 0}°
                    </span>
                    <button 
                      onClick={() => handleFineRotationChange(0)}
                      disabled={images.length === 0}
                      className="text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer underline decoration-dotted disabled:opacity-40 disabled:cursor-not-allowed"
                      title={locale === 'es' ? 'Restablecer' : 'Reset'}
                    >
                      {locale === 'es' ? 'Restablecer' : 'Reset'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <input 
                    type="range" 
                    min="-180" 
                    max="180" 
                    value={(activeImage?.fineRotation) || 0}
                    disabled={images.length === 0}
                    onChange={(e) => handleFineRotationChange(Number(e.target.value))}
                    className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary border border-border/80 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-muted-foreground/60 px-0.5">
                    <span>-180°</span>
                    <span>0°</span>
                    <span>180°</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
};
