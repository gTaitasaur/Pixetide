import React, { useState, useEffect, useRef } from 'react';
import { useLocale } from '../../core/i18n/useLocale';
import './ConverterModule.css';
import { 
  ArrowLeftRight, 
  Trash2, 
  Upload, 
  Download, 
  Sliders,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ImageIcon,
  RefreshCw
} from 'lucide-react';
import { validateImageFile } from '../../shared/utils/fileUpload';
import { useToast } from '../../shared/components/Errors/ToastContext';
import { Sheet, SheetContent } from '../../shared/components/ui/sheet';
import { cn } from '../../shared/utils/cn';
import LoaderPrime from '../../shared/components/UI/Loader/LoaderPrime';
// @ts-expect-error - Vite Web Worker import syntax
import ConverterWorker from './converter.worker?worker';
import JSZip from 'jszip';

interface ConverterImageItem {
  id: string;
  file: File;
  previewUrl: string;
  targetFormat: 'png' | 'jpg' | 'webp' | 'gif' | 'avif' | 'tiff' | 'bmp' | 'ico' | 'pdf';
  bgColor: 'white' | 'black';
  isProcessing: boolean;
  isProcessed: boolean;
  resultBlob: Blob | null;
  resultSize: number | null;
  error: string | null;
  isDecoding?: boolean;
  decodingMessage?: string;
  originalName?: string;
  originalFormat?: string;
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
// Nota: heic2any ya maneja internamente un Web Worker para la decodificación pesada,
// por lo que no bloquea el hilo principal de la UI al ser invocada.
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
// Esto asegura 100% de retención de píxeles (lossless) sin requerir codificadores pesados en WASM.
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
        
        // Desactivamos suavizado para mantener los pixeles exactos del BMP
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectURL);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Fallo al exportar canvas BMP a Blob'));
          }
        }, 'image/png'); // Exportamos como PNG sin pérdida (lossless) para vips
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

