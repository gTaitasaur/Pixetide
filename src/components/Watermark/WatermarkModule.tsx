import React, { useState, useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { MultiDragAndDrop } from '../DragAndDrop/MultiDragAndDrop';
import { ImagePreviewCanvas } from '../UI/ImagePreviewCanvas/ImagePreviewCanvas';
import { validateImageFile } from '../../utils/fileUpload';
import { packageZip } from '../../utils/formatConverter';
import { 
  WatermarkFile, 
  WatermarkType, 
  DEFAULT_TEXT_CONFIG, 
  DEFAULT_IMAGE_CONFIG,
  TextWatermarkConfig,
  ImageWatermarkConfig
} from '../../types/watermark';
import { showToast } from '../UI/Toast/toastManager';
import './WatermarkModule.css';

interface WatermarkModuleProps {
  photos: File[];
  onAddPhotos: (files: File[]) => void;
  onClearAll: () => void;
}

type AnyWatermarkConfig = TextWatermarkConfig | ImageWatermarkConfig;

export const WatermarkModule: React.FC<WatermarkModuleProps> = ({
  photos,
  onAddPhotos,
  onClearAll,
}) => {
  // ── Estado General ──
  const [photoList, setPhotoList] = useState<WatermarkFile[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mode, setMode] = useState<WatermarkType>('text');

  // ── Estado de Configuración (Normalizado) ──
  const [watermarks, setWatermarks] = useState<AnyWatermarkConfig[]>([]);
  const [activeWmId, setActiveWmId] = useState<string | null>(null);
  const [hasUploadedImage, setHasUploadedImage] = useState(false);

  // Sincronizar mode con el activeWmId
  useEffect(() => {
    const active = watermarks.find(w => w.id === activeWmId);
    if (active) setMode(active.type);
  }, [activeWmId, watermarks]);

  const watermarksRef = useRef(watermarks);
  useEffect(() => { watermarksRef.current = watermarks; }, [watermarks]);

  const activeWmIdRef = useRef(activeWmId);
  useEffect(() => { activeWmIdRef.current = activeWmId; }, [activeWmId]);

  // ── Refs del Editor ──
  const processedFilesRef = useRef<Set<File>>(new Set());
  const hasInitializedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const viewerWrapperRef = useRef<HTMLDivElement>(null);
  const [viewerDims, setViewerDims] = useState({ w: 0, h: 0 });

  const addPhotosInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const uploadActionRef = useRef<'add' | 'change'>('add');

  // ── 1. Sincronizar archivos externos ──
  useEffect(() => {
    const newFiles = photos.filter(f => !processedFilesRef.current.has(f));
    if (newFiles.length === 0) return;

    newFiles.forEach(f => processedFilesRef.current.add(f));
    const newEntries: WatermarkFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'idle',
    }));

    setPhotoList(prev => {
      const updated = [...prev, ...newEntries];
      if (!activePhotoId && updated.length > 0) setActivePhotoId(updated[0].id);
      return updated;
    });

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const initialWm: TextWatermarkConfig = { ...DEFAULT_TEXT_CONFIG, id: 'wm-init' };
      setWatermarks([initialWm]);
      setActiveWmId(initialWm.id);
    }
  }, [photos, activePhotoId]);

  // ── 2. Manejo de Layout y Resize ──
  useEffect(() => {
    if (!viewerWrapperRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewerDims({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(viewerWrapperRef.current);
    return () => observer.disconnect();
  }, [activePhotoId]);

  // ── 3. Inicialización del Canvas de Fabric ──
  useEffect(() => {
    if (!canvasRef.current || !activePhotoId) return;
    
    // Inicializar o re-inicializar
    if (!fabricCanvasRef.current) {
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
        selection: false,
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current.on('object:modified', handleFabricObjectModified);
      fabricCanvasRef.current.on('selection:created', handleSelection);
      fabricCanvasRef.current.on('selection:updated', handleSelection);
      fabricCanvasRef.current.on('selection:cleared', handleSelectionCleared);
    }
    
    const fCanvas = fabricCanvasRef.current;
    const activePhoto = photoList.find(p => p.id === activePhotoId);
    if (!activePhoto) return;

    // Cargar imagen base
    fabric.Image.fromURL(activePhoto.previewUrl, (img) => {
      if (!viewerWrapperRef.current || !fCanvas) return;
      
      const wrapperW = viewerWrapperRef.current.clientWidth;
      const wrapperH = viewerWrapperRef.current.clientHeight;
      
      const scaleX = wrapperW / (img.width || 1);
      const scaleY = wrapperH / (img.height || 1);
      const scale = Math.min(scaleX, scaleY, 1); 
      
      const renderW = (img.width || 1) * scale;
      const renderH = (img.height || 1) * scale;

      fCanvas.setWidth(renderW);
      fCanvas.setHeight(renderH);

      img.set({
        originX: 'left',
        originY: 'top',
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
      });

      fCanvas.setBackgroundImage(img, fCanvas.renderAll.bind(fCanvas));
      
      // Re-renderizar marcas
      renderWatermarks();
    });

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.off('object:modified', handleFabricObjectModified);
        fabricCanvasRef.current.off('selection:created', handleSelection);
        fabricCanvasRef.current.off('selection:updated', handleSelection);
        fabricCanvasRef.current.off('selection:cleared', handleSelectionCleared);
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePhotoId, viewerDims.w]);

  // ── Lógica Central: Renderizar Marcas en Fabric ──
  const renderWatermarks = () => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas) return;

    const cWidth = fCanvas.getWidth();
    const cHeight = fCanvas.getHeight();
    const refDimension = Math.min(cWidth, cHeight);

    const existingObjects = fCanvas.getObjects();
    const existingMap = new Map<string, fabric.Object>();
    existingObjects.forEach(obj => {
      const id = (obj as any).id;
      if (id) existingMap.set(id, obj);
    });

    // Eliminar objetos que ya no están en el state
    existingObjects.forEach(obj => {
      const id = (obj as any).id;
      if (id && !watermarks.find(w => w.id === id)) {
        fCanvas.remove(obj);
      }
    });

    const applyPropertiesAndClamp = (obj: fabric.Object, config: AnyWatermarkConfig) => {
      const targetWidth = refDimension * config.scale;
      obj.scaleToWidth(targetWidth);

      let rawLeft = config.x * cWidth;
      let rawTop = config.y * cHeight;

      const scaledW = obj.getScaledWidth();
      const scaledH = obj.getScaledHeight();
      const halfW = scaledW / 2;
      const halfH = scaledH / 2;

      rawLeft = Math.max(halfW, Math.min(cWidth - halfW, rawLeft));
      rawTop = Math.max(halfH, Math.min(cHeight - halfH, rawTop));

      obj.set({
        left: rawLeft,
        top: rawTop,
        angle: config.rotation,
        opacity: config.opacity,
      });

      // Seleccionar visualmente si es el activo
      if (config.id === activeWmId) {
        fCanvas.setActiveObject(obj);
      }
    };

    watermarks.forEach(config => {
      let obj = existingMap.get(config.id);

      if (obj) {
        const isTypeMismatch = (config.type === 'text' && obj.type !== 'text') || (config.type === 'image' && obj.type !== 'image');
        const isImageChanged = config.type === 'image' && (obj as any)._blobUrl !== (config as ImageWatermarkConfig).url;

        if (isTypeMismatch || isImageChanged) {
          fCanvas.remove(obj);
          obj = undefined;
        }
      }

      if (!obj) {
        if (config.type === 'text') {
          const txtCfg = config as TextWatermarkConfig;
          const textObj = new fabric.Text(txtCfg.text, {
            fontFamily: txtCfg.fontFamily,
            fontWeight: txtCfg.fontWeight,
            fill: txtCfg.color,
            originX: 'center',
            originY: 'center',
            transparentCorners: false,
            cornerColor: '#2563eb',
            cornerStrokeColor: '#ffffff',
            borderColor: '#2563eb',
            cornerSize: 12,
            padding: 5,
            cornerStyle: 'circle',
          });
          (textObj as any).id = config.id;
          fCanvas.add(textObj);
          applyPropertiesAndClamp(textObj, config);
        } else if (config.type === 'image' && config.url) {
          fabric.Image.fromURL(config.url, (imgObj) => {
            if (!fabricCanvasRef.current) return;
            imgObj.set({
              originX: 'center',
              originY: 'center',
              transparentCorners: false,
              cornerColor: '#2563eb',
              cornerStrokeColor: '#ffffff',
              borderColor: '#2563eb',
              cornerSize: 12,
              padding: 5,
              cornerStyle: 'circle',
            });
            (imgObj as any).id = config.id;
            (imgObj as any)._blobUrl = config.url;
            fabricCanvasRef.current.add(imgObj);
            applyPropertiesAndClamp(imgObj, config);
            fabricCanvasRef.current.renderAll();
          });
        }
      } else {
        if (config.type === 'text' && obj.type === 'text') {
          const txtCfg = config as TextWatermarkConfig;
          (obj as fabric.Text).set({
            text: txtCfg.text,
            fontFamily: txtCfg.fontFamily,
            fontWeight: txtCfg.fontWeight,
            fill: txtCfg.color,
          });
        }
        applyPropertiesAndClamp(obj, config);
      }
    });

    fCanvas.renderAll();
  };

  useEffect(() => {
    if (fabricCanvasRef.current) renderWatermarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watermarks, activeWmId]);

  // Event Handlers de Fabric
  const handleSelection = (e: fabric.IEvent) => {
    const obj = e.selected?.[0] as any;
    if (obj && obj.id && obj.id !== activeWmIdRef.current) {
      setActiveWmId(obj.id);
    }
  };

  const handleSelectionCleared = () => {
    // setActiveWmId(null); // Opcional: deseleccionar. Lo dejamos comentado para que el panel no colapse de golpe.
  };

  const handleFabricObjectModified = (e: fabric.IEvent) => {
    const obj = e.target as any;
    if (!obj || !obj.id || !fabricCanvasRef.current) return;

    const fCanvas = fabricCanvasRef.current;
    const cWidth = fCanvas.getWidth();
    const cHeight = fCanvas.getHeight();
    const refDimension = Math.min(cWidth, cHeight);

    const newX = (obj.left || 0) / cWidth;
    const newY = (obj.top || 0) / cHeight;
    const newRotation = obj.angle || 0;
    
    // Identificar qué acción disparó la modificación para evitar ciclos de redondeo
    const action = e.action || (e.transform && e.transform.action);
    const isDragOrRotate = action === 'drag' || action === 'rotate';

    let newScale: number | undefined;
    if (!isDragOrRotate) {
      // Solo recalculamos la escala si NO fue un movimiento puro o rotación.
      // Así evitamos que scaleToWidth y obj.width tengan un feedback loop por el padding.
      const currentWidth = (obj.width || 1) * (obj.scaleX || 1);
      newScale = currentWidth / refDimension;
    }

    setWatermarks(prev => prev.map(w => {
      if (w.id === obj.id) {
        return { 
          ...w, 
          x: newX, 
          y: newY, 
          rotation: newRotation, 
          ...(newScale !== undefined ? { scale: newScale } : {}) 
        };
      }
      return w;
    }));

    setPhotoList(prev => prev.map(p => p.status === 'done' ? { ...p, status: 'idle' } : p));
  };

  // ── Handlers de UI ──
  const updateActiveConfig = (partial: Partial<AnyWatermarkConfig>) => {
    if (!activeWmId) return;
    setWatermarks(prev => prev.map(w => w.id === activeWmId ? { ...w, ...partial } as AnyWatermarkConfig : w));
    resetProcessingStatus();
  };

  const handleAddText = () => {
    const newWm: TextWatermarkConfig = { ...DEFAULT_TEXT_CONFIG, id: 'wm-' + Date.now() };
    setWatermarks([...watermarks, newWm]);
    setActiveWmId(newWm.id);
  };

  const handleTextTabClick = () => {
    setMode('text');
    const existingTextWm = watermarks.find(w => w.type === 'text');
    if (existingTextWm) {
      const currentActive = watermarks.find(w => w.id === activeWmId);
      if (!currentActive || currentActive.type !== 'text') {
        setActiveWmId(existingTextWm.id);
      }
    }
  };

  const handleImageTabClick = () => {
    setMode('image');
    const existingImageWm = watermarks.find(w => w.type === 'image');
    
    if (existingImageWm) {
      const currentActive = watermarks.find(w => w.id === activeWmId);
      if (!currentActive || currentActive.type !== 'image') {
        setActiveWmId(existingImageWm.id);
      }
    } else {
      if (!hasUploadedImage) {
        setHasUploadedImage(true);
        uploadActionRef.current = 'add';
        setTimeout(() => logoInputRef.current?.click(), 100);
      }
    }
  };

  const handleDuplicate = () => {
    if (!activeWmId) return;
    const activeObj = watermarks.find(w => w.id === activeWmId);
    if (!activeObj) return;
    const newWm = { 
      ...activeObj, 
      id: 'wm-' + Date.now(), 
      x: activeObj.x + 0.05,
      y: activeObj.y + 0.05 
    };
    setWatermarks([...watermarks, newWm]);
    setActiveWmId(newWm.id);
  };

  const handleDelete = (id?: string) => {
    const targetId = id || activeWmId;
    if (!targetId) return;
    const updated = watermarks.filter(w => w.id !== targetId);
    setWatermarks(updated);
    if (activeWmId === targetId) {
      setActiveWmId(updated.length > 0 ? updated[updated.length - 1].id : null);
    }
  };

  const resetProcessingStatus = () => {
    setPhotoList(prev => prev.map(p => p.status === 'done' ? { ...p, status: 'idle' } : p));
  };

  const handleLogoUpload = (file: File) => {
    const valid = validateImageFile(file);
    if (!valid.isValid) {
      showToast(valid.error || 'Archivo inválido', 'error');
      return;
    }
    const url = URL.createObjectURL(file);

    if (uploadActionRef.current === 'change' && activeWmId) {
      const active = watermarks.find(w => w.id === activeWmId);
      if (active && active.type === 'image' && active.url) {
        URL.revokeObjectURL(active.url);
      }
      updateActiveConfig({ url });
    } else {
      // Add new
      const newWm: ImageWatermarkConfig = { ...DEFAULT_IMAGE_CONFIG, id: 'wm-' + Date.now(), url };
      setWatermarks(prev => [...prev, newWm]);
      setActiveWmId(newWm.id);
      setHasUploadedImage(true);
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotoList(prev => {
      const item = prev.find(p => p.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
        processedFilesRef.current.delete(item.file);
      }
      const updated = prev.filter(p => p.id !== id);
      if (activePhotoId === id && updated.length > 0) setActivePhotoId(updated[0].id);
      else if (updated.length === 0) setActivePhotoId(null);
      return updated;
    });
  };

  const handleClearAllInternal = () => {
    photoList.forEach(p => {
      URL.revokeObjectURL(p.previewUrl);
      if (p.resultUrl) URL.revokeObjectURL(p.resultUrl);
    });
    setPhotoList([]);
    setActivePhotoId(null);
    processedFilesRef.current.clear();
    onClearAll();
  };

  // ── Exportación (Client-Side Puro) ──
  const processBatchItem = async (item: WatermarkFile): Promise<Blob> => {
    return new Promise((resolve) => {
      fabric.Image.fromURL(item.previewUrl, (bgImg) => {
        const origW = bgImg.width || 800;
        const origH = bgImg.height || 600;
        const refDimension = Math.min(origW, origH);
        
        const exportCanvas = new fabric.StaticCanvas(null, {
          width: origW,
          height: origH,
        });

        bgImg.set({ originX: 'left', originY: 'top' });
        exportCanvas.setBackgroundImage(bgImg, () => {});

        let loadedCount = 0;
        if (watermarks.length === 0) {
          exportCanvas.renderAll();
          const mime = item.file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const blob = fetch(exportCanvas.toDataURL({ format: mime === 'image/png' ? 'png' : 'jpeg', quality: 0.92 })).then(r => r.blob());
          resolve(blob);
          return;
        }

        watermarks.forEach(config => {
          const addObjAndExport = (obj: fabric.Object) => {
            const targetWidth = refDimension * config.scale;
            obj.scaleToWidth(targetWidth);

            let rawLeft = config.x * origW;
            let rawTop = config.y * origH;

            const scaledW = obj.getScaledWidth();
            const scaledH = obj.getScaledHeight();
            const halfW = scaledW / 2;
            const halfH = scaledH / 2;

            rawLeft = Math.max(halfW, Math.min(origW - halfW, rawLeft));
            rawTop = Math.max(halfH, Math.min(origH - halfH, rawTop));

            obj.set({
              left: rawLeft,
              top: rawTop,
              originX: 'center',
              originY: 'center',
              opacity: config.opacity,
              angle: config.rotation,
            });

            exportCanvas.add(obj);
            loadedCount++;
            
            if (loadedCount === watermarks.length) {
              exportCanvas.renderAll();
              const dataUrl = exportCanvas.toDataURL({
                format: item.file.type === 'image/png' ? 'png' : 'jpeg',
                quality: 0.92,
                multiplier: 1
              });
              const arr = dataUrl.split(',');
              const mime = arr[0].match(/:(.*?);/)![1];
              const bstr = atob(arr[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) u8arr[n] = bstr.charCodeAt(n);
              exportCanvas.dispose();
              resolve(new Blob([u8arr], { type: mime }));
            }
          };

          if (config.type === 'text') {
            const txtCfg = config as TextWatermarkConfig;
            const textObj = new fabric.Text(txtCfg.text, {
              fontFamily: txtCfg.fontFamily,
              fontWeight: txtCfg.fontWeight,
              fill: txtCfg.color,
            });
            addObjAndExport(textObj);
          } else if (config.type === 'image' && config.url) {
            fabric.Image.fromURL(config.url, (imgObj) => {
              addObjAndExport(imgObj);
            });
          } else {
            // Placeholder si falla URL
            addObjAndExport(new fabric.Object({opacity: 0}));
          }
        });
      });
    });
  };

  const handleProcessAndDownload = async () => {
    setIsProcessing(true);

    const newPhotoList = [...photoList];
    let hasNewResults = false;

    for (let i = 0; i < newPhotoList.length; i++) {
      const item = newPhotoList[i];
      if (item.status !== 'done') {
        newPhotoList[i] = { ...item, status: 'processing' };
        setPhotoList([...newPhotoList]);
        
        try {
          const blob = await processBatchItem(item);
          const url = URL.createObjectURL(blob);
          newPhotoList[i] = { ...item, status: 'done', resultBlob: blob, resultUrl: url };
          hasNewResults = true;
        } catch (err) {
          console.error(err);
          newPhotoList[i] = { ...item, status: 'error' };
        }
        setPhotoList([...newPhotoList]);
      }
    }

    setIsProcessing(false);

    const doneItems = newPhotoList.filter(p => p.status === 'done' && p.resultBlob);
    if (doneItems.length === 0) return;

    if (doneItems.length === 1) {
      const item = doneItems[0];
      const a = document.createElement('a');
      a.href = item.resultUrl!;
      const baseName = item.file.name.replace(/\.[^/.]+$/, '');
      const ext = item.file.name.split('.').pop();
      a.download = `${baseName}_watermark.${ext}`;
      a.click();
    } else if (hasNewResults) {
      const zipFiles = doneItems.map(item => {
        const baseName = item.file.name.replace(/\.[^/.]+$/, '');
        const ext = item.file.name.split('.').pop();
        return { blob: item.resultBlob!, filename: `${baseName}_watermark.${ext}` };
      });
      const zipBlob = await packageZip(zipFiles);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = 'fotos_watermark.zip';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }
  };

  if (photoList.length === 0) {
    return <MultiDragAndDrop onFilesSelected={onAddPhotos} />;
  }

  const activePhoto = photoList.find(p => p.id === activePhotoId);
  const currentConfig = watermarks.find(w => w.id === activeWmId) || watermarks[0];

  return (
    <div className="wm-container fade-in">
      <div className="wm-top-bar">
         <input type="file" accept="image/*" multiple ref={addPhotosInputRef} style={{ display: 'none' }} onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onAddPhotos(Array.from(e.target.files));
              e.target.value = '';
            }
          }} />
         <button className="btn-text-action" onClick={() => addPhotosInputRef.current?.click()} disabled={isProcessing}>
            + Agregar fotos
         </button>
         <button className="btn-text-action danger" onClick={handleClearAllInternal} disabled={isProcessing}>
            Borrar todo
         </button>
      </div>

      <div className="wm-main-layout">
        <div className="wm-workspace">
          {activePhoto && (
            <ImagePreviewCanvas imageUrl={activePhoto.previewUrl} maxHeight="65vh" className="wm-preview-wrapper">
              <div className="wm-fabric-container" ref={viewerWrapperRef}>
                 <canvas ref={canvasRef} />
              </div>
            </ImagePreviewCanvas>
          )}

          <div className="wm-gallery-track">
            {photoList.map(item => (
              <div 
                key={item.id} 
                className={`wm-gallery-thumb ${item.id === activePhotoId ? 'is-active' : ''}`}
                onClick={() => setActivePhotoId(item.id)}
              >
                <img src={item.previewUrl} alt="thumb" />
                {item.status === 'done' && <span className="wm-thumb-badge done">✓</span>}
                <button 
                  className="wm-thumb-remove" 
                  onClick={(e) => { e.stopPropagation(); handleRemovePhoto(item.id); }}
                  title="Eliminar foto"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <aside className="wm-sidebar">
          
          <div className="wm-layers">
            <h4>Capas</h4>
            <div className="wm-layers-list">
              {watermarks.map(wm => (
                <div 
                  key={wm.id} 
                  className={`wm-layer-item ${wm.id === activeWmId ? 'active' : ''}`}
                  onClick={() => setActiveWmId(wm.id)}
                >
                  <span className="wm-layer-icon">{wm.type === 'text' ? 'T' : '🖼️'}</span>
                  <span className="wm-layer-name">
                    {wm.type === 'text' ? (wm as TextWatermarkConfig).text || 'Texto' : 'Imagen'}
                  </span>
                  <button 
                    className="wm-layer-remove" 
                    onClick={(e) => { e.stopPropagation(); handleDelete(wm.id); }}
                    title="Eliminar capa"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            
            <div className="wm-action-buttons">
              <button className="btn-action-brutal duplicate" onClick={handleDuplicate} title="Duplicar marca seleccionada">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                Duplicar
              </button>
              <button className="btn-action-brutal delete" onClick={() => handleDelete()} title="Eliminar marca seleccionada">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Eliminar
              </button>
            </div>
          </div>

          <div className="wm-tabs">
            <button className={`wm-tab ${mode === 'text' ? 'active' : ''}`} onClick={handleTextTabClick}>
              Texto
            </button>
            <button className={`wm-tab ${mode === 'image' ? 'active' : ''}`} onClick={handleImageTabClick}>
              Imagen
            </button>
          </div>

          <div className="wm-panel">
            {mode === 'text' && (
              <button className="wm-btn-outline" onClick={handleAddText} style={{ marginBottom: '5px' }}>
                + Agregar otro texto
              </button>
            )}
            
            {mode === 'image' && (
              <div style={{ marginBottom: '5px' }}>
                <input type="file" accept="image/*" ref={logoInputRef} style={{ display: 'none' }} onChange={(e) => {
                  if (e.target.files && e.target.files[0]) handleLogoUpload(e.target.files[0]);
                  e.target.value = '';
                }}/>
                <button className="wm-btn-outline" onClick={() => {
                  uploadActionRef.current = 'add';
                  logoInputRef.current?.click();
                }}>
                  + Agregar otra imagen
                </button>
              </div>
            )}

            {!currentConfig || currentConfig.type !== mode ? (
              <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                {mode === 'text' ? 'Agrega un texto para comenzar' : 'Sube una imagen para comenzar'}
              </div>
            ) : (
              <>
                {currentConfig.type === 'text' ? (
                  <>
                    <div className="wm-control-group">
                      <label>Texto de la Marca</label>
                      <input 
                        type="text" 
                        className="wm-input" 
                        value={(currentConfig as TextWatermarkConfig).text} 
                        onChange={e => updateActiveConfig({ text: e.target.value })}
                      />
                    </div>
                    <div className="wm-control-group split">
                      <div>
                        <label>Color</label>
                        <input 
                          type="color" 
                          className="wm-color-picker" 
                          value={(currentConfig as TextWatermarkConfig).color} 
                          onChange={e => updateActiveConfig({ color: e.target.value })}
                        />
                      </div>
                      <div>
                        <label>Peso</label>
                        <select className="wm-select" value={(currentConfig as TextWatermarkConfig).fontWeight} onChange={e => updateActiveConfig({ fontWeight: e.target.value as any })}>
                          <option value="normal">Normal</option>
                          <option value="bold">Negrita</option>
                        </select>
                      </div>
                    </div>
                    <div className="wm-control-group">
                      <label>Tipografía</label>
                      <select className="wm-select" value={(currentConfig as TextWatermarkConfig).fontFamily} onChange={e => updateActiveConfig({ fontFamily: e.target.value })}>
                        <option value="Inter">Inter</option>
                        <option value="Arial">Arial</option>
                        <option value="Courier New">Monospace</option>
                        <option value="Georgia">Serif</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="wm-control-group">
                      <label>Logo o Firma (PNG/SVG)</label>
                      <button className="btn-text-action" onClick={() => {
                        uploadActionRef.current = 'change';
                        logoInputRef.current?.click();
                      }}>
                        {(currentConfig as ImageWatermarkConfig).url ? 'Cambiar Imagen' : 'Subir Imagen'}
                      </button>
                      {(currentConfig as ImageWatermarkConfig).url && (
                         <img src={(currentConfig as ImageWatermarkConfig).url!} alt="Logo" style={{ maxHeight: '40px', marginTop: '10px', objectFit: 'contain' }} />
                      )}
                    </div>
                  </>
                )}

                <hr className="wm-divider" />

                <div className="wm-control-group">
                  <label>Tamaño ({Math.round(currentConfig.scale * 100)}%)</label>
                  <input 
                    type="range" 
                    min="5" max="100" 
                    value={currentConfig.scale * 100} 
                    onChange={e => updateActiveConfig({ scale: Number(e.target.value) / 100 })}
                  />
                </div>

                <div className="wm-control-group">
                  <label>Rotación ({Math.round(currentConfig.rotation)}°)</label>
                  <div className="wm-slider-with-input">
                    <input 
                      type="range" 
                      min="-180" max="180" 
                      value={currentConfig.rotation} 
                      onChange={e => updateActiveConfig({ rotation: Number(e.target.value) })}
                    />
                    <input 
                      type="number"
                      className="wm-input-number"
                      min="-180" max="180"
                      value={Math.round(currentConfig.rotation)}
                      onChange={e => updateActiveConfig({ rotation: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="wm-control-group">
                  <label>Opacidad ({Math.round(currentConfig.opacity * 100)}%)</label>
                  <input 
                    type="range" 
                    min="10" max="100" 
                    value={currentConfig.opacity * 100} 
                    onChange={e => updateActiveConfig({ opacity: Number(e.target.value) / 100 })}
                  />
                </div>

                <div className="wm-control-group">
                  <label>Posición Rápida</label>
                  <div className="wm-grid-positioner">
                    <button onClick={() => updateActiveConfig({ x: 0.1, y: 0.1, rotation: 0 })}></button>
                    <button onClick={() => updateActiveConfig({ x: 0.5, y: 0.1, rotation: 0 })}></button>
                    <button onClick={() => updateActiveConfig({ x: 0.9, y: 0.1, rotation: 0 })}></button>
                    <button onClick={() => updateActiveConfig({ x: 0.1, y: 0.5, rotation: 0 })}></button>
                    <button onClick={() => updateActiveConfig({ x: 0.5, y: 0.5, rotation: 0 })}></button>
                    <button onClick={() => updateActiveConfig({ x: 0.9, y: 0.5, rotation: 0 })}></button>
                    <button onClick={() => updateActiveConfig({ x: 0.1, y: 0.9, rotation: 0 })}></button>
                    <button onClick={() => updateActiveConfig({ x: 0.5, y: 0.9, rotation: 0 })}></button>
                    <button onClick={() => updateActiveConfig({ x: 0.9, y: 0.9, rotation: 0 })}></button>
                  </div>
                </div>
              </>
            )}

            <button className="btn-download-primary" onClick={handleProcessAndDownload} disabled={isProcessing || watermarks.length === 0}>
              {isProcessing ? 'Procesando...' : 'Aplicar y Descargar'}
            </button>

          </div>
        </aside>
      </div>
    </div>
  );
};
