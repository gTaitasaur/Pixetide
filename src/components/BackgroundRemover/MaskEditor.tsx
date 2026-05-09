import React, { useRef, useEffect, useState, TouchEvent as ReactTouchEvent } from 'react';
import { ImagePreviewCanvas } from '../UI/ImagePreviewCanvas/ImagePreviewCanvas';
import './MaskEditor.css';

interface MaskEditorProps {
  originalSrc: string;
  resultSrc: string;
  onSave: (newBlob: Blob) => void;
  onCancel: () => void;
}

type Mode = 'restore' | 'erase' | 'pan';

export const MaskEditor: React.FC<MaskEditorProps> = ({ originalSrc, resultSrc, onSave, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Variables en memoria para no disparar re-renders durante el dibujo
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Historial para Deshacer
  const historyRef = useRef<ImageData[]>([]);
  const historyStepRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);

  // Estados UI
  const [mode, setMode] = useState<Mode>('restore');
  const [brushSize, setBrushSize] = useState<number>(30);
  const [isReady, setIsReady] = useState(false);
  
  // Zoom y Paneo
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false);
  const isMiddlePan = useRef(false);
  const lastPos = useRef<{ x: number, y: number, rawX: number, rawY: number } | null>(null);
  const renderFrameId = useRef<number>(0);

  // 1. Inicializar las imágenes y el canvas oculto de máscara
  useEffect(() => {
    let active = true;

    const loadImages = async () => {
      const origImg = new Image();
      const resImg = new Image();
      
      const loadImg = (img: HTMLImageElement, src: string) => new Promise<void>((resolve, reject) => {
        img.crossOrigin = "anonymous";
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = src;
      });

      try {
        await Promise.all([loadImg(origImg, originalSrc), loadImg(resImg, resultSrc)]);
        if (!active) return;

        originalImgRef.current = origImg;
        
        // Configurar canvas de máscara oculto
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = origImg.width;
        maskCanvas.height = origImg.height;
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
        if (maskCtx) {
          maskCtx.drawImage(resImg, 0, 0); // La IA ya provee el alpha inicial
        }
        maskCanvasRef.current = maskCanvas;

        saveHistoryState(); // Guardar estado inicial
        setIsReady(true);
      } catch (err) {
        console.error("Error cargando imágenes para edición", err);
      }
    };

    loadImages();

    return () => { active = false; cancelAnimationFrame(renderFrameId.current); };
  }, [originalSrc, resultSrc]);

  // 1.5 Funciones del Sistema Deshacer (Undo)
  const saveHistoryState = () => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    
    // Si estamos en un paso anterior y dibujamos, cortamos el futuro
    if (historyStepRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
    }
    
    historyRef.current.push(imageData);
    
    // Limitar a 30 pasos para evitar exceso de RAM
    if (historyRef.current.length > 30) {
      historyRef.current.shift();
    } else {
      historyStepRef.current++;
    }
    setCanUndo(historyStepRef.current > 0);
  };

  const handleUndo = () => {
    if (historyStepRef.current <= 0 || !maskCanvasRef.current) return;
    historyStepRef.current--;
    const imageData = historyRef.current[historyStepRef.current];
    const ctx = maskCanvasRef.current.getContext('2d');
    ctx?.putImageData(imageData, 0, 0);
    setCanUndo(historyStepRef.current > 0);
    
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

    if (!dCanvas || !mCanvas || !oImg) return;

    // Ajustar dimensiones del canvas visible a la imagen original (CSS lo escalará)
    if (dCanvas.width !== oImg.width) {
      dCanvas.width = oImg.width;
      dCanvas.height = oImg.height;
    }

    const ctx = dCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);
    
    // Dibujar la imagen original
    ctx.drawImage(oImg, 0, 0);
    
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

    // getBoundingClientRect calcula el tamaño visual (incluyendo el scale de CSS)
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
      drawStroke(clientX, clientY); // Pinta un punto inicial
    }
  };

  const drawStroke = (clientX: number, clientY: number) => {
    if (!isDrawing.current || !lastPos.current || !maskCanvasRef.current) return;

    if (mode === 'pan') {
      const deltaX = clientX - lastPos.current.rawX;
      const deltaY = clientY - lastPos.current.rawY;
      setPan(p => ({ x: p.x + deltaX, y: p.y + deltaY }));
      lastPos.current = { ...lastPos.current, rawX: clientX, rawY: clientY };
      return;
    }

    hasDrawn.current = true;
    const currentPos = getCoordinates(clientX, clientY);
    if (!currentPos) return;

    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    
    const rect = displayCanvasRef.current!.getBoundingClientRect();
    const scale = maskCanvasRef.current.width / rect.width;
    
    ctx.lineWidth = brushSize * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (mode === 'restore') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#000000';
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000000';
    }

    ctx.stroke();
    lastPos.current = { ...currentPos, rawX: clientX, rawY: clientY };

    cancelAnimationFrame(renderFrameId.current);
    renderFrameId.current = requestAnimationFrame(renderDisplay);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    lastPos.current = null;
    if (hasDrawn.current && mode !== 'pan') {
      saveHistoryState();
      hasDrawn.current = false;
    }
  };

  // Zoom con Rueda (Nativo para prevenir scroll de la página)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(z => {
        const newZoom = z - e.deltaY * 0.002;
        return Math.max(0.5, Math.min(newZoom, 5));
      });
    };
    
    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleNativeWheel);
  }, []);

  // Gestos Móviles (Pinch-to-zoom y Pan)
  const initialPinchDist = useRef<number | null>(null);
  
  const onTouchStart = (e: ReactTouchEvent) => {
    if (e.touches.length === 2) {
      isDrawing.current = false; // Cancelar dibujo si usa dos dedos
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    } else {
      startDrawing(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  
  const onTouchMove = (e: ReactTouchEvent) => {
    if (e.touches.length === 2 && initialPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const delta = dist - initialPinchDist.current;
      setZoom(z => Math.max(0.5, Math.min(z + delta * 0.01, 5)));
      initialPinchDist.current = dist;
    } else if (e.touches.length === 1) {
      drawStroke(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onTouchEnd = () => {
    initialPinchDist.current = null;
    stopDrawing();
  };

  // Eventos de Ratón con soporte para Clic Central
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) { // Rueda central
      e.preventDefault(); // Evita el auto-scroll del navegador
      isMiddlePan.current = true;
      lastPos.current = { x: 0, y: 0, rawX: e.clientX, rawY: e.clientY };
      return;
    }
    startDrawing(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMiddlePan.current) {
      if (!lastPos.current) return;
      const deltaX = e.clientX - lastPos.current.rawX;
      const deltaY = e.clientY - lastPos.current.rawY;
      setPan(p => ({ x: p.x + deltaX, y: p.y + deltaY }));
      lastPos.current = { ...lastPos.current, rawX: e.clientX, rawY: e.clientY };
      return;
    }
    drawStroke(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 1 || isMiddlePan.current) {
      isMiddlePan.current = false;
      lastPos.current = null;
      return;
    }
    stopDrawing();
  };

  // Generador de Cursor Dinámico SVG
  const getCursor = () => {
    if (isMiddlePan.current) return 'grabbing';
    if (mode === 'pan') return 'grab';
    
    // Un cursor circular del tamaño del pincel actual
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize}" height="${brushSize}" viewBox="0 0 ${brushSize} ${brushSize}"><circle cx="${brushSize/2}" cy="${brushSize/2}" r="${brushSize/2 - 1}" fill="rgba(255,255,255,0.2)" stroke="black" stroke-width="1.5"/><circle cx="${brushSize/2}" cy="${brushSize/2}" r="${Math.max(0, brushSize/2 - 2.5)}" fill="none" stroke="white" stroke-width="1.5"/></svg>`;
    const b64 = btoa(svg);
    return `url('data:image/svg+xml;base64,${b64}') ${brushSize/2} ${brushSize/2}, crosshair`;
  };

  // 4. Guardar resultado
  const handleSave = async () => {
    if (!displayCanvasRef.current) return;
    
    displayCanvasRef.current.toBlob((blob) => {
      if (blob) onSave(blob);
    }, 'image/png');
  };

  return (
    <>
      <div className="bgrm-workspace fade-in">
        <ImagePreviewCanvas imageUrl={originalSrc} maxHeight="60vh" className="bgrm-editor-canvas-wrapper">
          <div 
            className="bgrm-editor-workspace" 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ cursor: getCursor() }}
          >
            {!isReady && (
              <div className="spinner" style={{ margin: '40px auto', borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}></div>
            )}
            
            <canvas
              ref={displayCanvasRef}
              className="bgrm-paint-canvas"
              style={{ 
                display: isReady ? 'block' : 'none',
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: (mode === 'pan' || isMiddlePan.current) ? 'none' : 'transform 0.1s ease-out'
              }}
            />
          </div>
        </ImagePreviewCanvas>
      </div>

      <aside className="bgrm-sidebar fade-in">
        <div className="bgrm-controls-section">
          <h4 className="bgrm-control-title">🖌️ Perfeccionar</h4>
          <p className="bgrm-loading-desc" style={{ marginBottom: '10px' }}>
            Usa el pincel para restaurar partes borradas por error o borrar restos de fondo.
          </p>

          <div className="bgrm-editor-toolbar-grid">
            <button 
              className={`bgrm-tool-btn ${mode === 'restore' ? 'is-active' : ''}`}
              onClick={() => setMode('restore')}
            >
              <span className="tool-icon">✨</span>
              <span>Restaurar</span>
            </button>
            <button 
              className={`bgrm-tool-btn ${mode === 'erase' ? 'is-active' : ''}`}
              onClick={() => setMode('erase')}
            >
              <span className="tool-icon">🧹</span>
              <span>Borrar</span>
            </button>
            <button 
              className={`bgrm-tool-btn ${mode === 'pan' ? 'is-active' : ''}`}
              onClick={() => setMode('pan')}
            >
              <span className="tool-icon">🖐️</span>
              <span>Mover</span>
            </button>
            <button 
              className="bgrm-tool-btn"
              onClick={handleUndo}
              disabled={!canUndo}
              style={{ opacity: canUndo ? 1 : 0.5, cursor: canUndo ? 'pointer' : 'not-allowed' }}
              title="Deshacer (Ctrl+Z)"
            >
              <span className="tool-icon">↩️</span>
              <span>Deshacer</span>
            </button>
          </div>

          <div className="bgrm-brush-size">
            <label>Grosor: {brushSize}px</label>
            <input 
              type="range" 
              min="5" 
              max="120" 
              value={brushSize} 
              onChange={(e) => setBrushSize(parseInt(e.target.value))} 
            />
          </div>
        </div>

        <div className="bgrm-actions-panel" style={{ marginTop: 'auto' }}>
          <button className="btn-download-primary" onClick={handleSave}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20" style={{ marginRight: '8px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Guardar Cambios
          </button>
          <button className="btn-text-action" onClick={onCancel} style={{ justifyContent: 'center', marginTop: '10px' }}>
            Cancelar edición
          </button>
        </div>
      </aside>
    </>
  );
};
