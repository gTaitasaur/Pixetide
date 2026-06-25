import React, { useState, useEffect, useRef } from 'react';
import { useLocale } from '../../core/i18n/useLocale';
import './ImagesToPdfModule.css';
import {
  Trash2,
  Upload,
  ImageIcon,
  ArrowUp,
  ArrowDown,
  X,
  FileDown,
  Sliders,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { validateImageFile } from '../../shared/utils/fileUpload';
import { useToast } from '../../shared/components/Errors/ToastContext';
import { cn } from '../../shared/utils/cn';
import LoaderPrime from '../../shared/components/UI/Loader/LoaderPrime';
import { Sheet, SheetContent } from '../../shared/components/ui/sheet';

interface PdfImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  isDecoding?: boolean;
  decodingMessage?: string;
}

interface GeneratingProgress {
  current: number;
  total: number;
  filename: string;
}

// Helper para rasterizar SVG a alta densidad (hasta 4K) en el hilo principal sin congelar el event loop
const rasterizeSVG = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const objectURL = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = objectURL;
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 4096; // 4K para nitidez vectorial profesional
        let w = img.naturalWidth || maxDim;
        let h = img.naturalHeight || maxDim;
        
        if (w === 0 || h === 0) {
          w = maxDim;
          h = maxDim;
        }
        
        const scale = Math.min(maxDim / w, maxDim / h);
        const destW = Math.round(w * scale);
        const destH = Math.round(h * scale);
        
        canvas.width = destW;
        canvas.height = destH;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas 2D'));
          return;
        }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, destW, destH);
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectURL);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Fallo al exportar canvas SVG a Blob'));
          }
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(objectURL);
        reject(err);
      }
    };
    
    img.onerror = (err) => {
      URL.revokeObjectURL(objectURL);
      reject(err);
    };
  });
};

// Helper para decodificar HEIC a PNG utilizando heic2any directamente
const decodeHEIC = async (file: File): Promise<Blob> => {
  const { default: heic2any } = await import('heic2any');
  const conversionResult = await heic2any({
    blob: file,
    toType: 'image/png',
    quality: 0.95
  });
  
  return Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
};

// Helper para decodificar BMP utilizando el motor nativo del navegador (Canvas)
const decodeBMP = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const objectURL = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectURL;
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas 2D'));
          return;
        }
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectURL);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Fallo al exportar canvas BMP a Blob'));
          }
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(objectURL);
        reject(err);
      }
    };
    
    img.onerror = (err) => {
      URL.revokeObjectURL(objectURL);
      reject(err);
    };
  });
};

