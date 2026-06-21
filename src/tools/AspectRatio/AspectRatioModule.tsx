import React, { useState, useEffect, useRef } from 'react';
import { useLocale } from '../../core/i18n/useLocale';
import './AspectRatioModule.css';
import ReactCrop, { centerCrop, makeAspectCrop, Crop as ReactCropType } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { 
  Crop as CropIcon, 
  Trash2, 
  Upload, 
  Download, 
  HelpCircle, 
  Sliders,
  X,
  Square,
  Smartphone,
  Tv,
  Monitor,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Hand
} from 'lucide-react';
import { ASPECT_RATIO_PRESETS, CropImageItem } from './aspectRatio';
import { validateImageFile } from '../../shared/utils/fileUpload';
import { useToast } from '../../shared/components/Errors/ToastContext';
import { Sheet, SheetContent } from '../../shared/components/ui/sheet';
import { cn } from '../../shared/utils/cn';
import LoaderPrime from '../../shared/components/UI/Loader/LoaderPrime';
// @ts-expect-error - Vite Web Worker import syntax
import CropWorker from './crop.worker?worker';
import JSZip from 'jszip';

export const AspectRatioModule: React.FC = () => {
  const { locale } = useLocale();
  const { showToast } = useToast();
  
  // Galería de imágenes cargadas en memoria
  const [images, setImages] = useState<CropImageItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  const [isImagesLoading, setIsImagesLoading] = useState<boolean>(false);
  const [uploadCount, setUploadCount] = useState<number>(0);
  const [vipsState, setVipsState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<{ id: string; message: string } | null>(null);

  const isFirstLoadRef = useRef<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Liberar previews ObjectURL al desmontar para evitar fugas de memoria (OWASP / Performance)
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  // Limpieza del Worker al desmontar el componente (OWASP / Fugas de memoria)
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const [zoom, setZoom] = useState<number>(1);
  const [isPanMode, setIsPanMode] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const isDraggingRef = useRef<boolean>(false);
  const startPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const prevActiveIdRef = useRef<string | null>(null);

  // Refs auxiliares para evitar warnings de dependencias de ESLint
  const zoomRef = useRef<number>(1);
  const positionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  zoomRef.current = zoom;
  positionRef.current = position;

  const activeImage = activeIndex >= 0 && activeIndex < images.length ? images[activeIndex] : null;
  const isVertical = !!(activeImage && activeImage.naturalHeight > 0 && activeImage.naturalHeight > activeImage.naturalWidth);

  // Sincronizar y persistir el zoom y posición de la imagen activa en la galería
  useEffect(() => {
    const prevId = prevActiveIdRef.current;
    const activeImageId = activeImage?.id || null;

    // 1. Guardar el estado de la imagen activa anterior si cambió y es diferente
    if (prevId && prevId !== activeImageId) {
      const currentZoom = zoomRef.current;
      const currentPos = positionRef.current;
      setImages(prev => prev.map(img => {
        if (img.id === prevId) {
          return {
            ...img,
            zoom: currentZoom,
            position: currentPos
          };
        }
        return img;
      }));
    }

    // 2. Cargar el estado de la nueva imagen activa
    if (activeImage) {
      setZoom(activeImage.zoom !== undefined ? activeImage.zoom : 1);
      setPosition(activeImage.position !== undefined ? activeImage.position : { x: 0, y: 0 });
    } else {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }

    setIsPanMode(false);
    prevActiveIdRef.current = activeImageId;
  }, [activeIndex]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.05, 3.0));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.05, 0.05));
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIsPanMode(false);
  };

  const handlePointerDownCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanMode) return;
    
    // Si es un tirador de arrastre del crop, dejar que ReactCrop lo maneje
    const target = e.target as HTMLElement;
    if (target.closest('.ReactCrop__drag-handle')) {
      return;
    }
    
    // De lo contrario, interceptamos el evento para mover la imagen y evitamos que ReactCrop lo reciba
    e.stopPropagation();
    
    isDraggingRef.current = true;
    startPointerRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { ...position };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startPointerRef.current.x;
    const dy = e.clientY - startPointerRef.current.y;
    setPosition({
      x: startPosRef.current.x + dx,
      y: startPosRef.current.y + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!activeImage) return;
    // Evitamos el scroll de la página
    e.preventDefault();
    
    // Mover la imagen verticalmente
    const scrollSpeed = 1.0;
    setPosition(prev => ({
      x: prev.x,
      y: prev.y - e.deltaY * scrollSpeed
    }));
  };

  const initializeWorker = () => {
    if (workerRef.current) return;

    let hasLoadedBefore = false;
    try {
      hasLoadedBefore = localStorage.getItem('pixetide_crop_loaded') === 'true';
    } catch (err) {
      console.warn('LocalStorage unavailable', err);
    }

    const startTime = Date.now();
    try {
      const worker = new CropWorker() as Worker;
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
          
          setTimeout(() => {
            setVipsState('loaded');
            try {
              localStorage.setItem('pixetide_crop_loaded', 'true');
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
        hasLoadedBefore = localStorage.getItem('pixetide_crop_loaded') === 'true';
      } catch (err) {
        console.warn('LocalStorage unavailable', err);
      }
      isFirstLoadRef.current = !hasLoadedBefore;
      setVipsState('loading');
      initializeWorker();
    }

    // Retardo artificial mínimo de 300ms para permitir pintar la UI del loader
    await new Promise((resolve) => setTimeout(resolve, 300));

    const validImages: CropImageItem[] = [];
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
      validImages.push({
        id,
        file,
        previewUrl,
        selectedPreset: 'free',
        crop: {
          unit: '%',
          x: 10,
          y: 10,
          width: 80,
          height: 80
        },
        naturalWidth: 0,
        naturalHeight: 0,
        zoom: 1,
        position: { x: 0, y: 0 }
      });
    }

    if (validImages.length > 0) {
      setImages(prev => {
        const next = [...prev, ...validImages];
        if (prev.length === 0) {
          setActiveIndex(0);
        }
        return next;
      });
    }

    // Retardo estético de carga de imágenes
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

  const getInitialCrop = (
    width: number,
    height: number,
    presetId: string
  ): ReactCropType => {
    const preset = ASPECT_RATIO_PRESETS.find(p => p.id === presetId);
    const ratio = preset?.ratio;
    
    if (ratio) {
      return centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 80,
          },
          ratio,
          width,
          height
        ),
        width,
        height
      );
    }
    
    return {
      unit: '%',
      x: 10,
      y: 10,
      width: 80,
      height: 80
    };
  };

  const getAspectForPreset = (presetId: string): number | undefined => {
    const preset = ASPECT_RATIO_PRESETS.find(p => p.id === presetId);
    return preset?.ratio ?? undefined;
  };

  const handleSelectPreset = (presetId: string) => {
    if (!activeImage) return;
    setImages(prev => prev.map((img, idx) => {
      if (idx === activeIndex) {
        const nw = img.naturalWidth || 100;
        const nh = img.naturalHeight || 100;
        const preset = ASPECT_RATIO_PRESETS.find(p => p.id === presetId);
        const ratio = preset?.ratio;

        // Si hay zoom/pan activo, calcular la porción visible y centrar el crop ahí
        if ((zoom !== 1 || position.x !== 0 || position.y !== 0) && viewerContainerRef.current) {
          const container = viewerContainerRef.current;
          const imgEl = container.querySelector('img');
          if (imgEl) {
            // Dimensiones del contenedor visible (viewport del visor)
            const containerRect = container.getBoundingClientRect();
            // Dimensiones renderizadas de la imagen (antes del scale)
            const displayW = imgEl.offsetWidth;
            const displayH = imgEl.offsetHeight;

            // Escala entre píxeles naturales y píxeles renderizados
            const scaleX = nw / displayW;
            const scaleY = nh / displayH;

            // Centro visible en coordenadas de la imagen renderizada (sin scale)
            // transform: translate(pos) scale(zoom) con origin center
            // → el centro del viewport corresponde al centro de la imagen desplazado inversamente
            const visCX = displayW / 2 - position.x / zoom;
            const visCY = displayH / 2 - position.y / zoom;

            // Convertir a porcentaje de la imagen natural
            const visCXpct = (visCX * scaleX / nw) * 100;
            const visCYpct = (visCY * scaleY / nh) * 100;

            // Ancho y alto visibles en coordenadas de imagen
            const visW = (containerRect.width / zoom) * scaleX;
            const visH = (containerRect.height / zoom) * scaleY;
            const visWpct = Math.min((visW / nw) * 100, 100);
            const visHpct = Math.min((visH / nh) * 100, 100);

            // El crop debe caber dentro de la zona visible
            let cropW: number;
            let cropH: number;

            if (ratio) {
              // Calcular el mayor crop que quepa en el viewport visible manteniendo aspect ratio
              const maxW = visWpct * 0.85; // 85% del viewport visible
              const maxH = visHpct * 0.85;
              
              // Probar ancho primero
              cropW = maxW;
              cropH = (cropW / 100 * nw) / ratio / nh * 100;
              
              if (cropH > maxH) {
                cropH = maxH;
                cropW = (cropH / 100 * nh) * ratio / nw * 100;
              }
            } else {
              // Libre: 80% del viewport visible
              cropW = visWpct * 0.8;
              cropH = visHpct * 0.8;
            }

            // Centrar el crop en el centro visible
            let cropX = visCXpct - cropW / 2;
            let cropY = visCYpct - cropH / 2;

            // Clamp para no salir de la imagen
            cropX = Math.max(0, Math.min(cropX, 100 - cropW));
            cropY = Math.max(0, Math.min(cropY, 100 - cropH));
            cropW = Math.min(cropW, 100 - cropX);
            cropH = Math.min(cropH, 100 - cropY);

            return {
              ...img,
              selectedPreset: presetId,
              crop: {
                unit: '%' as const,
                x: cropX,
                y: cropY,
                width: cropW,
                height: cropH
              }
            };
          }
        }

        // Sin zoom/pan: comportamiento original (centrar en la imagen completa)
        const crop = getInitialCrop(nw, nh, presetId);
        return {
          ...img,
          selectedPreset: presetId,
          crop
        };
      }
      return img;
    }));
  };

  const handleCropChange = (c: ReactCropType) => {
    if (!activeImage) return;
    setImages(prev => prev.map((img, idx) => {
      if (idx === activeIndex) {
        return {
          ...img,
          crop: c
        };
      }
      return img;
    }));
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (!activeImage) return;

    if (activeImage.naturalWidth === 0 || activeImage.naturalHeight === 0) {
      setImages(prev => prev.map((img, idx) => {
        if (idx === activeIndex) {
          const defaultCrop = getInitialCrop(naturalWidth, naturalHeight, img.selectedPreset);
          return {
            ...img,
            naturalWidth,
            naturalHeight,
            crop: defaultCrop
          };
        }
        return img;
      }));
    }
  };

  const getCalculatedPixels = () => {
    if (!activeImage || !activeImage.crop) {
      return { width: 0, height: 0, x: 0, y: 0 };
    }
    const { crop, naturalWidth, naturalHeight } = activeImage;
    const w = Math.round(((crop.width || 0) / 100) * (naturalWidth || 0));
    const h = Math.round(((crop.height || 0) / 100) * (naturalHeight || 0));
    const x = Math.round(((crop.x || 0) / 100) * (naturalWidth || 0));
    const y = Math.round(((crop.y || 0) / 100) * (naturalHeight || 0));
    return { width: w, height: h, x, y };
  };

  const calculatedPixels = getCalculatedPixels();

  const processImageWithWorker = (item: CropImageItem): Promise<Blob> => {
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
          crop: {
            x: item.crop.x || 0,
            y: item.crop.y || 0,
            width: item.crop.width || 0,
            height: item.crop.height || 0
          }
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
        const fileName = `Recortar_Pixetide_com_${item.file.name}`;
        
        a.href = url;
        a.download = fileName;
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
          try {
            const blob = await processImageWithWorker(item);
            const fileName = `Recortar_Pixetide_com_${item.file.name}`;
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
        const zipName = `Recortar_Pixetide_com_${firstBaseName}.zip`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = zipName;
        document.body.appendChild(a);
        a.click();
        
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

  const renderPresetIcon = (iconName: string) => {
    const sizeClass = "size-4 text-muted-foreground group-hover:text-primary transition-colors";
    switch (iconName) {
      case 'Square':
        return <Square className={sizeClass} />;
      case 'RectangleVertical':
        return <Smartphone className={sizeClass} />;
      case 'Tv':
        return <Tv className={sizeClass} />;
      case 'Smartphone':
        return <Smartphone className={sizeClass} />;
      case 'Monitor':
        return <Monitor className={sizeClass} />;
      default:
        return <Maximize2 className={sizeClass} />;
    }
  };

  const renderControls = () => (
    <div className="space-y-8 flex-1 flex flex-col">
      <div className="space-y-8">
        {/* Sección: Relaciones de Aspecto */}
        <div className="space-y-4">
          <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
            {locale === 'es' ? 'Proporción de Aspecto' : 'Aspect Ratio'}
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {ASPECT_RATIO_PRESETS.map((preset) => {
              const isActive = activeImage?.selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  disabled={!activeImage || isProcessing}
                  className={cn(
                    "flex flex-col items-start text-left p-3 rounded-xl border transition-all relative overflow-hidden group select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                    isActive 
                      ? "border-[#a855f7] bg-purple-500/[0.02] shadow-[0_2px_8px_rgba(168,85,247,0.06)]" 
                      : "border-border hover:border-muted-foreground/35 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    {renderPresetIcon(preset.iconName)}
                    {isActive && (
                      <span className="size-1.5 rounded-full bg-[#a855f7]" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-serif font-medium",
                    isActive ? "text-primary font-semibold" : "text-muted-foreground group-hover:text-primary"
                  )}>
                    {preset.label[locale]}
                  </span>
                  {preset.subLabel && (
                    <span className="text-[9px] font-mono text-muted-foreground/75 mt-0.5 line-clamp-1">
                      {preset.subLabel[locale]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sección: Coordenadas de Recorte */}
        <div className="space-y-4">
          <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
            {locale === 'es' ? 'Dimensiones del Recorte (px)' : 'Crop Dimensions (px)'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono uppercase text-muted-foreground/85">{locale === 'es' ? 'Ancho' : 'Width'}</span>
              <input 
                type="number" 
                value={calculatedPixels.width || ''}
                readOnly
                className="w-full h-9 px-3 rounded-lg border border-border bg-slate-50/50 text-xs font-mono text-muted-foreground/60 select-none cursor-default"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono uppercase text-muted-foreground/85">{locale === 'es' ? 'Alto' : 'Height'}</span>
              <input 
                type="number" 
                value={calculatedPixels.height || ''}
                readOnly
                className="w-full h-9 px-3 rounded-lg border border-border bg-slate-50/50 text-xs font-mono text-muted-foreground/60 select-none cursor-default"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono uppercase text-muted-foreground/85">X Offset</span>
              <input 
                type="number" 
                value={calculatedPixels.x ?? ''}
                readOnly
                className="w-full h-9 px-3 rounded-lg border border-border bg-slate-50/50 text-xs font-mono text-muted-foreground/60 select-none cursor-default"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono uppercase text-muted-foreground/85">Y Offset</span>
              <input 
                type="number" 
                value={calculatedPixels.y ?? ''}
                readOnly
                className="w-full h-9 px-3 rounded-lg border border-border bg-slate-50/50 text-xs font-mono text-muted-foreground/60 select-none cursor-default"
              />
            </div>
          </div>
        </div>
      </div>
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

      {/* ─── COLUMNA IZQUIERDA: ESPACIO DE TRABAJO ─── */}
      <div className="flex-1 flex flex-col min-w-0 gap-6 lg:h-full">
        
        {/* Header de la Herramienta */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl md:text-3xl text-primary font-medium tracking-tight">
              {locale === 'es' ? 'Recortar Fotos para Redes' : 'Crop Images for Social Media'}
            </h2>
            <p className="text-xs text-muted-foreground leading-normal max-w-xl">
              {locale === 'es' 
                ? 'Recorta tus imágenes con proporciones ideales para Instagram, Facebook, Pinterest u otras redes sociales favoritas, o ajusta el recorte libremente.'
                : 'Crop your images to the perfect ratios for Instagram, Facebook, Pinterest, or other social media channels, or customize the dimensions freely.'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={handleClearAll}
              disabled={images.length === 0 || isProcessing}
              className="h-9 px-4 rounded-full border border-border hover:bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="size-3.5" />
              <span>{locale === 'es' ? 'Limpiar todo' : 'Clear all'}</span>
            </button>
            <button 
              onClick={handleTriggerUpload}
              disabled={isProcessing}
              className="h-9 px-4 rounded-full bg-primary hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Upload className="size-3.5" />
              <span>{locale === 'es' ? 'Subir Nueva' : 'Upload New'}</span>
            </button>
          </div>
        </div>

        {/* AREA DE IMAGEN / VISUALIZADOR */}
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
                  ? 'Ocurrió un error al cargar el motor de procesamiento. Por favor, intenta de nuevo.' 
                  : 'An error occurred while loading the processing engine. Please try again.'}
              </p>
              <button 
                onClick={() => {
                  if (workerRef.current) {
                    workerRef.current.terminate();
                    workerRef.current = null;
                  }
                  let hasLoadedBefore = false;
                  try {
                    hasLoadedBefore = localStorage.getItem('pixetide_crop_loaded') === 'true';
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
            className="flex-1 min-h-[250px] dropzone-grid border border-border/80 rounded-2xl flex items-center justify-center p-4 md:p-8 text-center relative overflow-hidden transition-colors group cursor-pointer"
          >
            {/* Esquinas visor fotográfico */}
            <div className="corner-decorator corner-tl"></div>
            <div className="corner-decorator corner-tr"></div>
            <div className="corner-decorator corner-bl"></div>
            <div className="corner-decorator corner-br"></div>
 
            <div className="flex flex-col items-center gap-4 max-w-sm z-10 bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-border/40 shadow-sm transition-all group-hover:shadow-md">
              <div className="size-14 rounded-full bg-white flex items-center justify-center border border-border/85 shadow-sm text-muted-foreground">
                <CropIcon className="size-6" />
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
            className="flex-1 min-h-[250px] dropzone-grid border border-border/80 rounded-2xl flex items-center justify-center p-4 md:p-8 relative overflow-hidden transition-colors group"
          >
            {/* Esquinas visor fotográfico */}
            <div className="corner-decorator corner-tl"></div>
            <div className="corner-decorator corner-tr"></div>
            <div className="corner-decorator corner-bl"></div>
            <div className="corner-decorator corner-br"></div>
 
            {/* Visualizador de imagen con react-image-crop */}
            <div 
              ref={viewerContainerRef} 
              onWheel={handleWheel}
              className="absolute inset-4 pb-14 md:inset-8 md:pb-16 flex items-center justify-center z-10 overflow-hidden"
            >
              <div 
                className={cn(
                  "relative max-w-full max-h-full flex items-center justify-center p-2 md:p-4 transition-transform duration-200 ease-out",
                  isPanMode ? "cursor-grab active:cursor-grabbing select-none" : ""
                )}
                style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`, transformOrigin: 'center center', '--crop-inverse-zoom': 1 / zoom } as React.CSSProperties}
                onPointerDownCapture={handlePointerDownCapture}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <ReactCrop
                  crop={activeImage.crop}
                  onChange={(_pixelCrop, percentCrop) => handleCropChange(percentCrop)}
                  aspect={getAspectForPreset(activeImage.selectedPreset)}
                  className={cn(
                    "max-w-full max-h-full block rounded select-none",
                    isVertical ? "w-auto h-full" : "w-full h-auto"
                  )}
                  ruleOfThirds
                >
                  <img 
                    src={activeImage.previewUrl} 
                    alt={activeImage.file.name}
                    onLoad={onImageLoad}
                    className={cn(
                      "max-w-full max-h-full block rounded opacity-90 select-none",
                      isVertical ? "w-auto h-full" : "w-full h-auto"
                    )}
                  />
                </ReactCrop>
              </div>
            </div>
 
            {/* Controles de Zoom Flotantes */}
            <div className="absolute bottom-1 right-1 md:bottom-1.5 md:right-1.5 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-border/80 rounded-full p-1.5 shadow-md">
              <button
                type="button"
                onClick={() => setIsPanMode(!isPanMode)}
                className={cn(
                  "size-9 rounded-full flex items-center justify-center transition-all cursor-pointer",
                  isPanMode 
                    ? "bg-[#a855f7] text-white shadow-sm hover:bg-[#9333ea]" 
                    : "text-muted-foreground hover:text-primary hover:bg-slate-100"
                )}
                title={locale === 'es' ? 'Herramienta de mano (Desplazar)' : 'Hand Tool (Pan)'}
              >
                <Hand className="size-4.5" />
              </button>
              <div className="w-[1px] h-5 bg-border/60 mx-0.5" />
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.05}
                className="size-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title={locale === 'es' ? 'Alejar' : 'Zoom Out'}
              >
                <ZoomOut className="size-4.5" />
              </button>
              <span className="text-xs font-mono font-bold px-1 min-w-[44px] text-center select-none text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 3.0}
                className="size-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title={locale === 'es' ? 'Acercar' : 'Zoom In'}
              >
                <ZoomIn className="size-4.5" />
              </button>
              <div className="w-[1px] h-5 bg-border/60 mx-0.5" />
              <button
                type="button"
                onClick={handleZoomReset}
                className="size-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-slate-100 transition-all cursor-pointer"
                title={locale === 'es' ? 'Restablecer ajuste' : 'Reset Zoom'}
              >
                <Maximize2 className="size-4.5" />
              </button>
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
                  onClick={() => {
                    if (!isProcessing) {
                      setActiveIndex(idx);
                    }
                  }}
                  className={cn(
                    "relative size-16 rounded-xl border overflow-hidden flex-shrink-0 transition-all shadow-sm hover:scale-105",
                    idx === activeIndex ? "border-[#a855f7] ring-2 ring-purple-500/20" : "border-border hover:border-muted-foreground/45",
                    isProcessing ? "opacity-60 cursor-not-allowed pointer-events-none" : "cursor-pointer"
                  )}
                >
                  <img 
                    src={img.previewUrl} 
                    alt="Thumbnail" 
                    className="w-full h-full object-cover"
                  />
                  {/* Botón de borrar miniatura */}
                  <button 
                    onClick={(e) => handleRemoveImage(e, img.id)}
                    disabled={isProcessing}
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

        {/* PIE DE PÁGINA: GUÍA Y RECOMENDACIÓN */}
        <div className="flex flex-col md:flex-row items-center gap-4 select-none w-full">
          {/* Tarjeta 1: Guía de uso */}
          <div className="flex-1 w-full bg-slate-50/60 hover:bg-slate-50/80 border border-border/80 hover:border-[#a855f7]/30 p-5 rounded-2xl transition-all cursor-pointer group flex justify-between items-center relative overflow-hidden hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)] hover:-translate-y-0.5 active:translate-y-0 duration-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/[0.005] to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 bg-[#a855f7]/[0.02] rounded-full pointer-events-none"></div>

            <div className="space-y-1 z-10">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <HelpCircle className="size-3 text-muted-foreground/80" />
                {locale === 'es' ? 'Guía del usuario' : 'User guide'}
              </span>
              <p className="text-sm font-serif text-primary font-medium">
                {locale === 'es' ? '¿Cómo recortar imágenes sin perder resolución?' : 'How to crop images without losing resolution?'}
              </p>
            </div>
            <span className="text-primary group-hover:translate-x-1.5 transition-transform duration-300 font-bold z-10">→</span>
          </div>

          {/* Separador vertical */}
          <div className="hidden md:flex items-center justify-center text-border/60 text-lg font-light font-sans px-1 pointer-events-none self-center">
            |
          </div>

          {/* Tarjeta 2: Destacado Girar y Voltear */}
          <div 
            onClick={() => {
              if (!isProcessing) {
                window.location.href = locale === 'es' ? '/es/herramientas/girar-voltear-imagen/' : '/tools/rotate-flip-image/';
              }
            }}
            className="flex-1 w-full bg-slate-50/60 hover:bg-slate-50/80 border border-border/80 hover:border-[#a855f7]/30 p-5 rounded-2xl transition-all cursor-pointer group flex justify-between items-center relative overflow-hidden hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)] hover:-translate-y-0.5 active:translate-y-0 duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/[0.005] to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 bg-[#a855f7]/[0.02] rounded-full pointer-events-none"></div>

            <div className="space-y-1.5 z-10">
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-white bg-[#a855f7] px-1.5 py-0.5 rounded-md">
                {locale === 'es' ? 'Recomendado' : 'Featured'}
              </span>
              <p className="text-sm font-serif text-primary font-medium">
                {locale === 'es' ? 'Girar y voltear imágenes online' : 'Rotate and flip images online'}
              </p>
            </div>
            <span className="text-primary group-hover:translate-x-1.5 transition-transform duration-300 font-bold z-10">→</span>
          </div>
        </div>

      </div>

      {/* ─── COLUMNA DERECHA: SIDEBAR DE CONTROLES ─── */}
      <div className="hidden lg:flex w-full lg:w-80 shrink-0 bg-white border border-border rounded-2xl flex-col lg:h-full overflow-hidden shadow-sm">
        
        {/* Panel de Controles de Edición */}
        <div className="p-6 flex-1 flex flex-col overflow-y-auto">
          <h3 className="font-serif text-lg font-medium text-primary border-b border-border/80 pb-4 mb-6">
            {locale === 'es' ? 'Controles de Edición' : 'Edit Controls'}
          </h3>
          {renderControls()}
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

      {/* Drawer Móvil (Bottom Sheet) */}
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
            {renderControls()}
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
};

