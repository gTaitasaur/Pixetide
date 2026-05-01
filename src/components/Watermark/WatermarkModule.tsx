import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MultiDragAndDrop } from '../DragAndDrop/MultiDragAndDrop';
import { validateImageFile } from '../../utils/fileUpload';
import { applyWatermark, WatermarkResult } from '../../utils/watermarkProcessor';
import { packageZip } from '../../utils/formatConverter';
import { WatermarkConfig, WatermarkFile, DEFAULT_WATERMARK_CONFIG } from '../../types/watermark';
import './WatermarkModule.css';

interface WatermarkModuleProps {
  photos: File[];
  onAddPhotos: (files: File[]) => void;
  onClearAll: () => void;
}

export const WatermarkModule: React.FC<WatermarkModuleProps> = ({
  photos,
  onAddPhotos,
  onClearAll,
}) => {
  // ── Estado ──
  const [photoList, setPhotoList] = useState<WatermarkFile[]>([]);
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [watermarkUrl, setWatermarkUrl] = useState<string | null>(null);
  const [config, setConfig] = useState<WatermarkConfig>(DEFAULT_WATERMARK_CONFIG);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDraggingWm, setIsDraggingWm] = useState<boolean>(false);
  const [isDragOverArea, setIsDragOverArea] = useState<boolean>(false);

  // ── Refs ──
  const processedFilesRef = useRef<Set<File>>(new Set());
  const addPhotosInputRef = useRef<HTMLInputElement>(null);
  const wmInputRef = useRef<HTMLInputElement>(null);
  /**
   * FIX CRÍTICO: Este ref apunta a un wrapper <div> con display:inline-block
   * que se ajusta EXACTAMENTE al tamaño renderizado de la imagen.
   * Esto garantiza que las coordenadas normalizadas (0-1) se calculen
   * respecto a la imagen real, no al contenedor externo (que es más ancho).
   */
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  /** Dimensiones naturales de la marca de agua para mantener aspect ratio */
  const wmNaturalSize = useRef<{ w: number; h: number }>({ w: 1, h: 1 });
  /** Dimensiones renderizadas del wrapper (se actualizan al cargar imagen y al resize) */
  const [viewerDims, setViewerDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // ── Sincronizar fotos externas con el estado interno (patrón del Converter) ──
  useEffect(() => {
    const newFiles = photos.filter(f => !processedFilesRef.current.has(f));
    if (newFiles.length === 0) return;

    newFiles.forEach(f => processedFilesRef.current.add(f));

    const newEntries: WatermarkFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'idle' as const,
    }));

    setPhotoList(prev => {
      const updated = [...prev, ...newEntries];
      // Activar la primera foto si no hay ninguna activa
      if (!activePhotoId && updated.length > 0) {
        setActivePhotoId(updated[0].id);
      }
      return updated;
    });
  }, [photos]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cargar dimensiones naturales de la marca de agua ──
  useEffect(() => {
    if (!watermarkUrl) return;
    const img = new Image();
    img.onload = () => {
      wmNaturalSize.current = { w: img.naturalWidth, h: img.naturalHeight };
    };
    img.src = watermarkUrl;
  }, [watermarkUrl]);

  /**
   * ResizeObserver para mantener viewerDims actualizado cuando el layout cambia
   * (ej: redimensionar ventana). Se reconecta cada vez que cambia la foto activa.
   */
  useEffect(() => {
    if (!imageWrapperRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewerDims({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(imageWrapperRef.current);
    return () => observer.disconnect();
  }, [activePhotoId]);

  /** Callback cuando la foto activa termina de cargar en el DOM */
  const handlePhotoLoad = useCallback(() => {
    if (imageWrapperRef.current) {
      setViewerDims({
        w: imageWrapperRef.current.clientWidth,
        h: imageWrapperRef.current.clientHeight,
      });
    }
  }, []);

  // ── Handlers ──

  const handleWatermarkSelected = (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    // Limpiar URL anterior si existe
    if (watermarkUrl) URL.revokeObjectURL(watermarkUrl);
    setWatermarkFile(file);
    setWatermarkUrl(URL.createObjectURL(file));
    // Resetear estados de procesamiento
    setPhotoList(prev => prev.map(p => ({ ...p, status: 'idle' as const, resultUrl: undefined, resultBlob: undefined })));
  };

  const handleRemovePhoto = (id: string) => {
    setPhotoList(prev => {
      const item = prev.find(p => p.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      }
      const updated = prev.filter(p => p.id !== id);
      // Si eliminamos la foto activa, activar otra
      if (activePhotoId === id && updated.length > 0) {
        setActivePhotoId(updated[0].id);
      } else if (updated.length === 0) {
        setActivePhotoId(null);
      }
      return updated;
    });
  };

  const handleClearInternal = () => {
    photoList.forEach(p => {
      URL.revokeObjectURL(p.previewUrl);
      if (p.resultUrl) URL.revokeObjectURL(p.resultUrl);
    });
    setPhotoList([]);
    setActivePhotoId(null);
    processedFilesRef.current.clear();
    onClearAll();
  };

  // ── Drag de la marca de agua (Pointer Events: mouse + touch unificados) ──

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!imageWrapperRef.current) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDraggingWm(true);

    // Usamos getBoundingClientRect del WRAPPER (que coincide con la imagen)
    const rect = imageWrapperRef.current.getBoundingClientRect();
    const currentPxX = config.x * rect.width;
    const currentPxY = config.y * rect.height;
    dragOffsetRef.current = {
      x: e.clientX - rect.left - currentPxX,
      y: e.clientY - rect.top - currentPxY,
    };
  }, [config.x, config.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingWm || !imageWrapperRef.current) return;
    e.preventDefault();

    const rect = imageWrapperRef.current.getBoundingClientRect();
    const newX = (e.clientX - rect.left - dragOffsetRef.current.x) / rect.width;
    const newY = (e.clientY - rect.top - dragOffsetRef.current.y) / rect.height;

    setConfig(prev => ({
      ...prev,
      x: Math.max(0, Math.min(1, newX)),
      y: Math.max(0, Math.min(1, newY)),
    }));
  }, [isDraggingWm]);

  const handlePointerUp = useCallback(() => {
    setIsDraggingWm(false);
    setPhotoList(prev => prev.map(p => p.status === 'done' ? { ...p, status: 'idle' as const } : p));
  }, []);

  // ── Procesamiento por lotes ──

  const handleProcessBatch = async () => {
    if (!watermarkFile) return;

    const itemsToProcess = photoList.filter(p => p.status === 'idle');
    if (itemsToProcess.length === 0) return;

    setIsProcessing(true);

    for (const item of itemsToProcess) {
      // Marcar como procesando
      setPhotoList(prev => prev.map(p => p.id === item.id ? { ...p, status: 'processing' as const } : p));

      try {
        const result: WatermarkResult = await applyWatermark(item.file, watermarkFile, config);
        setPhotoList(prev => prev.map(p =>
          p.id === item.id
            ? { ...p, status: 'done' as const, resultUrl: result.url, resultBlob: result.blob }
            : p
        ));
      } catch {
        setPhotoList(prev => prev.map(p =>
          p.id === item.id ? { ...p, status: 'error' as const } : p
        ));
      }
    }

    setIsProcessing(false);
  };

  const handleDownload = async () => {
    const doneItems = photoList.filter(p => p.status === 'done' && p.resultBlob);
    if (doneItems.length === 0) return;

    if (doneItems.length === 1) {
      // Descarga directa
      const item = doneItems[0];
      const a = document.createElement('a');
      a.href = item.resultUrl!;
      const baseName = item.file.name.replace(/\.[^/.]+$/, '');
      const ext = item.file.name.split('.').pop();
      a.download = `${baseName}_watermark.${ext}`;
      a.click();
    } else {
      // ZIP
      const zipFiles = doneItems.map(item => {
        const baseName = item.file.name.replace(/\.[^/.]+$/, '');
        const ext = item.file.name.split('.').pop();
        return { blob: item.resultBlob!, filename: `${baseName}_watermark.${ext}` };
      });
      const zipBlob = await packageZip(zipFiles);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = 'fotos_con_marca_de_agua.zip';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }
  };

  // ── Resetear estado de procesamiento cuando cambian los sliders ──
  const handleConfigChange = (partial: Partial<WatermarkConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
    setPhotoList(prev => prev.map(p => p.status === 'done' ? { ...p, status: 'idle' as const } : p));
  };

  // ── Datos derivados ──
  const activePhoto = photoList.find(p => p.id === activePhotoId);
  const idleCount = photoList.filter(p => p.status === 'idle').length;
  const doneCount = photoList.filter(p => p.status === 'done').length;
  const hasPhotos = photoList.length > 0;

  // ── Estado inicial: sin fotos → mostrar MultiDragAndDrop ──
  if (!hasPhotos) {
    return (
      <div className="wm-stage">
        <MultiDragAndDrop onFilesSelected={onAddPhotos} />
      </div>
    );
  }

  // ── Calcular estilo CSS de la marca de agua en el visor ──
  // Usa viewerDims (estado) que siempre refleja el tamaño real de la imagen renderizada
  const getWmStyle = (): React.CSSProperties => {
    const { w: containerW, h: containerH } = viewerDims;
    if (containerW === 0 || containerH === 0) return { display: 'none' };

    const { w: natW, h: natH } = wmNaturalSize.current;
    // Escalar respecto al LADO MENOR de la imagen (min(ancho, alto)).
    // Esto garantiza que un 35% se vea proporcionalmente igual en fotos
    // horizontales, verticales y cuadradas.
    const refDimension = Math.min(containerW, containerH);
    const displayW = refDimension * config.scale;
    const displayH = displayW * (natH / natW);
    const left = config.x * containerW - displayW / 2;
    const top = config.y * containerH - displayH / 2;

    return {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${displayW}px`,
      height: `${displayH}px`,
      opacity: config.opacity,
      transform: `rotate(${config.rotation}deg)`,
      pointerEvents: 'auto' as const,
      touchAction: 'none' as const,
      cursor: isDraggingWm ? 'grabbing' : 'grab',
      transition: isDraggingWm ? 'none' : 'left 0.1s, top 0.1s',
      zIndex: 10,
      userSelect: 'none' as const,
    };
  };

  return (
    <div
      className={`wm-stage ${isDragOverArea ? 'drag-active' : ''}`}
      onDragOver={(e) => { e.preventDefault(); if (!isProcessing) setIsDragOverArea(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragOverArea(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOverArea(false);
        if (isProcessing) return;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const valid = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
          if (valid.length > 0) onAddPhotos(valid);
          e.dataTransfer.clearData();
        }
      }}
    >
      <div className="wm-hero">

        {/* ── Barra Superior ── */}
        <div className="wm-header-actions">
          {/* Input oculto para marca de agua */}
          <input
            type="file"
            accept="image/*"
            ref={wmInputRef}
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleWatermarkSelected(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
          {/* Input oculto para agregar más fotos */}
          <input
            type="file"
            accept="image/*"
            multiple
            ref={addPhotosInputRef}
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onAddPhotos(Array.from(e.target.files));
                e.target.value = '';
              }
            }}
          />

          <button
            className="btn-wm-action"
            onClick={() => wmInputRef.current?.click()}
            disabled={isProcessing}
          >
            {watermarkUrl ? (
              <>
                <img src={watermarkUrl} className="wm-mini-preview" alt="marca" />
                Cambiar Marca
              </>
            ) : (
              <>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Agregar Marca
              </>
            )}
          </button>

          <div className="wm-header-buttons">
            <button
              className="btn-add-more"
              onClick={() => addPhotosInputRef.current?.click()}
              disabled={isProcessing}
              title="Agregar más fotos"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Agregar
            </button>
            <button className="btn-clear-all" onClick={handleClearInternal} disabled={isProcessing}>
              Borrar Todo
            </button>
          </div>
        </div>

        {/* ── Visor Principal ── */}
        {activePhoto && (
          <div className="wm-viewer-container">
            <div className="wm-viewer-checkerboard">
              {/*
                WRAPPER INLINE-BLOCK: Este div se ajusta exactamente al tamaño
                de la imagen renderizada. Es la referencia para TODAS las
                coordenadas de la marca de agua (posición, arrastre, etc.)
              */}
              <div
                ref={imageWrapperRef}
                className="wm-image-wrapper"
              >
                <img
                  src={activePhoto.previewUrl}
                  alt="Foto activa"
                  className="wm-viewer-photo"
                  draggable={false}
                  onLoad={handlePhotoLoad}
                />
                {/* Marca de agua superpuesta — posicionada relativa al wrapper */}
                {watermarkUrl && viewerDims.w > 0 && (
                  <img
                    src={watermarkUrl}
                    alt="Marca de agua"
                    className="wm-overlay-img"
                    draggable={false}
                    style={getWmStyle()}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  />
                )}
              </div>
            </div>
            {!watermarkUrl && (
              <div className="wm-viewer-hint">
                <span>↑ Usa el botón "Agregar Marca" para subir tu logo o firma</span>
              </div>
            )}
          </div>
        )}

        {/* ── Controles (Sliders) ── */}
        {watermarkUrl && (
          <div className="wm-controls">
            <div className="wm-control-row">
              <label className="wm-control-label">
                Tamaño
                <span className="wm-control-value">{Math.round(config.scale * 100)}%</span>
              </label>
              <input
                type="range"
                className="wm-slider"
                min="5"
                max="80"
                value={Math.round(config.scale * 100)}
                onChange={(e) => handleConfigChange({ scale: parseInt(e.target.value) / 100 })}
                disabled={isProcessing}
              />
            </div>
            <div className="wm-control-row">
              <label className="wm-control-label">
                Opacidad
                <span className="wm-control-value">{Math.round(config.opacity * 100)}%</span>
              </label>
              <input
                type="range"
                className="wm-slider"
                min="10"
                max="100"
                value={Math.round(config.opacity * 100)}
                onChange={(e) => handleConfigChange({ opacity: parseInt(e.target.value) / 100 })}
                disabled={isProcessing}
              />
            </div>
            <div className="wm-control-row">
              <label className="wm-control-label">
                Rotación
                <span className="wm-control-value">{config.rotation}°</span>
              </label>
              <input
                type="range"
                className="wm-slider"
                min="-180"
                max="180"
                value={config.rotation}
                onChange={(e) => handleConfigChange({ rotation: parseInt(e.target.value) })}
                disabled={isProcessing}
              />
            </div>
          </div>
        )}

        {/* ── Galería de Thumbnails ── */}
        <div className="wm-gallery-section">
          <p className="wm-gallery-title">Marca de agua se aplicará a estas imágenes</p>
          <div className="wm-gallery-grid">
            {photoList.map(item => (
              <div
                key={item.id}
                className={`wm-thumb-card ${item.id === activePhotoId ? 'active' : ''}`}
                onClick={() => setActivePhotoId(item.id)}
              >
                <div className="wm-thumb-img-container">
                  <img src={item.previewUrl} alt="thumb" className="wm-thumb-img" draggable={false} />
                  {/* Mini-overlay de la marca en la misma posición normalizada */}
                  {watermarkUrl && (
                    <img
                      src={watermarkUrl}
                      alt=""
                      className="wm-thumb-overlay"
                      style={{
                        position: 'absolute',
                        left: `${config.x * 100}%`,
                        top: `${config.y * 100}%`,
                        width: `${config.scale * 100}%`,
                        opacity: config.opacity,
                        transform: `translate(-50%, -50%) rotate(${config.rotation}deg)`,
                      }}
                      draggable={false}
                    />
                  )}
                </div>
                <button
                  className="wm-thumb-remove"
                  onClick={(e) => { e.stopPropagation(); handleRemovePhoto(item.id); }}
                  disabled={isProcessing}
                  title="Quitar"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {item.status !== 'idle' && (
                  <span className={`wm-thumb-badge status-${item.status}`}>
                    {item.status === 'processing' ? '⏳' : item.status === 'done' ? '✓' : '✗'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Acciones ── */}
      <div className="wm-actions">
        {!watermarkUrl ? (
          <p className="wm-hint">Agrega tu marca de agua para poder procesar las fotos</p>
        ) : doneCount === photoList.length && doneCount > 0 ? (
          <button className="btn-success" onClick={handleDownload} disabled={isProcessing}>
            Descargar {doneCount} Foto{doneCount > 1 ? 's' : ''} con Marca
          </button>
        ) : (
          <button
            className="btn-success"
            onClick={handleProcessBatch}
            disabled={isProcessing || idleCount === 0}
          >
            {isProcessing
              ? 'Aplicando marca de agua...'
              : idleCount === photoList.length
                ? `Aplicar Marca a ${photoList.length} Foto${photoList.length > 1 ? 's' : ''}`
                : idleCount > 0
                  ? `Aplicar a ${idleCount} Pendiente${idleCount > 1 ? 's' : ''}`
                  : 'Todas las fotos están listas ✓'
            }
          </button>
        )}
      </div>
    </div>
  );
};
