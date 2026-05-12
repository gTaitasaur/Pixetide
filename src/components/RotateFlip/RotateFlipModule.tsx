import React, { useState, useEffect, useRef } from 'react';
import { DragAndDrop } from '../DragAndDrop/DragAndDrop';
import { processRotationAndFlip, RotateFlipParams } from '../../utils/rotateFlip';
import { validateImageFile } from '../../utils/fileUpload';
import { ImagePreviewCanvas } from '../UI/ImagePreviewCanvas/ImagePreviewCanvas';
import { useLocale } from '../../i18n/useLocale';
import './RotateFlipModule.css';

interface RotateFlipModuleProps {
  originalUrl: string | null;
  originalFile: File | null;
  onImageSelected: (url: string, file: File) => void;
  onClear: () => void;
}

export const RotateFlipModule: React.FC<RotateFlipModuleProps> = ({
  originalUrl,
  originalFile,
  onImageSelected,
}) => {
  const [params, setParams] = useState<RotateFlipParams>({
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLocale();

  // Resetear parámetros al cambiar de imagen
  useEffect(() => {
    setParams({
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
    });
  }, [originalUrl]);

  const processNewFile = (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      alert(t('shared.errorValidation') + ': ' + validation.error);
      return;
    }
    const url = URL.createObjectURL(file);
    onImageSelected(url, file);
  };

  const handleFlipHorizontal = () => {
    setParams(prev => ({ ...prev, flipHorizontal: !prev.flipHorizontal }));
  };

  const handleFlipVertical = () => {
    setParams(prev => ({ ...prev, flipVertical: !prev.flipVertical }));
  };

  const handleDownload = async () => {
    if (!originalFile) return;
    
    // Si no hubo cambios, solo descargar original
    if ((params.rotation % 360) === 0 && !params.flipHorizontal && !params.flipVertical) {
      const a = document.createElement('a');
      a.href = originalUrl as string;
      a.download = originalFile.name;
      a.click();
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processRotationAndFlip(originalFile, params);
      
      const a = document.createElement('a');
      a.href = result.url;
      // Añadir sufijo al nombre
      const baseName = originalFile.name.replace(/\.[^/.]+$/, "");
      const ext = originalFile.name.split('.').pop();
      a.download = `${baseName}_modificado.${ext}`;
      a.click();
      
      // Limpiar blob URL después de un rato
      setTimeout(() => URL.revokeObjectURL(result.url), 5000);
    } catch (error) {
      alert(t('shared.errorProcessing'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Si no hay imagen, mostrar el DragAndDrop
  if (!originalUrl || !originalFile) {
    return (
      <DragAndDrop onImageSelected={onImageSelected} />
    );
  }

  // Estilo CSS para la vista previa interactiva
  const previewStyle: React.CSSProperties = {
    transform: `rotate(${params.rotation}deg) scaleX(${params.flipHorizontal ? -1 : 1}) scaleY(${params.flipVertical ? -1 : 1})`,
    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const hasChanges = (params.rotation % 360) !== 0 || params.flipHorizontal || params.flipVertical;

  return (
    <div className="rotate-flip-container fade-in">
      {/* Barra de herramientas superior (Acciones secundarias) */}
      <div className="rf-top-bar">
        <button 
          className="btn-text-action" 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isProcessing}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          {t('shared.uploadAnother')}
        </button>
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
      </div>

      <div className="rf-main-layout">
        {/* Lado Izquierdo: El Visor de Imagen */}
        <div className="rf-workspace">
          <div className="rf-preview-card">
            <ImagePreviewCanvas 
              imageUrl={originalUrl} 
              maxHeight="60vh"
              imageStyle={previewStyle}
              rotate={params.rotation}
              alt="Vista previa"
            />
          </div>
        </div>

        {/* Lado Derecho: Controles y Acciones */}
        <aside className="rf-sidebar">
          <div className="rf-controls-section">
            <div className="rf-control-group">
              <div className="rf-control-header">
                <h4 className="rf-control-title">{t('rf.rotation')}</h4>
                <button 
                  className="rf-reset-btn" 
                  onClick={() => setParams(prev => ({ ...prev, rotation: 0 }))}
                  title={t('rf.resetRotation')}
                >
                  {t('rf.reset')}
                </button>
              </div>
              <div className="rf-slider-container">
                <div className="rf-slider-row">
                  <input 
                    type="range" 
                    min="-180" 
                    max="180" 
                    step="1"
                    value={params.rotation} 
                    onChange={(e) => setParams(prev => ({ ...prev, rotation: Number(e.target.value) }))}
                    className="rf-range-input"
                  />
                  <div className="rf-input-wrapper">
                    <input 
                      type="number" 
                      min="-180" 
                      max="180"
                      value={Math.round(params.rotation)}
                      onChange={(e) => setParams(prev => ({ ...prev, rotation: Number(e.target.value) }))}
                      className="rf-number-input"
                    />
                    <span className="rf-unit">°</span>
                  </div>
                </div>
                <div className="rf-quick-rotations">
                  <button onClick={() => setParams(prev => ({ ...prev, rotation: -90 }))}>-90°</button>
                  <button onClick={() => setParams(prev => ({ ...prev, rotation: 0 }))}>0°</button>
                  <button onClick={() => setParams(prev => ({ ...prev, rotation: 90 }))}>90°</button>
                  <button onClick={() => setParams(prev => ({ ...prev, rotation: 180 }))}>180°</button>
                </div>
              </div>
            </div>

            <div className="rf-control-group">
              <h4 className="rf-control-title">{t('rf.mirror')}</h4>
              <div className="rf-button-grid">
                <button className={`rf-tool-btn ${params.flipHorizontal ? 'is-active' : ''}`} onClick={handleFlipHorizontal} disabled={isProcessing}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>{t('rf.horizontal')}</span>
                </button>
                <button className={`rf-tool-btn ${params.flipVertical ? 'is-active' : ''}`} onClick={handleFlipVertical} disabled={isProcessing}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ transform: 'rotate(90deg)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>{t('rf.vertical')}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="rf-actions-panel">
            <button 
              className={`btn-download-primary ${!hasChanges ? 'is-original' : ''}`}
              onClick={handleDownload}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="btn-spinner"></div>
                  {t('shared.processing')}
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  {!hasChanges ? t('shared.downloadOriginal') : t('shared.download')}
                </>
              )}
            </button>
            <p className="rf-legal-hint">{t('shared.privacyLocal')}</p>
          </div>
        </aside>
      </div>
    </div>
  );
};
