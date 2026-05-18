import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop, convertToPixelCrop } from 'react-image-crop';
import { AspectRatioControls } from './AspectRatioControls';
import { exportCroppedImage } from '../../shared/utils/imageExport';
import { validateImageFile } from '../../shared/utils/fileUpload';
import { DragAndDrop } from '../../shared/components/DragAndDrop/DragAndDrop';
import { ImagePreviewCanvas } from '../../shared/components/UI/ImagePreviewCanvas/ImagePreviewCanvas';
import { showToast } from '../../shared/components/UI/Toast/toastManager';
import { useLocale } from '../../core/i18n/useLocale';
import { Button } from '../../shared/components/UI/Button/Button';
import { DownloadButton } from '../../shared/components/UI/DownloadButton/DownloadButton';
import './CropperModule.css';

interface CropperModuleProps {
  imageUrl: string | null;
  onImageSelected: (url: string, file: File) => void;
}

export const CropperModule: React.FC<CropperModuleProps> = ({ imageUrl, onImageSelected }) => {
  // Usamos unidades en % para el estado del crop para que sea responsivo nativamente
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const { t } = useLocale();
  
  // Dimensiones para responsividad
  const [naturalDim, setNaturalDim] = useState({ w: 0, h: 0 });
  const [renderDim, setRenderDim] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Detectar tamaño del contenedor
  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, [imageUrl]);

  // 2. Calcular dimensiones renderizadas (Object-fit: contain manual)
  useEffect(() => {
    if (naturalDim.w === 0 || containerSize.w === 0) return;

    const ratio = Math.min(containerSize.w / naturalDim.w, containerSize.h / naturalDim.h);
    const newRenderDim = {
      w: Math.floor(naturalDim.w * ratio),
      h: Math.floor(naturalDim.h * ratio)
    };

    setRenderDim(newRenderDim);

    // Si no hay crop, inicializamos uno al máximo tamaño posible
    if (!crop && newRenderDim.w > 0) {
      const initialCrop = aspect 
        ? centerCrop(makeAspectCrop({ unit: '%', width: 100 }, aspect, newRenderDim.w, newRenderDim.h), newRenderDim.w, newRenderDim.h)
        : { unit: '%' as const, x: 0, y: 0, width: 100, height: 100 };
      
      setCrop(initialCrop);
      // Actualizamos el crop completado para permitir descarga inmediata
      setCompletedCrop(convertToPixelCrop(initialCrop, newRenderDim.w, newRenderDim.h));
    } else if (crop && newRenderDim.w > 0) {
      // Si ya hay un crop (en %), actualizamos el completedCrop (en px) para la nueva escala
      setCompletedCrop(convertToPixelCrop(crop, newRenderDim.w, newRenderDim.h));
    }
  }, [containerSize, naturalDim, aspect]);

  const processNewFile = (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    const url = URL.createObjectURL(file);
    onImageSelected(url, file);
    setNaturalDim({ w: 0, h: 0 });
    setRenderDim({ w: 0, h: 0 });
    setCrop(undefined);
    setCompletedCrop(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processNewFile(e.dataTransfer.files[0]);
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNaturalDim({ w: naturalWidth, h: naturalHeight });
  }, []);

  const handleRatioChange = (newAspect: number | undefined) => {
    setAspect(newAspect);
    if (renderDim.w > 0) {
      const newCrop = newAspect 
        ? centerCrop(makeAspectCrop({ unit: '%', width: 100 }, newAspect, renderDim.w, renderDim.h), renderDim.w, renderDim.h)
        : { unit: '%' as const, x: 0, y: 0, width: 100, height: 100 };
      setCrop(newCrop);
      setCompletedCrop(convertToPixelCrop(newCrop, renderDim.w, renderDim.h));
    }
  };

  const handleDownload = async () => {
    if (!completedCrop || !imgRef.current) return;
    if (isExporting) return;
    setIsExporting(true);

    try {
      const localUrl = await exportCroppedImage(imgRef.current, completedCrop);
      const a = document.createElement('a');
      a.href = localUrl;
      a.download = `recorte-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(localUrl);
    } catch (error) {
      console.error('Error exportando:', error);
      showToast(t('shared.errorExport'), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (!imageUrl) {
    return <DragAndDrop onImageSelected={onImageSelected} />;
  }

  return (
    <div className="cropper-container fade-in">
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processNewFile(e.target.files[0]);
          }
        }}
      />

      {/* Barra superior de acciones rápidas */}
      <div className="cropper-top-bar">
        <Button 
          variant="secondary" 
          onClick={() => fileInputRef.current?.click()}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>}
        >
          {t('shared.uploadAnother')}
        </Button>
      </div>

      <div className="cropper-main-layout">
        {/* Visor de Imagen (Lado Izquierdo) */}
        <div className="cropper-workspace">
          <ImagePreviewCanvas 
            imageUrl={imageUrl} 
            maxHeight="65vh"
            className={isDragOver ? 'cropper-drag-over' : ''}
          >
            <div 
              ref={stageRef}
              className="cropper-canvas-inner"
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
              onDrop={handleDrop}
            >
              {renderDim.w > 0 && (
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  keepSelection
                  style={{ width: renderDim.w, height: renderDim.h }}
                >
                  <img 
                    ref={imgRef} 
                    src={imageUrl} 
                    alt="Imagen para recortar" 
                    style={{ width: renderDim.w, height: renderDim.h, display: 'block' }}
                    onLoad={onImageLoad} 
                  />
                </ReactCrop>
              )}

              {/* Imagen invisible de apoyo para dimensiones iniciales */}
              {renderDim.w === 0 && (
                <img 
                  src={imageUrl} 
                  alt="Loading" 
                  style={{ opacity: 0, position: 'absolute' }} 
                  onLoad={onImageLoad} 
                />
              )}
            </div>
          </ImagePreviewCanvas>
        </div>

        {/* Panel de Controles (Lado Derecho) */}
        <aside className="cropper-sidebar">
          <AspectRatioControls 
            currentRatio={aspect} 
            disabled={!imageUrl}
            onChangeRatio={handleRatioChange} 
          />

          <div className="cropper-actions-panel">
            <DownloadButton 
              onClick={handleDownload}
              disabled={!completedCrop || isExporting}
              isLoading={isExporting}
              fullWidth
            >
              {t('shared.downloadCrop')}
            </DownloadButton>
            <p className="cropper-legal-hint">{t('shared.privacyShort')}</p>
          </div>
        </aside>
      </div>
    </div>
  );
};
