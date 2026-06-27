import React, { useRef, useEffect, useState, TouchEvent as ReactTouchEvent } from 'react';
import { useLocale } from '../../core/i18n/useLocale';
import { Sheet, SheetContent } from '../../shared/components/ui/sheet';
import { cn } from '../../shared/utils/cn';
import { 
  Sparkles, 
  Eraser, 
  Hand, 
  Undo2, 
  Check, 
  X, 
  Sliders,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { useToast } from '../../shared/components/Errors/ToastContext';
import './MaskEditor.css';

interface MaskEditorProps {
  originalSrc: string;
  resultSrc: string;
  onSave: (newBlob: Blob) => void;
  onCancel: () => void;
}

type Mode = 'restore' | 'erase' | 'pan';

interface StrokeOperation {
  mode: 'restore' | 'erase';
  canvasBrushSize: number;
  points: { x: number, y: number }[];
}

export const MaskEditor: React.FC<MaskEditorProps> = ({ originalSrc, resultSrc, onSave, onCancel }) => {
  const { locale } = useLocale();
  const { showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Variables en memoria para no disparar re-renders durante el dibujo
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const resultImgRef = useRef<HTMLImageElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cappedOriginalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentStrokeRef = useRef<StrokeOperation | null>(null);
  
  // Historial para Deshacer
  const historyRef = useRef<StrokeOperation[]>([]);
  const historyStepRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);

  // Estados UI
  const [mode, setMode] = useState<Mode>('restore');
  const [brushSize, setBrushSize] = useState<number>(30);
  const [isReady, setIsReady] = useState(false);
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);
  
  // Zoom y Paneo
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setZoom(prev => {
      const nextZoom = Math.min(prev * 1.25, 8.0);
      const ratio = nextZoom / prev;
      setPan(p => ({ x: p.x * ratio, y: p.y * ratio }));
      return nextZoom;
    });
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const nextZoom = Math.max(prev / 1.25, 0.1);
      const ratio = nextZoom / prev;
      setPan(p => ({ x: p.x * ratio, y: p.y * ratio }));
      return nextZoom;
    });
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault(); // Evitar scroll de la página

    const container = containerRef.current;
    if (!container) return;

    // Obtener la posición del mouse respecto al contenedor del workspace
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calcular el nuevo zoom
    const zoomStep = 1.15;
    const isZoomIn = e.deltaY < 0;
    const currentZoom = zoom;
    let newZoom = isZoomIn ? currentZoom * zoomStep : currentZoom / zoomStep;
    
    // Límites de zoom
    newZoom = Math.max(0.1, Math.min(newZoom, 8.0));

    // Si el zoom no cambió (debido a los límites), no hacemos nada
    if (newZoom === currentZoom) return;

    // Calcular la nueva posición de pan para que el punto bajo el cursor quede en el mismo lugar
    const ratio = newZoom / currentZoom;
    const newPanX = (mouseX - centerX) - (mouseX - centerX - pan.x) * ratio;
    const newPanY = (mouseY - centerY) - (mouseY - centerY - pan.y) * ratio;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };
  
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false);
  const [isMiddlePan, setIsMiddlePan] = useState(false);
  const lastPos = useRef<{ x: number, y: number, rawX: number, rawY: number } | null>(null);
  const renderFrameId = useRef<number>(0);

  // Helper para limitar las dimensiones máximas del canvas de edición (ej. a 2048px)
  const getCappedDimensions = (w: number, h: number, maxDim = 2048) => {
    if (w <= maxDim && h <= maxDim) return { width: w, height: h };
    const ratio = w / h;
    if (w > h) {
      return { width: maxDim, height: Math.round(maxDim / ratio) };
    } else {
      return { width: Math.round(maxDim * ratio), height: maxDim };
    }
  };

  // 1. Inicializar las imágenes y el canvas oculto de máscara
  useEffect(() => {
    let active = true;

    const loadImages = async () => {
      const origImg = new Image();
      const resImg = new Image();
      
      const loadImg = (img: HTMLImageElement, src: string) => new Promise<void>((resolve, reject) => {
        if (!src.startsWith('blob:')) {
          img.crossOrigin = "anonymous";
        }
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image from source: ${src}`));
        img.src = src;
      });

      try {
        await Promise.all([loadImg(origImg, originalSrc), loadImg(resImg, resultSrc)]);
        if (!active) return;

        originalImgRef.current = origImg;
        resultImgRef.current = resImg;
        
        // Calcular dimensiones del canvas de edición (interactivo, limitado a 2048px)
        const capped = getCappedDimensions(origImg.width, origImg.height, 2048);

        // Pre-renderizar la imagen original a resolución limitada para optimizar FPS en renderDisplay
        const cappedOriginalCanvas = document.createElement('canvas');
        cappedOriginalCanvas.width = capped.width;
        cappedOriginalCanvas.height = capped.height;
        const cappedOriginalCtx = cappedOriginalCanvas.getContext('2d');
        if (cappedOriginalCtx) {
          cappedOriginalCtx.drawImage(origImg, 0, 0, capped.width, capped.height);
        }
        cappedOriginalCanvasRef.current = cappedOriginalCanvas;

        // Configurar canvas de máscara oculto a resolución limitada
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = capped.width;
        maskCanvas.height = capped.height;
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
        if (maskCtx) {
          // Dibujar la máscara inicial de la IA escalada
          maskCtx.drawImage(resImg, 0, 0, capped.width, capped.height);
        }
        maskCanvasRef.current = maskCanvas;

        setIsReady(true);
      } catch (err) {
        console.error("Error cargando imágenes para edición", err);
        showToast(
          locale === 'es'
            ? 'No se pudieron cargar las imágenes locales para retoque. Reinténtalo.'
            : 'Could not load local images for retouching. Please try again.',
          'error'
        );
        onCancel();
      }
    };

    loadImages();

    return () => { active = false; cancelAnimationFrame(renderFrameId.current); };
  }, [originalSrc, resultSrc]);

  // 1.5 Funciones del Sistema Deshacer (Undo) Vectorial
  const drawOperationOnCanvas = (canvas: HTMLCanvasElement, op: StrokeOperation, scaleFactor: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.lineWidth = op.canvasBrushSize * scaleFactor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (op.mode === 'restore') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else if (op.mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    }

    ctx.beginPath();
    if (op.points.length > 0) {
      ctx.moveTo(op.points[0].x * scaleFactor, op.points[0].y * scaleFactor);
      for (let i = 1; i < op.points.length; i++) {
        ctx.lineTo(op.points[i].x * scaleFactor, op.points[i].y * scaleFactor);
      }
    }
    ctx.stroke();
    ctx.restore();
  };

  const saveHistoryState = (operation: StrokeOperation) => {
    // Si estábamos en un paso anterior y dibujamos, cortamos el futuro
    if (historyStepRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
    }
    
    historyRef.current.push(operation);
    historyStepRef.current++;
    setCanUndo(true);
  };

  const handleUndo = () => {
    if (historyStepRef.current < 0 || !maskCanvasRef.current || !resultImgRef.current) return;
    
    historyStepRef.current--;
    
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Re-dibujar la máscara inicial generada por la IA
      ctx.drawImage(resultImgRef.current, 0, 0, canvas.width, canvas.height);
      
      // Aplicar operaciones del historial vectorialmente hasta el paso actual
      for (let i = 0; i <= historyStepRef.current; i++) {
        drawOperationOnCanvas(canvas, historyRef.current[i], 1);
      }
    }
    
    setCanUndo(historyStepRef.current >= 0);
    
    // Repintar display
    cancelAnimationFrame(renderFrameId.current);
    renderFrameId.current = requestAnimationFrame(renderDisplay);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. Loop de renderizado para el canvas visible
  const renderDisplay = () => {
    const dCanvas = displayCanvasRef.current;
    const mCanvas = maskCanvasRef.current;
    const oImg = originalImgRef.current;

    if (!dCanvas || !mCanvas || !oImg || !cappedOriginalCanvasRef.current) return;

    // Ajustar dimensiones del canvas visible a la resolución limitada
    const capped = getCappedDimensions(oImg.width, oImg.height, 2048);
    if (dCanvas.width !== capped.width) {
      dCanvas.width = capped.width;
      dCanvas.height = capped.height;
    }

    const ctx = dCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);
    
    // Dibujar la imagen original pre-renderizada (súper rápido, sin redimensionamiento GPU a 60 FPS)
    ctx.drawImage(cappedOriginalCanvasRef.current, 0, 0);
    
    // Aplicar la máscara (Destination-In mantiene los píxeles originales solo donde la máscara tiene opacidad)
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mCanvas, 0, 0);
    
    // Restaurar modo normal
    ctx.globalCompositeOperation = 'source-over';
  };

  useEffect(() => {
    if (isReady) {
      renderDisplay();
    }
  }, [isReady]);

  // 3. Manejo del Pincel y Paneo
  const getCoordinates = (clientX: number, clientY: number) => {
    const canvas = displayCanvasRef.current;
    if (!canvas || !originalImgRef.current) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (clientX: number, clientY: number) => {
    isDrawing.current = true;
    hasDrawn.current = false;
    const coords = getCoordinates(clientX, clientY);
    if (!coords) return;
    
    lastPos.current = { ...coords, rawX: clientX, rawY: clientY };
    
    if (mode !== 'pan') {
      const canvas = displayCanvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        
        // Inicializar trazo vectorial actual (sólo para restaurar o borrar)
        currentStrokeRef.current = {
          mode,
          canvasBrushSize: brushSize * scaleX,
          points: [coords]
        };
      }
      drawStroke(clientX, clientY); // Pinta un punto inicial
    }
  };

  const drawStroke = (clientX: number, clientY: number) => {
    if (!isDrawing.current || !lastPos.current || !maskCanvasRef.current) return;

    const coords = getCoordinates(clientX, clientY);
    if (!coords) return;

    // Agregar punto al trazo vectorial actual
    if (currentStrokeRef.current) {
      currentStrokeRef.current.points.push(coords);
    }

    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    // Calcular el tamaño del pincel escalado a píxeles del canvas para que corresponda a píxeles de pantalla
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;

    ctx.save();
    ctx.lineWidth = brushSize * scaleX;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (mode === 'restore') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else if (mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    }

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.restore();

    lastPos.current = { ...coords, rawX: clientX, rawY: clientY };
    hasDrawn.current = true;

    // Repintar display de forma optimizada
    cancelAnimationFrame(renderFrameId.current);
    renderFrameId.current = requestAnimationFrame(renderDisplay);
  };

  const stopDrawing = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      
      if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
        saveHistoryState(currentStrokeRef.current);
      }
      currentStrokeRef.current = null;
    }
  };

  // Soporte Táctil Móvil
  const onTouchStart = (e: ReactTouchEvent) => {
    if (e.touches.length === 1) {
      startDrawing(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      isDrawing.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      lastPos.current = { x: 0, y: 0, rawX: midX, rawY: midY };
    }
  };

  const onTouchMove = (e: ReactTouchEvent) => {
    if (e.touches.length === 1 && mode !== 'pan') {
      drawStroke(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2 || (e.touches.length === 1 && mode === 'pan')) {
      if (!lastPos.current) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastPos.current.rawX;
      const deltaY = touch.clientY - lastPos.current.rawY;
      setPan(p => ({ x: p.x + deltaX, y: p.y + deltaY }));
      lastPos.current = { ...lastPos.current, rawX: touch.clientX, rawY: touch.clientY };
    }
  };

  const onTouchEnd = () => {
    stopDrawing();
  };

  // Eventos de Ratón con soporte para Clic Central e izquierdo en modo mover
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) { // Rueda central
      e.preventDefault();
      setIsMiddlePan(true);
      lastPos.current = { x: 0, y: 0, rawX: e.clientX, rawY: e.clientY };
      return;
    }
    if (mode === 'pan') {
      e.preventDefault();
      isDrawing.current = true;
      lastPos.current = { x: 0, y: 0, rawX: e.clientX, rawY: e.clientY };
      return;
    }
    startDrawing(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMiddlePan || (mode === 'pan' && isDrawing.current && lastPos.current)) {
      if (!lastPos.current) return;
      const deltaX = e.clientX - lastPos.current.rawX;
      const deltaY = e.clientY - lastPos.current.rawY;
      setPan(p => ({ x: p.x + deltaX, y: p.y + deltaY }));
      lastPos.current = { ...lastPos.current, rawX: e.clientX, rawY: e.clientY };
      return;
    }
    if (mode !== 'pan') {
      drawStroke(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 1 || isMiddlePan) {
      setIsMiddlePan(false);
      lastPos.current = null;
      return;
    }
    stopDrawing();
  };

  // Generador de Cursor Dinámico SVG con centrado de subpixel
  const getCursor = () => {
    if (isMiddlePan) return 'grabbing';
    if (mode === 'pan') return 'grab';
    
    const size = Math.round(brushSize);
    // Para tamaños pequeños/medianos usamos padding amplio (20px). Para grandes lo reducimos para no exceder 128px.
    let padding = 10;
    if (size > 100) {
      padding = 2;
    }
    const svgSize = size % 2 === 0 ? size + padding * 2 : size + padding * 2 + 1;
    const center = svgSize / 2;
    // Ajustar radios para que el contorno visual exterior sea de "size + 2"px en pantalla, cubriendo el antialiasing del canvas
    const rOuter = size / 2 + 0.5;
    const rInner = Math.max(0.5, size / 2 - 1.0);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}"><circle cx="${center}" cy="${center}" r="${rOuter}" fill="rgba(255,255,255,0.2)" stroke="black" stroke-width="1"/><circle cx="${center}" cy="${center}" r="${rInner}" fill="none" stroke="white" stroke-width="1"/></svg>`;
    const b64 = btoa(svg);
    return `url('data:image/svg+xml;base64,${b64}') ${center} ${center}, crosshair`;
  };

  // 4. Guardar resultado reconstruido en alta resolución
  const handleSave = async () => {
    if (!displayCanvasRef.current || !originalImgRef.current || !resultImgRef.current) return;
    
    // Crear canvas temporal para la imagen resultante a la resolución original alta
    const highResCanvas = document.createElement('canvas');
    highResCanvas.width = originalImgRef.current.width;
    highResCanvas.height = originalImgRef.current.height;
    
    const highResCtx = highResCanvas.getContext('2d');
    if (!highResCtx) return;
    
    // 1. Dibujar la imagen original a resolución completa
    highResCtx.drawImage(originalImgRef.current, 0, 0);
    
    // 2. Crear un canvas temporal para la máscara a resolución completa
    const highResMaskCanvas = document.createElement('canvas');
    highResMaskCanvas.width = originalImgRef.current.width;
    highResMaskCanvas.height = originalImgRef.current.height;
    const highResMaskCtx = highResMaskCanvas.getContext('2d');
    
    if (highResMaskCtx) {
      // Dibujar la máscara inicial de la IA a resolución completa
      highResMaskCtx.drawImage(resultImgRef.current, 0, 0);
      
      // Aplicar operaciones del historial vectorialmente escaladas a resolución completa
      const canvas = maskCanvasRef.current;
      if (canvas) {
        // El factor de escala de la máscara editada (capped a 2048px) hacia la resolución original
        const scaleFactor = originalImgRef.current.width / canvas.width;
        for (let i = 0; i <= historyStepRef.current; i++) {
          drawOperationOnCanvas(highResMaskCanvas, historyRef.current[i], scaleFactor);
        }
      }
    }
    
    // 3. Aplicar la máscara final en alta resolución sobre la imagen en alta resolución
    highResCtx.globalCompositeOperation = 'destination-in';
    highResCtx.drawImage(highResMaskCanvas, 0, 0);
    highResCtx.globalCompositeOperation = 'source-over';
    
    // 4. Exportar a Blob a resolución original
    highResCanvas.toBlob((blob) => {
      if (blob) onSave(blob);
    }, 'image/png');
  };

  const renderBrushOptions = () => (
    <div className="space-y-6">
      {/* Botones de Modo */}
      <div className="space-y-4">
        <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
          {locale === 'es' ? 'Modo de Herramienta' : 'Tool Mode'}
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button 
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition-all cursor-pointer active:scale-95",
              mode === 'restore' 
                ? "border-[#a855f7] bg-purple-50/40 text-[#a855f7]" 
                : "border-border hover:bg-slate-50 text-muted-foreground"
            )}
            onClick={() => setMode('restore')}
          >
            <Sparkles className="size-4" />
            <span>{locale === 'es' ? 'Restaurar' : 'Restore'}</span>
          </button>
          
          <button 
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition-all cursor-pointer active:scale-95",
              mode === 'erase' 
                ? "border-[#a855f7] bg-purple-50/40 text-[#a855f7]" 
                : "border-border hover:bg-slate-50 text-muted-foreground"
            )}
            onClick={() => setMode('erase')}
          >
            <Eraser className="size-4" />
            <span>{locale === 'es' ? 'Borrar' : 'Erase'}</span>
          </button>

          <button 
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition-all cursor-pointer active:scale-95",
              mode === 'pan' 
                ? "border-[#a855f7] bg-purple-50/40 text-[#a855f7]" 
                : "border-border hover:bg-slate-50 text-muted-foreground"
            )}
            onClick={() => setMode('pan')}
          >
            <Hand className="size-4" />
            <span>{locale === 'es' ? 'Mover' : 'Pan'}</span>
          </button>

          <button 
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition-all cursor-pointer active:scale-95",
              canUndo ? "border-border hover:bg-slate-50 text-primary" : "border-border/40 text-muted-foreground/30 cursor-not-allowed opacity-50"
            )}
            onClick={handleUndo}
            disabled={!canUndo}
            title={locale === 'es' ? 'Deshacer (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
          >
            <Undo2 className="size-4" />
            <span>{locale === 'es' ? 'Deshacer' : 'Undo'}</span>
          </button>
        </div>
      </div>

      {/* Grosor de Pincel */}
      <div className="space-y-3.5 pt-4 border-t border-border/60">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
            {locale === 'es' ? 'Grosor del Pincel' : 'Brush Size'}
          </label>
          <span className="text-xs font-mono font-semibold text-primary bg-slate-100 px-2 py-0.5 rounded-md">
            {brushSize}px
          </span>
        </div>
        <div className="space-y-1">
          <input 
            type="range" 
            min="5" 
            max="120" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))} 
            className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary border border-border/80"
          />
          <div className="flex justify-between text-[9px] font-mono text-muted-foreground/60 px-0.5">
            <span>5px</span>
            <span>120px</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── VISUALIZADOR DE EDICIÓN MÁSCARA ─── */}
      <div className="flex-1 flex flex-col min-w-0 gap-6 lg:h-full">
        
        {/* Cabecera del Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl md:text-3xl text-primary font-medium tracking-tight">
              {locale === 'es' ? 'Perfeccionar Recorte' : 'Refine Image Cut'}
            </h2>
            <p className="text-xs text-muted-foreground leading-normal max-w-xl">
              {locale === 'es' 
                ? 'Usa el pincel para restaurar partes borradas o limpiar bordes. Mantén presionada la rueda central o la barra espaciadora para moverte.'
                : 'Use the brush to restore deleted areas or clean edges. Hold middle mouse button or spacebar to pan.'}
            </p>
          </div>
        </div>

        {/* Canvas de Pintura */}
        <div className="flex-1 min-h-[350px] dropzone-grid border border-border/80 rounded-2xl flex items-center justify-center p-0 relative overflow-hidden transition-colors bg-white bgrm-editor-canvas-wrapper">
          <div className="corner-decorator corner-tl"></div>
          <div className="corner-decorator corner-tr"></div>
          <div className="corner-decorator corner-bl"></div>
          <div className="corner-decorator corner-br"></div>

          <div 
            className="bgrm-editor-workspace w-full h-full flex items-center justify-center select-none animate-fade-in" 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onWheel={handleWheel}
            style={{ cursor: getCursor() }}
          >
            {!isReady && (
              <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-20">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>
            )}
            
            <canvas
              ref={displayCanvasRef}
              className="bgrm-paint-canvas max-w-full max-h-[55vh] object-contain shadow-md rounded"
              style={{ 
                display: isReady ? 'block' : 'none',
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: (mode === 'pan' || isMiddlePan) ? 'none' : 'transform 0.1s ease-out'
              }}
            />
          </div>

          {/* Controles de Zoom Flotantes */}
          {isReady && (
            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-border/80 rounded-full p-1.5 shadow-md select-none">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.1}
                className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title={locale === 'es' ? 'Alejar' : 'Zoom Out'}
              >
                <ZoomOut className="size-4" />
              </button>
              <span className="text-[10px] font-mono font-bold px-1 min-w-[38px] text-center select-none text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 8.0}
                className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title={locale === 'es' ? 'Acercar' : 'Zoom In'}
              >
                <ZoomIn className="size-4" />
              </button>
              <div className="w-[1px] h-4 bg-border/60 mx-0.5" />
              <button
                type="button"
                onClick={handleZoomReset}
                className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-slate-100 transition-all cursor-pointer"
                title={locale === 'es' ? 'Restablecer ajuste' : 'Reset Zoom'}
              >
                <Maximize2 className="size-4" />
              </button>
            </div>
          )}
        </div>

        {/* Enlaces Editoriales Informativos */}
        <div className="flex flex-col md:flex-row items-center gap-4 select-none w-full">
          <div className="flex-1 w-full bg-slate-50/60 hover:bg-slate-50/80 border border-border/80 hover:border-[#a855f7]/30 p-5 rounded-2xl transition-all cursor-pointer group flex justify-between items-center relative overflow-hidden hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)] hover:-translate-y-0.5 active:translate-y-0 duration-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/[0.005] to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 bg-[#a855f7]/[0.02] rounded-full pointer-events-none"></div>
            <div className="space-y-1 z-10">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <HelpCircle className="size-3 text-muted-foreground/80" />
                {locale === 'es' ? 'Guía del usuario' : 'User guide'}
              </span>
              <p className="text-sm font-serif text-primary font-medium">
                {locale === 'es' ? '¿Cómo funciona la remoción de fondo con Inteligencia Artificial?' : 'How does AI background removal work?'}
              </p>
            </div>
            <span className="text-primary group-hover:translate-x-1.5 transition-transform duration-300 font-bold z-10">→</span>
          </div>

          {/* Separador vertical decorativo | en desktop */}
          <div className="hidden md:flex items-center justify-center text-border/60 text-lg font-light font-sans px-1 pointer-events-none self-center">
            |
          </div>

          <div 
            onClick={() => window.location.href = locale === 'es' ? '/es/herramientas/comprimir-imagen' : '/tools/compress-image'}
            className="flex-1 w-full bg-slate-50/60 hover:bg-slate-50/80 border border-border/80 hover:border-[#a855f7]/30 p-5 rounded-2xl transition-all cursor-pointer group flex justify-between items-center relative overflow-hidden hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)] hover:-translate-y-0.5 active:translate-y-0 duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/[0.005] to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-white bg-[#a855f7] px-1.5 py-0.5 rounded-md">
                  {locale === 'es' ? 'RECOMENDADO' : 'RECOMMENDED'}
                </span>
              </div>
              <p className="text-sm font-serif text-primary font-medium">
                {locale === 'es' ? 'Comprimir peso de la imagen sin perder calidad' : 'Compress image size without losing quality'}
              </p>
            </div>
            <span className="text-primary group-hover:translate-x-1.5 transition-transform duration-300 font-bold z-10">→</span>
          </div>
        </div>
      </div>

      {/* ─── SIDEBAR ESCRITORIO CONTROLES ─── */}
      <aside className="hidden lg:flex w-full lg:w-80 shrink-0 bg-white border border-border rounded-2xl flex-col lg:h-full overflow-hidden shadow-sm">
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="font-serif text-lg font-medium text-primary border-b border-border/80 pb-4 mb-6">
            {locale === 'es' ? 'Ajustes del Pincel' : 'Brush Settings'}
          </h3>
          
          {renderBrushOptions()}
        </div>

        <div className="p-6 border-t border-border/80 bg-slate-50/60 backdrop-blur-sm space-y-3">
          <button 
            onClick={handleSave}
            className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-neutral-800 text-white font-semibold text-xs uppercase tracking-[0.15em] transition-all shadow-sm active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2"
          >
            <Check className="size-4" />
            <span>{locale === 'es' ? 'GUARDAR CAMBIOS' : 'SAVE CHANGES'}</span>
          </button>
          
          <button 
            onClick={onCancel}
            className="w-full py-3 px-4 rounded-xl border border-border bg-white hover:bg-slate-50 text-primary font-semibold text-xs uppercase tracking-[0.15em] transition-all active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2"
          >
            <X className="size-4" />
            <span>{locale === 'es' ? 'DESHACER CAMBIOS' : 'DISCARD CHANGES'}</span>
          </button>
        </div>
      </aside>

      {/* ─── DOCK FLOTANTE MÓVIL ESTANDARIZADO ─── */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-border/80 flex items-center justify-between px-4 z-40 lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.04)] gap-3 select-none">
        
        {/* Botón 1: Ajustes */}
        <button
          onClick={() => setIsMobileSettingsOpen(prev => !prev)}
          className={cn(
            "flex-1 py-2.5 px-3 rounded-xl border border-border flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer",
            isMobileSettingsOpen 
              ? "bg-slate-100 text-primary border-slate-300" 
              : "bg-white text-muted-foreground hover:text-primary"
          )}
        >
          <Sliders className="size-4" />
          <span>{locale === 'es' ? 'Ajustes' : 'Settings'}</span>
        </button>

        {/* Botón 2: Deshacer Cambios (Cancel) */}
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 px-3 rounded-xl border border-border bg-white hover:bg-slate-50 text-primary text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer text-center flex items-center justify-center gap-2 active:scale-98"
        >
          <X className="size-4" />
          <span>{locale === 'es' ? 'Deshacer' : 'Discard'}</span>
        </button>

        {/* Botón 3: Guardar Cambios */}
        <button
          onClick={handleSave}
          className="flex-1 py-2.5 px-3 rounded-xl bg-primary hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer text-center flex items-center justify-center gap-2 active:scale-98 shadow-sm"
        >
          <Check className="size-4" />
          <span>{locale === 'es' ? 'Guardar' : 'Save'}</span>
        </button>
      </div>

      {/* Drawer móvil para Ajustes del Pincel */}
      <Sheet open={isMobileSettingsOpen} onOpenChange={setIsMobileSettingsOpen}>
        <SheetContent 
          side="bottom" 
          className="p-0 bg-white rounded-t-3xl border-t border-border max-h-[70vh] overflow-y-auto flex flex-col z-50"
          showCloseButton={true}
        >
          <div className="p-6 pb-20">
            <h3 className="font-serif text-lg font-medium text-primary border-b border-border/80 pb-4 mb-6">
              {locale === 'es' ? 'Ajustes del Pincel' : 'Brush Settings'}
            </h3>
            
            {renderBrushOptions()}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