export const ConverterModule: React.FC = () => {
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  
  // Listado de imágenes cargadas en memoria
  const [images, setImages] = useState<ConverterImageItem[]>([]);
  const [batchFormat, setBatchFormat] = useState<'png' | 'jpg' | 'webp' | 'gif' | 'avif' | 'tiff' | 'bmp' | 'ico' | 'pdf'>('webp');
  const [batchBgColor, setBatchBgColor] = useState<'white' | 'black'>('white');
  const [icoSizes, setIcoSizes] = useState<number[]>([16, 32, 48]);

  // Ref para mantener la lista de imágenes actualizada y evitar cierres desactualizados en callbacks
  const imagesRef = useRef<ConverterImageItem[]>(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // Cambiar formato global en cascada
  const handleGlobalFormatChange = (fmt: 'png' | 'jpg' | 'webp' | 'gif' | 'avif' | 'tiff' | 'bmp' | 'ico' | 'pdf') => {
    setBatchFormat(fmt);
    setImages(prev => prev.map(img => ({
      ...img,
      targetFormat: fmt,
      isProcessed: false,
      resultBlob: null,
      resultSize: null
    })));
  };

  // Cambiar color de fondo global en cascada
  const handleGlobalBgColorChange = (color: 'white' | 'black') => {
    setBatchBgColor(color);
    setImages(prev => prev.map(img => {
      if (img.targetFormat === 'jpg' || img.targetFormat === 'bmp') {
        return {
          ...img,
          bgColor: color,
          isProcessed: false,
          resultBlob: null,
          resultSize: null
        };
      }
      return img;
    }));
  };
  
  // Control de interfaz y responsive
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  const [isImagesLoading, setIsImagesLoading] = useState<boolean>(false);
  const [uploadCount, setUploadCount] = useState<number>(0);
  const [vipsState, setVipsState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [globalProcessing, setGlobalProcessing] = useState<boolean>(false);

  // Estados derivados para la barra de acciones
  const hasPendingImages = images.some(img => !img.resultBlob && !img.error && !img.isProcessing);
  const showDownloadButton = images.length > 0 && images.some(img => img.resultBlob) && !hasPendingImages;

  const isFirstLoadRef = useRef<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const processingQueueRef = useRef<Array<{ id: string; file: File; targetFormat: string; bgColor: string; icoSizes?: number[] }>>([]);

  // Liberar ObjectURLs al desmontar
  useEffect(() => {
    return () => {
      images.forEach(img => {
        URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, [images]);

  // Limpieza de worker al desmontar
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Procesar siguiente imagen en la cola secuencial (una a la vez para evitar OOM)
  const processNextInQueue = () => {
    const queue = processingQueueRef.current;
    if (queue.length === 0) {
      setGlobalProcessing(false);
      return;
    }

    const next = queue.shift()!;

    setImages(prev => prev.map(img =>
      img.id === next.id ? { ...img, isProcessing: true } : img
    ));

    const finalFormatForWorker = next.targetFormat === 'pdf' ? 'png' : next.targetFormat;

    workerRef.current?.postMessage({
      action: 'process',
      id: next.id,
      file: next.file,
      targetFormat: finalFormatForWorker,
      bgColor: next.bgColor,
      icoSizes: next.icoSizes
    });
  };

  // Inicialización del Worker
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
      const worker = new ConverterWorker() as Worker;
      workerRef.current = worker;

      worker.onerror = (err) => {
        console.error('Worker error:', err);
        showToast(
          locale === 'es'
            ? 'Ocurrió un error desconocido. Por favor, intenta de nuevo.'
            : 'An unknown error occurred. Please try again.',
          'error'
        );
        
        // Saneo de estado interno para evitar UI congelada ("Convirtiendo...")
        setVipsState('error');
        setGlobalProcessing(false);
        processingQueueRef.current = [];
        
        setImages(prev => prev.map(img => 
          img.isProcessing 
            ? { 
                ...img, 
                isProcessing: false, 
                error: locale === 'es' ? 'Fallo crítico del motor' : 'Critical engine failure' 
              }
            : img
        ));
        
        // Destruir el worker roto para asegurar que "Reintentar" levante uno nuevo y limpio
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
      };

      worker.onmessage = (e) => {
        const { type, message, id, blob, size } = e.data;

        if (type === 'initialized') {
          const elapsed = Date.now() - startTime;
          const minDelay = hasLoadedBefore ? 1000 : 2000;
          const remaining = Math.max(0, minDelay - elapsed);
          
          setTimeout(() => {
            setVipsState('loaded');
            try {
              localStorage.setItem('pixetide_vips_loaded', 'true');
            } catch (err) {
              console.warn('LocalStorage unavailable', err);
            }
          }, remaining);
        } else if (type === 'init_error') {
          console.error('Worker init error:', message);
          showToast(
            locale === 'es'
              ? 'Ocurrió un error desconocido. Por favor, intenta de nuevo.'
              : 'An unknown error occurred. Please try again.',
            'error'
          );
          setVipsState('error');
        } else if (type === 'result') {
          const item = imagesRef.current.find(img => img.id === id);
          if (item && item.targetFormat === 'pdf') {
            (async () => {
              try {
                const { jsPDF } = await import('jspdf');
                const objectURL = URL.createObjectURL(blob);
                const img = new Image();
                img.src = objectURL;
                
                img.onload = () => {
                  try {
                    const width = img.naturalWidth || 800;
                    const height = img.naturalHeight || 600;
                    
                    const pdf = new jsPDF({
                      orientation: width > height ? 'landscape' : 'portrait',
                      unit: 'px',
                      format: [width, height]
                    });
                    
                    pdf.addImage(img, 'PNG', 0, 0, width, height);
                    const pdfBlob = pdf.output('blob');
                    
                    URL.revokeObjectURL(objectURL);
                    
                    setImages(prev => prev.map(i => {
                      if (i.id === id) {
                        return {
                          ...i,
                          isProcessing: false,
                          isProcessed: true,
                          resultBlob: pdfBlob,
                          resultSize: pdfBlob.size,
                          error: null
                        };
                      }
                      return i;
                    }));
                    
                    processNextInQueue();
                  } catch (pdfErr) {
                    URL.revokeObjectURL(objectURL);
                    console.error('Error rendering PDF:', pdfErr);
                    handlePdfError(id, String(pdfErr));
                  }
                };
                
                img.onerror = (err) => {
                  URL.revokeObjectURL(objectURL);
                  console.error('Error loading PNG for PDF wrapping:', err);
                  handlePdfError(id, locale === 'es' ? 'Error al renderizar el documento PDF.' : 'Error rendering PDF document.');
                };
              } catch (importErr) {
                console.error('Error importing jsPDF:', importErr);
                handlePdfError(id, locale === 'es' ? 'No se pudo inicializar el generador de PDF.' : 'Could not initialize PDF generator.');
              }
            })();
          } else {
            setImages(prev => prev.map(img => {
              if (img.id === id) {
                return {
                  ...img,
                  isProcessing: false,
                  isProcessed: true,
                  resultBlob: blob,
                  resultSize: size,
                  error: null
                };
              }
              return img;
            }));
            processNextInQueue();
          }
        } else if (type === 'process_error') {
          console.error('Worker process error:', message);
          setImages(prev => prev.map(img => {
            if (img.id === id) {
              return {
                ...img,
                isProcessing: false,
                isProcessed: false,
                error: message || 'Error al procesar la imagen.'
              };
            }
            return img;
          }));
          // Continuar con la siguiente imagen aunque haya error
          processNextInQueue();
        }
      };

      // Mandamos señal de inicio
      worker.postMessage({ action: 'init' });
    } catch (err) {
      console.error('Worker instantiation failed:', err);
      setVipsState('error');
    }
  };

  // Manejo de errores al envolver en PDF en el hilo principal
  const handlePdfError = (id: string, message: string) => {
    setImages(prev => prev.map(img => {
      if (img.id === id) {
        return {
          ...img,
          isProcessing: false,
          isProcessed: false,
          error: message
        };
      }
      return img;
    }));
    processNextInQueue();
  };

  // Cargar el worker en primer uso de carga de archivos
  useEffect(() => {
    if (images.length > 0 && vipsState === 'idle') {
      let hasLoadedBefore = false;
      try {
        hasLoadedBefore = localStorage.getItem('pixetide_vips_loaded') === 'true';
      } catch (err) {
        console.warn(err);
      }
      isFirstLoadRef.current = !hasLoadedBefore;
      setVipsState('loading');
      initializeWorker();
    }
  }, [images, vipsState]);

  // globalProcessing se gestiona manualmente:
  // - true al iniciar handleConvert (procesamiento por lote)
  // - false cuando la cola se vacía en processNextInQueue
  // No se usa useEffect para evitar conflictos con reintentos individuales

  // Procesamiento de archivos
  const handleFiles = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    setIsImagesLoading(true);
    setUploadCount(filesList.length);

    const itemsToAdd: ConverterImageItem[] = [];
    const decodingTasks: Array<{
      id: string;
      file: File;
      type: 'svg' | 'heic' | 'bmp';
    }> = [];

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const validation = validateImageFile(file);

      if (!validation.isValid) {
        showToast(validation.error || 'Archivo inválido', 'error');
        continue;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const isSvg = ext === '.svg';
      const isHeic = ext === '.heic' || ext === '.heif';
      const isBmp = ext === '.bmp';

      if (isSvg || isHeic || isBmp) {
        itemsToAdd.push({
          id,
          file,
          previewUrl: '',
          targetFormat: batchFormat,
          bgColor: batchBgColor,
          isProcessing: false,
          isProcessed: false,
          resultBlob: null,
          resultSize: null,
          error: null,
          isDecoding: true,
          decodingMessage: isSvg 
            ? (locale === 'es' ? 'Procesando SVG...' : 'Processing SVG...')
            : isHeic
              ? (locale === 'es' ? 'Decodificando HEIC...' : 'Decoding HEIC...')
              : (locale === 'es' ? 'Decodificando BMP...' : 'Decoding BMP...'),
          originalName: file.name,
          originalFormat: isSvg ? 'SVG' : isHeic ? (ext === '.heif' ? 'HEIF' : 'HEIC') : 'BMP'
        });

        decodingTasks.push({
          id,
          file,
          type: isSvg ? 'svg' : isHeic ? 'heic' : 'bmp'
        });
      } else {
        const previewUrl = URL.createObjectURL(file);
        itemsToAdd.push({
          id,
          file,
          previewUrl,
          targetFormat: batchFormat,
          bgColor: batchBgColor,
          isProcessing: false,
          isProcessed: false,
          resultBlob: null,
          resultSize: null,
          error: null,
          originalName: file.name,
          originalFormat: getSourceFormat(file)
        });
      }
    }

    if (itemsToAdd.length > 0) {
      setImages(prev => [...prev, ...itemsToAdd]);
    }
    
    setIsImagesLoading(false);

    // Procesar asíncronamente las tareas de decodificación en cola secuencial
    for (const task of decodingTasks) {
      try {
        let decodedBlob: Blob;
        if (task.type === 'svg') {
          decodedBlob = await rasterizeSVG(task.file);
          // Yield al event loop para que el navegador respire e interaccione entre archivos
          await new Promise(resolve => requestAnimationFrame(resolve));
        } else if (task.type === 'bmp') {
          decodedBlob = await decodeBMP(task.file);
          // Yield al event loop
          await new Promise(resolve => setTimeout(resolve, 0));
        } else {
          decodedBlob = await decodeHEIC(task.file);
          // Yield al event loop
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
        console.error(`Error processing task ${task.id}:`, err);
        const errMsg = locale === 'es' 
          ? 'Error al procesar el archivo. Formato inválido o corrupto.' 
          : 'Failed to process file. Invalid or corrupt format.';
        
        showToast(
          locale === 'es' 
            ? `No se pudo procesar ${task.file.name}` 
            : `Could not process ${task.file.name}`, 
          'error'
        );

        setImages(prev => prev.map(img => {
          if (img.id === task.id) {
            return {
              ...img,
              isDecoding: false,
              decodingMessage: undefined,
              error: errMsg
            };
          }
          return img;
        }));
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = ''; // Resetear
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => {
      const target = prev.find(img => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const handleClearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    showToast(
      locale === 'es' ? 'Listado limpio.' : 'List cleared.',
      'success'
    );
  };

  // Convertir imágenes (procesamiento secuencial para evitar OOM)
  const handleConvert = () => {
    if (images.length === 0) return;
    if (vipsState !== 'loaded') {
      showToast(
        locale === 'es' ? 'Espera a que cargue el motor de procesamiento.' : 'Please wait for the processing engine to load.',
        'error'
      );
      return;
    }

    // Construir la cola con los datos actuales de cada imagen
    const queue = images.map(img => ({
      id: img.id,
      file: img.file,
      targetFormat: img.targetFormat,
      bgColor: img.bgColor,
      icoSizes: img.targetFormat === 'ico' ? icoSizes : undefined
    }));

    // Resetear estados de todas las imágenes (sin marcar isProcessing aún)
    setImages(prev => prev.map(img => ({
      ...img,
      isProcessing: false,
      isProcessed: false,
      resultBlob: null,
      resultSize: null,
      error: null
    })));

    // Reciclar el worker para liberar la memoria WASM acumulada de conversiones previas.
    // La memoria lineal de WebAssembly solo crece, nunca encoge: terminar el worker
    // y crear uno nuevo es la única forma de recuperar esa memoria.
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    initializeWorker();

    // Iniciar la cola secuencial
    processingQueueRef.current = queue;
    setGlobalProcessing(true);
    processNextInQueue();
  };

  // Reintentar conversión de una imagen individual
  const handleRetry = (id: string) => {
    const img = images.find(i => i.id === id);
    if (!img || vipsState !== 'loaded') return;

    // Resetear solo esta imagen y enviarla al worker directamente
    setImages(prev => prev.map(i =>
      i.id === id
        ? { ...i, isProcessing: true, isProcessed: false, error: null, resultBlob: null, resultSize: null }
        : i
    ));

    const finalFormatForWorker = img.targetFormat === 'pdf' ? 'png' : img.targetFormat;

    workerRef.current?.postMessage({
      action: 'process',
      id: img.id,
      file: img.file,
      targetFormat: finalFormatForWorker,
      bgColor: img.bgColor,
      icoSizes: img.targetFormat === 'ico' ? icoSizes : undefined
    });
  };

  // Descarga de imagen individual
  const handleDownloadSingle = (item: ConverterImageItem) => {
    if (!item.resultBlob) return;
    const extension = item.targetFormat;
    const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
    const fileName = `Convertido_Pixetide_com_${baseName}.${extension}`;

    const url = URL.createObjectURL(item.resultBlob);
    const a = document.createElement('a');
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
  };

  // Descarga de todas las imágenes
  const handleDownloadAll = async () => {
    const processedImages = images.filter(img => img.resultBlob);
    if (processedImages.length === 0) return;

    if (processedImages.length === 1) {
      handleDownloadSingle(processedImages[0]);
    } else {
      const zip = new JSZip();
      processedImages.forEach(img => {
        const ext = img.targetFormat;
        const baseName = img.file.name.substring(0, img.file.name.lastIndexOf('.')) || img.file.name;
        const fileName = `Convertido_Pixetide_com_${baseName}.${ext}`;
        zip.file(fileName, img.resultBlob!);
      });

      try {
        const zipContent = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipContent);
        
        const firstBaseName = images[0].file.name.substring(0, images[0].file.name.lastIndexOf('.')) || 'imagenes';
        const zipName = `Convertido_Pixetide_com_${firstBaseName}.zip`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = zipName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast(
          locale === 'es' 
            ? `Descargadas ${processedImages.length} imágenes en archivo ZIP.` 
            : `Successfully downloaded ${processedImages.length} images in a ZIP file.`,
          'success'
        );
      } catch (err) {
        console.error('Zip generation error:', err);
        showToast(
          locale === 'es' ? 'Error al generar el archivo ZIP.' : 'Error generating ZIP file.',
          'error'
        );
      }
    }
  };

  const formatSize = (bytes: number | null): string => {
    if (bytes === null) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const truncateFilename = (name: string, maxLen = 20): string => {
    const dotIndex = name.lastIndexOf('.');
    if (dotIndex === -1) return name.length > maxLen ? `${name.substring(0, maxLen)}...` : name;
    const ext = name.substring(dotIndex);
    const base = name.substring(0, dotIndex);
    if (base.length > maxLen) {
      return `${base.substring(0, maxLen)}...${ext}`;
    }
    return name;
  };

  const getSourceFormat = (file: File): string => {
    const dotIndex = file.name.lastIndexOf('.');
    if (dotIndex !== -1) {
      return file.name.substring(dotIndex + 1).toUpperCase();
    }
    return file.type.split('/')[1]?.toUpperCase() || 'IMG';
  };

  const isSourceTransparentCapable = (file: File): boolean => {
    const name = file.name.toLowerCase();
    const dotIndex = name.lastIndexOf('.');
    const ext = dotIndex !== -1 ? name.substring(dotIndex) : '';
    const type = file.type;
    return (
      ext === '.png' ||
      ext === '.webp' ||
      ext === '.gif' ||
      type === 'image/png' ||
      type === 'image/webp' ||
      type === 'image/gif'
    );
  };

  // Modificar propiedades individuales
  const updateImageOption = (id: string, updates: Partial<ConverterImageItem>) => {
    setImages(prev => prev.map(img => {
      if (img.id === id) {
        return { ...img, ...updates, isProcessed: false, resultBlob: null, resultSize: null };
      }
      return img;
    }));
  };


  // Renderizar controles de la barra lateral
  const renderControls = () => {
    return (
      <div className="space-y-8 flex-1">
        {/* Selector de formato global */}
        <div className="space-y-3.5">
          <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
            {locale === 'es' ? 'Formato de Salida Global' : 'Global Output Format'}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['webp', 'png', 'jpg', 'gif', 'avif', 'tiff', 'bmp', 'ico', 'pdf'] as const).map((fmt) => {
              const isActive = batchFormat === fmt;
              return (
                <button
                  key={fmt}
                  onClick={() => handleGlobalFormatChange(fmt)}
                  className={cn(
                    "h-10 rounded-xl border text-xs font-mono font-bold uppercase transition-all flex items-center justify-center cursor-pointer",
                    isActive
                      ? "border-[#a855f7] bg-purple-50/40 text-[#a855f7]"
                      : "border-border hover:bg-slate-50 text-muted-foreground"
                  )}
                >
                  {fmt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ajustes de fondo para transparencia global si JPG o BMP */}
        {(batchFormat === 'jpg' || batchFormat === 'bmp') && (
          <div className="space-y-3.5 p-4 rounded-xl border border-amber-200/50 bg-amber-50/30 space-y-3">
            <div className="flex gap-2 text-amber-700">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-normal font-medium">
                {t('conv.bgColorWarning')}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-800 block">
                {t('conv.bgColor')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleGlobalBgColorChange('white')}
                  className={cn(
                    "h-8 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    batchBgColor === 'white'
                      ? "border-[#a855f7] bg-white text-[#a855f7] font-bold shadow-sm"
                      : "border-border bg-white text-muted-foreground hover:bg-slate-50"
                  )}
                >
                  <span className="size-3 rounded-full bg-white border border-border shadow-sm"></span>
                  <span>{t('conv.white')}</span>
                </button>
                <button
                  onClick={() => handleGlobalBgColorChange('black')}
                  className={cn(
                    "h-8 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    batchBgColor === 'black'
                      ? "border-[#a855f7] bg-white text-[#a855f7] font-bold shadow-sm"
                      : "border-border bg-white text-muted-foreground hover:bg-slate-50"
                  )}
                >
                  <span className="size-3 rounded-full bg-black border border-border/80"></span>
                  <span>{t('conv.black')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ajustes para formato ICO (Selección de resoluciones) */}
        {batchFormat === 'ico' && (
          <div className="space-y-3.5 p-4 rounded-xl border border-border bg-slate-50/40">
            <div className="flex gap-2 text-slate-600">
              <span className="text-[9px] font-mono font-bold uppercase bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded-md self-start shrink-0">ICO</span>
              <p className="text-[10px] leading-normal font-medium">
                {locale === 'es' 
                  ? 'Selecciona los tamaños a incluir en el archivo de icono final:' 
                  : 'Select the sizes to include in the final icon file:'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {([16, 32, 48, 64, 128, 256] as const).map((sz) => {
                const isChecked = icoSizes.includes(sz);
                return (
                  <label
                    key={sz}
                    className={cn(
                      "flex items-center gap-2 h-8 px-2.5 rounded-lg border text-xs font-semibold select-none cursor-pointer transition-all bg-white",
                      isChecked
                        ? "border-[#a855f7]/60 text-primary font-bold shadow-xs bg-[#a855f7]/5"
                        : "border-border text-muted-foreground hover:bg-slate-50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setIcoSizes(prev => {
                          const updated = prev.includes(sz)
                            ? prev.filter(x => x !== sz)
                            : [...prev, sz].sort((a, b) => a - b);
                          if (updated.length === 0) {
                            showToast(
                              locale === 'es' 
                                ? 'Debes seleccionar al menos un tamaño para el ICO.' 
                                : 'You must select at least one size for the ICO.',
                              'error'
                            );
                            return prev;
                          }
                          return updated;
                        });
                        setImages(prev => prev.map(img => ({
                          ...img,
                          isProcessed: false,
                          resultBlob: null,
                          resultSize: null
                        })));
                      }}
                      className="accent-[#a855f7] cursor-pointer size-3.5 rounded border-border"
                    />
                    <span>{sz} x {sz}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
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

      {/* ─── COLUMNA IZQUIERDA: VISUALIZADOR / LISTA ─── */}
      <div className="flex-1 flex flex-col min-w-0 gap-6 lg:h-full">
        
        {/* Cabecera del Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl md:text-3xl text-primary font-medium tracking-tight">
              {locale === 'es' ? 'Convertidor de Formatos' : 'Image Format Converter'}
            </h2>
            <p className="text-xs text-muted-foreground leading-normal max-w-xl">
              {locale === 'es' 
                ? 'Transforma el formato de tus fotos (JPG, PNG, WebP, GIF, SVG, HEIC, BMP, TIFF) de forma masiva o individual de manera 100% privada.'
                : 'Convert the format of your photos (JPG, PNG, WebP, GIF, SVG, HEIC, BMP, TIFF) in bulk or individually. 100% private.'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={handleClearAll}
              disabled={images.length === 0 || globalProcessing}
              className="h-9 px-4 rounded-full border border-border hover:bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="size-3.5" />
              <span>{t('conv.clearAll')}</span>
            </button>
            <button 
              onClick={handleTriggerUpload}
              disabled={globalProcessing}
              className="h-9 px-4 rounded-full bg-primary hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Upload className="size-3.5" />
              <span>{t('conv.uploadNew')}</span>
            </button>
          </div>
        </div>

        {/* WORKSPACE AREA */}
        {vipsState === 'error' ? (
          <div className="flex-1 min-h-[300px] border border-border/80 rounded-2xl flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="corner-decorator corner-tl"></div>
            <div className="corner-decorator corner-tr"></div>
            <div className="corner-decorator corner-bl"></div>
            <div className="corner-decorator corner-br"></div>
            <div className="max-w-md mx-auto flex flex-col items-center gap-4">
              <h3 className="font-serif text-lg font-medium text-red-600">
                {locale === 'es' ? 'Error del Motor' : 'Engine Error'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {locale === 'es' 
                  ? 'No se pudo cargar el motor de procesamiento local de imágenes.' 
                  : 'Failed to load the local image processing engine.'}
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
          <div className="flex-1 min-h-[300px] border border-border/80 rounded-2xl flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-slate-50/40">
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
        ) : images.length === 0 ? (
          <div 
            onClick={handleTriggerUpload}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex-1 min-h-[300px] dropzone-grid border border-border/80 rounded-2xl flex items-center justify-center p-8 text-center relative overflow-hidden transition-colors group cursor-pointer"
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
                    {locale === 'es' ? 'Arrastra tus imágenes aquí o haz clic' : 'Drag your images here or click'}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    {locale === 'es' 
                      ? 'Procesamiento 100% local en tu navegador. Máximo 20MB por archivo.'
                      : '100% local processing in your browser. Maximum 20MB per file.'}
                  </p>
                </div>
                
                {/* Formats Badges */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  {['PNG', 'JPG', 'WEBP', 'GIF', 'SVG', 'HEIC', 'BMP', 'TIFF'].map((fmt) => (
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
          <div className="flex-1 bg-white border border-border/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-auto max-h-[60vh] lg:max-h-[65vh]">
            <div className="image-list-container">
              {/* Encabezado en Desktop */}
              <div className="hidden md:grid image-list-header pb-3 mb-2">
                <span>{locale === 'es' ? 'Archivo' : 'File'}</span>
                <span>{locale === 'es' ? 'Formato' : 'Format'}</span>
                <span>{t('conv.targetFormat')}</span>
                <span>{t('conv.bgColor')}</span>
                <span>{locale === 'es' ? 'Estado' : 'Status'}</span>
                <span className="text-right"></span>
              </div>

              {/* Lista de Filas */}
              {images.map((item) => {
                const isJpgTarget = item.targetFormat === 'jpg' || item.targetFormat === 'bmp';

                const showBgColor = isJpgTarget && isSourceTransparentCapable(item.file);

                return (
                  <div 
                    key={item.id}
                    className={cn(
                      "image-row",
                      item.isProcessing && "processing",
                      item.isProcessed && "success",
                      item.error && "error"
                    )}
                  >
                    {item.isDecoding ? (
                      <>
                        {/* Thumbnail vacío + Nombre en decodificación */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-10 rounded-lg border border-border/85 shrink-0 bg-slate-100 flex items-center justify-center">
                            <ImageIcon className="size-5 text-muted-foreground/30 animate-pulse" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-primary truncate" title={item.file.name}>
                              {truncateFilename(item.file.name)}
                            </p>
                            <p className="text-[10px] text-muted-foreground/80 md:hidden font-mono mt-0.5 animate-pulse">
                              {locale === 'es' ? 'Cargando...' : 'Loading...'}
                            </p>
                          </div>
                        </div>

                        {/* Loader compacto de decodificación (Col-span-4 en desktop) */}
                        <div className="md:col-span-4 flex items-center justify-center md:justify-start w-full">
                          <div className="w-full max-w-xs md:pl-6">
                            <LoaderPrime message={item.decodingMessage} compact={true} />
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleRemoveImage(item.id)}
                            disabled={globalProcessing}
                            className="p-2 text-muted-foreground/80 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title={locale === 'es' ? 'Eliminar de la lista' : 'Remove from list'}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Thumbnail + Nombre */}
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={item.previewUrl} 
                            alt={item.originalName || item.file.name}
                            className="size-10 rounded-lg object-cover border border-border/85 shrink-0 bg-slate-50"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-primary truncate" title={item.originalName || item.file.name}>
                              {truncateFilename(item.originalName || item.file.name)}
                            </p>
                            <p className="text-[10px] text-muted-foreground/80 md:hidden font-mono mt-0.5">
                              {item.originalFormat || getSourceFormat(item.file)}
                            </p>
                          </div>
                        </div>

                        {/* Formato Original (Desktop) */}
                        <span className="hidden md:inline text-xs font-mono text-muted-foreground">
                          {item.originalFormat || getSourceFormat(item.file)}
                        </span>

                        {/* Formato de Destino */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground/60 md:hidden">
                            {t('conv.targetFormat')}
                          </span>
                          <select
                            value={item.targetFormat}
                            disabled={globalProcessing}
                            onChange={(e) => updateImageOption(item.id, { targetFormat: e.target.value as any })}
                            className="h-8 border border-border bg-white rounded-lg text-xs font-semibold text-primary px-2 outline-none focus:border-[#a855f7] cursor-pointer"
                          >
                            <option value="webp">WEBP</option>
                            <option value="png">PNG</option>
                            <option value="jpg">JPG</option>
                            <option value="gif">GIF</option>
                            <option value="avif">AVIF</option>
                            <option value="tiff">TIFF</option>
                            <option value="bmp">BMP</option>
                            <option value="ico">ICO</option>
                            <option value="pdf">PDF</option>
                          </select>
                        </div>

                        {/* Color de fondo si es JPG */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground/60 md:hidden">
                            {t('conv.bgColor')}
                          </span>
                          {showBgColor ? (
                            <select
                              value={item.bgColor}
                              disabled={globalProcessing}
                              onChange={(e) => updateImageOption(item.id, { bgColor: e.target.value as any })}
                              className="h-8 border border-border bg-white rounded-lg text-xs font-semibold text-primary px-2 outline-none focus:border-[#a855f7] cursor-pointer"
                            >
                              <option value="white">{t('conv.white')}</option>
                              <option value="black">{t('conv.black')}</option>
                            </select>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">-</span>
                          )}
                        </div>

                        {/* Estado / Tamaño Resultante */}
                        <div className="flex items-center gap-2">
                          {item.isProcessing ? (
                            <span className="text-xs text-primary font-semibold flex items-center gap-1">
                              <RefreshCw className="size-3 animate-spin" />
                              <span className="text-[10px] uppercase font-mono tracking-wider">{t('conv.converting')}</span>
                            </span>
                          ) : item.isProcessed ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="size-3 shrink-0" />
                                <span className="text-[10px] uppercase font-mono tracking-wider">{t('conv.statusSuccess')}</span>
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground leading-none">
                                {formatSize(item.resultSize)}
                              </span>
                            </div>
                          ) : item.error ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-red-500 font-semibold flex items-center gap-1" title={item.error}>
                                <AlertTriangle className="size-3 shrink-0" />
                                <span className="text-[10px] uppercase font-mono tracking-wider">{t('conv.statusError')}</span>
                              </span>
                              <button
                                onClick={() => handleRetry(item.id)}
                                disabled={globalProcessing || vipsState !== 'loaded'}
                                className="text-[10px] font-semibold text-[#a855f7] hover:text-purple-700 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <RefreshCw className="size-3" />
                                <span className="uppercase font-mono tracking-wider">
                                  {locale === 'es' ? 'Reintentar' : 'Retry'}
                                </span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground/60">{t('conv.statusPending')}</span>
                          )}
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center justify-end gap-2.5">
                          {item.resultBlob && !globalProcessing && (
                            <button
                              onClick={() => handleDownloadSingle(item)}
                              className="p-2 text-[#a855f7] hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title={t('conv.download')}
                            >
                              <Download className="size-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveImage(item.id)}
                            disabled={globalProcessing}
                            className="p-2 text-muted-foreground/80 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title={locale === 'es' ? 'Eliminar de la lista' : 'Remove from list'}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PIE DE PÁGINA: GUÍA Y RECOMENDACIÓN */}
        <div className="flex flex-col md:flex-row items-center gap-4 select-none w-full">
          {/* Tarjeta 1: Guía de uso */}
          <div className="flex-1 w-full bg-slate-50/60 hover:bg-slate-50/80 border border-border/80 hover:border-[#a855f7]/30 p-5 rounded-2xl transition-all cursor-pointer group flex justify-between items-center relative overflow-hidden hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)] hover:-translate-y-0.5 active:translate-y-0 duration-300">
            {/* Destello de gradiente morado en hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/[0.005] to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 bg-[#a855f7]/[0.02] rounded-full pointer-events-none"></div>
            
            <div className="space-y-1.5 z-10">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <HelpCircle className="size-3 text-muted-foreground/80" />
                {locale === 'es' ? 'Guía del usuario' : 'User guide'}
              </span>
              <p className="text-sm font-serif text-primary font-medium">
                {locale === 'es' ? '¿Cómo convertir imágenes a WebP o AVIF?' : 'How to convert images to WebP or AVIF?'}
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
            {locale === 'es' ? 'Ajustes de Conversión' : 'Conversion Settings'}
          </h3>
          {renderControls()}
        </div>

        {/* Panel inferior fijo con botones de acción (Estilo Pixetide Premium) */}
        <div className="p-6 border-t border-border/80 bg-slate-50/60 backdrop-blur-sm space-y-3 shrink-0">
          <button
            onClick={handleConvert}
            disabled={images.length === 0 || globalProcessing || images.some(img => img.isProcessing) || vipsState !== 'loaded'}
            className="w-full py-3 px-4 bg-primary hover:bg-neutral-800 disabled:hover:bg-primary text-white rounded-xl font-semibold text-xs uppercase tracking-[0.15em] transition-all shadow-sm active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {globalProcessing ? (
              <>
                <RefreshCw className="size-3.5 animate-spin" />
                <span>{t('conv.converting')}</span>
              </>
            ) : (
              <>
                <ArrowLeftRight className="size-3.5" />
                <span>{t('conv.convert')}</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadAll}
            disabled={globalProcessing || !images.some(img => img.resultBlob)}
            className="w-full py-3 px-4 bg-[#a855f7] hover:bg-purple-600 disabled:hover:bg-[#a855f7] text-white rounded-xl font-semibold text-xs uppercase tracking-[0.15em] transition-all shadow-sm active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="size-3.5" />
            <span>
              {images.filter(img => img.resultBlob).length > 1
                ? t('conv.downloadAllZip')
                : t('conv.download')}
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
          <span>{locale === 'es' ? 'Ajustes' : 'Ajustes'}</span>
        </button>

        {/* Separador vertical interno */}
        <div className="h-8 w-[1px] bg-border/60 pointer-events-none mx-2 shrink-0"></div>

        {/* Tab 2: Botón de Acción Dinámico (Convertir/Descargar) */}
        <div className="flex-1 flex items-center shrink-0">
          {showDownloadButton ? (
            <button
              onClick={handleDownloadAll}
              disabled={globalProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-semibold uppercase tracking-[0.15em] transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-sm active:scale-98"
            >
              <Download className="size-4" />
              <span>
                {images.filter(img => img.resultBlob).length > 1
                  ? t('conv.downloadAllZip')
                  : t('conv.download')}
              </span>
            </button>
          ) : (
            <button
              onClick={handleConvert}
              disabled={images.length === 0 || globalProcessing || images.some(img => img.isProcessing) || vipsState !== 'loaded'}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-[0.15em] transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-sm active:scale-98"
            >
              {globalProcessing ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  <span>{t('conv.converting')}</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight className="size-4" />
                  <span>{t('conv.convert')}</span>
                </>
              )}
            </button>
          )}
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
              {locale === 'es' ? 'Ajustes de Conversión' : 'Conversion Settings'}
            </h3>
            {renderControls()}
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
};