export const ImagesToPdfModule: React.FC = () => {
  const { locale, t } = useLocale();
  const { showToast } = useToast();

  const [images, setImages] = useState<PdfImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'original'>('a4');
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [margin, setMargin] = useState<'none' | 'small' | 'large'>('none');
  const [quality, setQuality] = useState<number>(0.85);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<GeneratingProgress>({ current: 0, total: 0, filename: '' });
  const [isImagesLoading, setIsImagesLoading] = useState<boolean>(false);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop states para el reordenamiento nativo
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Liberar previews al desmontar
  useEffect(() => {
    return () => {
      images.forEach(img => {
        URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, [images]);

  // Manejo de carga de archivos
  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const processUploadedFiles = async (files: FileList) => {
    setIsImagesLoading(true);
    const itemsToAdd: PdfImageItem[] = [];
    const decodingTasks: Array<{
      id: string;
      file: File;
      type: 'svg' | 'heic' | 'bmp';
    }> = [];

    Array.from(files).forEach((file) => {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        showToast(
          locale === 'es'
            ? `El archivo ${file.name} no se pudo cargar: ${validation.error}`
            : `File ${file.name} could not be loaded: ${validation.error}`,
          'error'
        );
        return;
      }

      const id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const isSvg = ext === '.svg';
      const isHeic = ext === '.heic' || ext === '.heif';
      const isBmp = ext === '.bmp';

      if (isSvg || isHeic || isBmp) {
        itemsToAdd.push({
          id,
          file,
          previewUrl: '',
          name: file.name,
          size: file.size,
          isDecoding: true,
          decodingMessage: isSvg 
            ? (locale === 'es' ? 'Procesando SVG...' : 'Processing SVG...')
            : isHeic
              ? (locale === 'es' ? 'Decodificando HEIC...' : 'Decoding HEIC...')
              : (locale === 'es' ? 'Decodificando BMP...' : 'Decoding BMP...')
        });

        decodingTasks.push({
          id,
          file,
          type: isSvg ? 'svg' : isHeic ? 'heic' : 'bmp'
        });
      } else {
        itemsToAdd.push({
          id,
          file,
          previewUrl: URL.createObjectURL(file),
          name: file.name,
          size: file.size
        });
      }
    });

    if (itemsToAdd.length > 0) {
      setImages((prev) => [...prev, ...itemsToAdd]);
    }
    setIsImagesLoading(false);

    // Decodificar secuencialmente en el fondo para evitar bloqueos
    for (const task of decodingTasks) {
      try {
        let decodedBlob: Blob;
        if (task.type === 'svg') {
          decodedBlob = await rasterizeSVG(task.file);
          await new Promise(resolve => requestAnimationFrame(resolve));
        } else if (task.type === 'bmp') {
          decodedBlob = await decodeBMP(task.file);
          await new Promise(resolve => setTimeout(resolve, 0));
        } else {
          decodedBlob = await decodeHEIC(task.file);
          await new Promise(resolve => setTimeout(resolve, 0));
        }

        const decodedFileName = task.file.name.substring(0, task.file.name.lastIndexOf('.')) + '.png';
        const decodedFile = new File([decodedBlob], decodedFileName, { type: 'image/png' });
        const newPreviewUrl = URL.createObjectURL(decodedFile);

        setImages(prev => prev.map(img => {
          if (img.id === task.id) {
            return {
              ...img,
              file: decodedFile,
              previewUrl: newPreviewUrl,
              isDecoding: false,
              decodingMessage: undefined
            };
          }
          return img;
        }));
      } catch (err) {
        console.error(`Error decodificando archivo ${task.file.name}:`, err);
        const errMsg = locale === 'es' 
          ? `Ocurrió un error al decodificar ${task.file.name}.`
          : `An error occurred while decoding ${task.file.name}.`;
        showToast(errMsg, 'error');
        
        // Limpiamos de la galería
        setImages(prev => prev.filter(img => img.id !== task.id));
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processUploadedFiles(e.target.files);
    }
  };

  // Drag and drop para la dropzone global
  const handleDragOverGlobal = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDropGlobal = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      processUploadedFiles(e.dataTransfer.files);
    }
  };

  const handleClearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    showToast(
      locale === 'es' ? 'Galería vaciada correctamente.' : 'Gallery cleared successfully.',
      'success'
    );
  };

  // Reordenar imágenes - Botones manuales
  const moveImageUp = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const moveImageDown = (index: number) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find(img => img.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  // Reordenar imágenes - Drag and Drop HTML5 Nativo
  const handleDragStartCard = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    // Efecto visual nativo de arrastre
    e.dataTransfer.effectAllowed = 'move';
    // Se guarda el index
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOverCard = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeaveCard = () => {
    setDragOverIndex(null);
  };

  const handleDropCard = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    const sourceIndex = sourceIndexStr ? parseInt(sourceIndexStr, 10) : draggedIndex;

    if (sourceIndex === null || sourceIndex === index) {
      cleanupDragStates();
      return;
    }

    setImages((prev) => {
      const copy = [...prev];
      const [draggedItem] = copy.splice(sourceIndex, 1);
      copy.splice(index, 0, draggedItem);
      return copy;
    });

    cleanupDragStates();
  };

  const handleDragEndCard = () => {
    cleanupDragStates();
  };

  const cleanupDragStates = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Helpers para cargar dimensiones y compresión asíncrona (Opt. Memoria)
  const loadImageAndGetDimensions = (file: File): Promise<{
    width: number;
    height: number;
    imgElement: HTMLImageElement;
    dataUrl: string;
    cleanup: () => void;
  }> => {
    return new Promise((resolve, reject) => {
      const objectURL = URL.createObjectURL(file);
      const img = new Image();
      img.src = objectURL;
      img.onload = () => {
        resolve({
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 600,
          imgElement: img,
          dataUrl: objectURL,
          cleanup: () => {
            URL.revokeObjectURL(objectURL);
          }
        });
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(objectURL);
        reject(err);
      };
    });
  };

  const compressImageToJpeg = (img: HTMLImageElement, q: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL('image/jpeg', q);
    }
    return img.src;
  };

  // Generación secuencial de PDF
  const handleGeneratePdf = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    setProgress({ current: 0, total: images.length, filename: '' });

    try {
      const { jsPDF } = await import('jspdf');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let pdf: any = null;

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        setProgress({ current: i + 1, total: images.length, filename: item.name });

        // 1. Cargar imagen y obtener dimensiones nativas
        let imgData;
        try {
          imgData = await loadImageAndGetDimensions(item.file);
        } catch (loadErr) {
          console.error(`Error loading image ${item.name}:`, loadErr);
          // Si una imagen falla, continuar con las demás reportándolo
          showToast(
            locale === 'es'
              ? `Omitiendo archivo ilegible: ${item.name}`
              : `Skipping unreadable file: ${item.name}`,
            'error'
          );
          continue;
        }

        // 2. Determinar dimensiones y orientación de la página
        let pageWidth = imgData.width;
        let pageHeight = imgData.height;
        let imgWidth = imgData.width;
        let imgHeight = imgData.height;

        let finalOrientation: 'portrait' | 'landscape' = 'portrait';

        // Dimensiones estándar en pt (1 pt = 1/72 inch)
        if (pageSize === 'a4') {
          pageWidth = 595.28;
          pageHeight = 841.89;
        } else if (pageSize === 'letter') {
          pageWidth = 612;
          pageHeight = 792;
        }

        if (pageSize !== 'original') {
          if (orientation === 'auto') {
            finalOrientation = imgData.width > imgData.height ? 'landscape' : 'portrait';
            if (finalOrientation === 'landscape') {
              const temp = pageWidth;
              pageWidth = pageHeight;
              pageHeight = temp;
            }
          } else {
            finalOrientation = orientation;
            if (finalOrientation === 'landscape' && pageWidth < pageHeight) {
              const temp = pageWidth;
              pageWidth = pageHeight;
              pageHeight = temp;
            } else if (finalOrientation === 'portrait' && pageWidth > pageHeight) {
              const temp = pageWidth;
              pageWidth = pageHeight;
              pageHeight = temp;
            }
          }
        } else {
          finalOrientation = imgData.width > imgData.height ? 'landscape' : 'portrait';
        }

        // 3. Ajustar dimensiones con márgenes
        const marginSize = margin === 'none' ? 0 : margin === 'small' ? 20 : 40;
        const availableWidth = pageWidth - (marginSize * 2);
        const availableHeight = pageHeight - (marginSize * 2);

        const scale = Math.min(availableWidth / imgData.width, availableHeight / imgData.height);
        imgWidth = imgData.width * scale;
        imgHeight = imgData.height * scale;

        // Centrado exacto
        const x = marginSize + (availableWidth - imgWidth) / 2;
        const y = marginSize + (availableHeight - imgHeight) / 2;

        // 4. Inicializar o añadir página
        if (!pdf) {
          pdf = new jsPDF({
            orientation: finalOrientation,
            unit: 'pt',
            format: [pageWidth, pageHeight]
          });
        } else {
          pdf.addPage([pageWidth, pageHeight], finalOrientation);
        }

        // 5. Aplicar compresión asíncrona si es necesario
        let imageSrc = imgData.dataUrl;
        if (quality < 1.0) {
          imageSrc = compressImageToJpeg(imgData.imgElement, quality);
        }

        // Añadir imagen al PDF
        pdf.addImage(imageSrc, 'JPEG', x, y, imgWidth, imgHeight, undefined, 'FAST');

        // 6. Limpieza síncrona inmediata para liberar memoria RAM
        imgData.cleanup();

        // Dar un respiro a la UI de React para que actualice la barra de progreso
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // 7. Descarga del PDF final
      if (pdf) {
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Pixetide_PDF_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast(t('pdf.downloadSuccess'), 'success');
      }
    } catch (err) {
      console.error('Fatal PDF generation error:', err);
      showToast(t('pdf.downloadError'), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const truncateFilename = (name: string, maxLen = 16): string => {
    const dotIndex = name.lastIndexOf('.');
    if (dotIndex === -1) return name.length > maxLen ? `${name.substring(0, maxLen)}...` : name;
    const ext = name.substring(dotIndex);
    const base = name.substring(0, dotIndex);
    if (base.length > maxLen) {
      return `${base.substring(0, maxLen)}...${ext}`;
    }
    return name;
  };

  // Renderizar controles de la barra lateral (Estética similar a Converter)
  const renderSidebarControls = () => {
    return (
      <div className="space-y-8 flex-1">
        {/* Tamaño de página */}
        <div className="space-y-3.5">
          <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
            {t('pdf.pageSize')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['a4', 'letter', 'original'] as const).map((sz) => {
              const isActive = pageSize === sz;
              return (
                <button
                  key={sz}
                  onClick={() => setPageSize(sz)}
                  className={cn(
                    "h-10 rounded-xl border text-xs font-mono font-bold uppercase transition-all flex items-center justify-center cursor-pointer",
                    isActive
                      ? "border-[#a855f7] bg-purple-50/40 text-[#a855f7]"
                      : "border-border hover:bg-slate-50 text-muted-foreground"
                  )}
                >
                  {sz === 'original' ? t('pdf.pageSizeOriginal').split(' ')[0] : sz}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orientación (Deshabilitado si el tamaño de página es 'original') */}
        <div className={cn("space-y-3.5", pageSize === 'original' && "opacity-40 pointer-events-none")}>
          <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
            {t('pdf.orientation')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['auto', 'portrait', 'landscape'] as const).map((ort) => {
              const isActive = orientation === ort;
              return (
                <button
                  key={ort}
                  onClick={() => setOrientation(ort)}
                  disabled={pageSize === 'original'}
                  className={cn(
                    "h-10 rounded-xl border text-xs font-mono font-bold uppercase transition-all flex items-center justify-center cursor-pointer",
                    isActive
                      ? "border-[#a855f7] bg-purple-50/40 text-[#a855f7]"
                      : "border-border hover:bg-slate-50 text-muted-foreground"
                  )}
                >
                  {ort === 'auto'
                    ? t('pdf.orientationAuto')
                    : ort === 'portrait'
                      ? t('pdf.orientationPortrait')
                      : t('pdf.orientationLandscape')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Márgenes */}
        <div className="space-y-3.5">
          <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
            {t('pdf.margin')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['none', 'small', 'large'] as const).map((mg) => {
              const isActive = margin === mg;
              return (
                <button
                  key={mg}
                  onClick={() => setMargin(mg)}
                  className={cn(
                    "h-10 rounded-xl border text-xs font-mono font-bold uppercase transition-all flex items-center justify-center cursor-pointer",
                    isActive
                      ? "border-[#a855f7] bg-purple-50/40 text-[#a855f7]"
                      : "border-border hover:bg-slate-50 text-muted-foreground"
                  )}
                >
                  {mg === 'none'
                    ? t('pdf.marginNoneVal')
                    : mg === 'small'
                      ? t('pdf.marginSmallVal')
                      : t('pdf.marginLargeVal')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calidad / Compresión de imágenes */}
        <div className="space-y-3.5 p-4 rounded-xl border border-border bg-slate-50/40">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
              {t('pdf.imageQuality')}
            </label>
            <span className="text-xs font-mono font-bold text-[#a855f7]">
              {Math.round(quality * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.4"
            max="1.0"
            step="0.05"
            value={quality}
            onChange={(e) => setQuality(parseFloat(e.target.value))}
            className="w-full accent-[#a855f7] cursor-pointer"
          />
          <p className="text-[10px] text-muted-foreground leading-normal font-medium mt-1">
            {locale === 'es'
              ? 'Valores bajos reducen significativamente el peso del archivo PDF final.'
              : 'Lower values significantly reduce the final PDF file size.'}
          </p>
        </div>
      </div>
    );
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
        accept="image/png, image/jpeg, image/webp, image/gif, image/tiff, image/bmp, image/svg+xml, .heic, .heif"
      />

      {/* ─── COLUMNA IZQUIERDA: GALERÍA Y STORYBOARD ─── */}
      <div className="flex-1 flex flex-col min-w-0 gap-6 lg:h-full">
        {/* Cabecera del Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl md:text-3xl text-primary font-medium tracking-tight">
              {t('pdf.title')}
            </h2>
            <p className="text-xs text-muted-foreground leading-normal max-w-xl">
              {t('pdf.description')}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleClearAll}
              disabled={images.length === 0 || isGenerating}
              className="h-9 px-4 rounded-full border border-border hover:bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="size-3.5" />
              <span>{t('pdf.clearAll')}</span>
            </button>
            <button
              onClick={handleTriggerUpload}
              disabled={isGenerating}
              className="h-9 px-4 rounded-full bg-primary hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Upload className="size-3.5" />
              <span>{t('pdf.uploadNew')}</span>
            </button>
          </div>
        </div>

        {/* ÁREA DE TRABAJO */}
        {isGenerating ? (
          <div className="flex-1 min-h-[350px] border border-border/80 rounded-2xl flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-slate-50/40">
            <div className="corner-decorator corner-tl"></div>
            <div className="corner-decorator corner-tr"></div>
            <div className="corner-decorator corner-bl"></div>
            <div className="corner-decorator corner-br"></div>
            <LoaderPrime
              message={`${t('pdf.generating')} (${progress.current}/${progress.total})`}
            />
            <p className="text-xs text-muted-foreground mt-4 font-mono max-w-md truncate">
              {progress.filename}
            </p>
          </div>
        ) : isImagesLoading ? (
          <div className="flex-1 min-h-[350px] border border-border/80 rounded-2xl flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-slate-50/40">
            <div className="corner-decorator corner-tl"></div>
            <div className="corner-decorator corner-tr"></div>
            <div className="corner-decorator corner-bl"></div>
            <div className="corner-decorator corner-br"></div>
            <LoaderPrime message={locale === 'es' ? 'Cargando imágenes...' : 'Loading images...'} />
          </div>
        ) : images.length === 0 ? (
          <div
            onClick={handleTriggerUpload}
            onDragOver={handleDragOverGlobal}
            onDrop={handleDropGlobal}
            className="flex-1 min-h-[350px] dropzone-grid border border-border/80 rounded-2xl flex items-center justify-center p-8 text-center relative overflow-hidden transition-colors group cursor-pointer"
          >
            {/* Decoradores en las esquinas */}
            <div className="corner-decorator corner-tl"></div>
            <div className="corner-decorator corner-tr"></div>
            <div className="corner-decorator corner-bl"></div>
            <div className="corner-decorator corner-br"></div>

            <div className="flex flex-col items-center gap-4 max-w-sm z-10 bg-white/95 backdrop-blur-sm p-6 rounded-2xl border border-border/45 shadow-sm transition-all group-hover:shadow-md">
              <div className="size-14 rounded-full bg-white flex items-center justify-center border border-border/85 shadow-sm text-muted-foreground">
                <ImageIcon className="size-6" />
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-primary">
                    {t('pdf.dropzonePrompt')}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    {t('pdf.dropzoneHint')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  {['PNG', 'JPG', 'WEBP', 'GIF', 'SVG', 'HEIC', 'BMP'].map((fmt) => (
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
          <div className="flex-1 bg-white border border-border/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-auto max-h-[60vh] lg:max-h-[65vh] relative">
            <div className="corner-decorator corner-tl"></div>
            <div className="corner-decorator corner-tr"></div>
            <div className="corner-decorator corner-bl"></div>
            <div className="corner-decorator corner-br"></div>

            {/* Grilla de Storyboard con Drag and Drop */}
            <div className="storyboard-grid pt-4">
              {images.map((item, index) => {
                const isDragged = draggedIndex === index;
                const isDraggedOver = dragOverIndex === index;

                return (
                  <div
                    key={item.id}
                    draggable="true"
                    onDragStart={(e) => handleDragStartCard(e, index)}
                    onDragOver={(e) => handleDragOverCard(e, index)}
                    onDragLeave={handleDragLeaveCard}
                    onDrop={(e) => handleDropCard(e, index)}
                    onDragEnd={handleDragEndCard}
                    className={cn(
                      "page-card",
                      isDragged && "dragging",
                      isDraggedOver && "drag-over"
                    )}
                  >
                    {/* Número de página */}
                    <span className="page-badge">
                      {t('pdf.page')} {index + 1}
                    </span>

                    {/* Drag overlay transparente */}
                    <div className="drag-handle-overlay" title={t('pdf.reorderTooltip')} />

                    {/* Miniatura */}
                    <div className="thumbnail-container">
                      {item.isDecoding ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-2 w-full h-full text-center">
                          <RefreshCw className="size-5 animate-spin text-[#a855f7]" />
                          <span className="text-[9px] font-mono font-bold text-muted-foreground leading-tight">
                            {item.decodingMessage}
                          </span>
                        </div>
                      ) : (
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="thumbnail-image"
                          loading="lazy"
                        />
                      )}
                    </div>

                    {/* Panel de información */}
                    <div className="page-info-panel">
                      <p className="filename-label" title={item.name}>
                        {truncateFilename(item.name)}
                      </p>
                      <span className="size-label">{formatSize(item.size)}</span>

                      {/* Controles rápidos */}
                      <div className="page-controls">
                        <button
                          onClick={() => moveImageUp(index)}
                          disabled={index === 0}
                          className="control-btn"
                          title={t('pdf.moveUp')}
                        >
                          <ArrowUp className="size-3" />
                        </button>
                        <button
                          onClick={() => moveImageDown(index)}
                          disabled={index === images.length - 1}
                          className="control-btn"
                          title={t('pdf.moveDown')}
                        >
                          <ArrowDown className="size-3" />
                        </button>
                        <button
                          onClick={() => removeImage(item.id)}
                          className="control-btn btn-danger"
                          title={t('pdf.remove')}
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PIE DE PÁGINA: GUÍA Y RECOMENDACIÓN */}
        <div className="flex flex-col md:flex-row items-center gap-4 select-none w-full mt-2">
          {/* Tarjeta 1: Guía de uso */}
          <div className="flex-1 w-full bg-slate-50/60 hover:bg-slate-50/80 border border-border/80 hover:border-[#a855f7]/30 p-5 rounded-2xl transition-all cursor-pointer group flex justify-between items-center relative overflow-hidden hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)] hover:-translate-y-0.5 active:translate-y-0 duration-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/[0.005] to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 bg-[#a855f7]/[0.02] rounded-full pointer-events-none"></div>
            
            <div className="space-y-1.5 z-10">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <HelpCircle className="size-3 text-muted-foreground/80" />
                {locale === 'es' ? 'Guía del usuario' : 'User guide'}
              </span>
              <p className="text-sm font-serif text-primary font-medium">
                {t('pdf.userGuideTitle')}
              </p>
            </div>
            <span className="text-primary group-hover:translate-x-1.5 transition-transform duration-300 font-bold z-10">→</span>
          </div>

          {/* Separador vertical */}
          <div className="hidden md:flex items-center justify-center text-border/60 text-lg font-light font-sans px-1 pointer-events-none self-center">
            |
          </div>

          {/* Tarjeta 2: Recomendación */}
          <div 
            onClick={() => window.location.href = locale === 'es' ? '/es/herramientas/comprimir-imagen/' : '/tools/compress-image/'}
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
                {locale === 'es' ? 'Comprimir imágenes online sin perder calidad' : 'Compress images online without losing quality'}
              </p>
            </div>
            <span className="text-primary group-hover:translate-x-1.5 transition-transform duration-300 font-bold z-10">→</span>
          </div>
        </div>
      </div>

      {/* ─── COLUMNA DERECHA: SIDEBAR (DESKTOP) ─── */}
      <div className="hidden lg:flex w-full lg:w-80 shrink-0 bg-white border border-border rounded-2xl flex-col lg:h-full overflow-hidden shadow-sm">
        <div className="p-6 flex-1 flex flex-col overflow-y-auto">
          <h3 className="font-serif text-lg font-medium text-primary border-b border-border/80 pb-4 mb-6">
            {locale === 'es' ? 'Ajustes del PDF' : 'PDF Settings'}
          </h3>
          {renderSidebarControls()}
        </div>

        {/* Panel inferior fijo con botón de acción (Estilo Pixetide Premium) */}
        <div className="p-6 border-t border-border/80 bg-slate-50/60 backdrop-blur-sm space-y-3 shrink-0">
          <button
            onClick={handleGeneratePdf}
            disabled={images.length === 0 || isGenerating}
            className="w-full py-3.5 px-4 bg-[#a855f7] hover:bg-purple-600 disabled:hover:bg-[#a855f7] text-white rounded-xl font-semibold text-xs uppercase tracking-[0.15em] transition-all shadow-sm active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="size-3.5 animate-spin" />
                <span>{t('pdf.generating')}</span>
              </>
            ) : (
              <>
                <FileDown className="size-3.5" />
                <span>{t('pdf.btnGenerateAndDownload')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── STICKY BOTTOM BAR MÓVIL ─── */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-border/80 flex items-center justify-between px-6 z-40 lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.04)] select-none">
        {/* Tab 1: Botón Ajustes */}
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

        {/* Separador vertical */}
        <div className="h-8 w-[1px] bg-border/60 pointer-events-none mx-2 shrink-0"></div>

        {/* Tab 2: Botón de Acción Dinámico */}
        <div className="flex-1 flex items-center shrink-0">
          <button
            onClick={handleGeneratePdf}
            disabled={images.length === 0 || isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#a855f7] hover:bg-purple-600 text-white text-xs font-semibold uppercase tracking-[0.15em] transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-sm active:scale-98"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                <span>{t('pdf.generating')}</span>
              </>
            ) : (
              <>
                <FileDown className="size-4" />
                <span>{t('pdf.btnGenerateAndDownload')}</span>
              </>
            )}
          </button>
        </div>
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
              {locale === 'es' ? 'Ajustes del PDF' : 'PDF Settings'}
            </h3>
            {renderSidebarControls()}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
