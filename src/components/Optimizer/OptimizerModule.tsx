import React, { useState, useEffect, useCallback, useRef } from 'react';
import { OptimizationPreset, OPTIMIZATION_PRESETS } from '../../types/optimizer';
import { rawOptimizeImage, formatBytes, OptimizationResult } from '../../utils/imageOptimizer';
import { PresetSelector } from './PresetSelector';
import { validateImageFile } from '../../utils/fileUpload';
import { DragAndDrop } from '../DragAndDrop/DragAndDrop';
import { ImagePreviewCanvas } from '../UI/ImagePreviewCanvas/ImagePreviewCanvas';
import { showToast } from '../UI/Toast/toastManager';
import { useLocale } from '../../i18n/useLocale';
import './OptimizerModule.css';

interface OptimizerModuleProps {
  originalUrl: string | null;
  originalFile: File | null;
  onImageSelected: (url: string, file: File) => void;
}

export const OptimizerModule: React.FC<OptimizerModuleProps> = ({ originalUrl, originalFile, onImageSelected }) => {
  // Opciones de configuración
  const [selectedPreset, setSelectedPreset] = useState<OptimizationPreset>(OPTIMIZATION_PRESETS[1]);
  const [preserveResolution, setPreserveResolution] = useState<boolean>(false);
  const [useWebP, setUseWebP] = useState<boolean>(true);
  const { t } = useLocale();

  // Estados de procesamiento
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processNewFile = (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      showToast(t('shared.errorValidation') + ': ' + (validation.error || ''), 'error');
      return;
    }
    const url = URL.createObjectURL(file);
    onImageSelected(url, file);
    setResult(null); // Resetear resultado previo
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processNewFile(e.dataTransfer.files[0]);
    }
  };

  const handleOptimize = useCallback(async () => {
    if (!originalFile) return;
    setIsProcessing(true);
    try {
      const optimized = await rawOptimizeImage(originalFile, selectedPreset, preserveResolution, useWebP);
      setResult(optimized);
    } catch (err) {
      console.error(err);
      showToast(t('opt.errorOptimize'), 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, selectedPreset, preserveResolution, useWebP, t]);

  // Ejecutar optimización automáticamente al cambiar parámetros
  useEffect(() => {
    if (originalFile) {
      handleOptimize();
    }
  }, [handleOptimize, originalFile]);

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.file.name;
    a.click();
    showToast(t('opt.downloadSuccess'), 'success');
  };

  if (!originalUrl) {
    return <DragAndDrop onImageSelected={onImageSelected} />;
  }

  return (
    <div className="optimizer-container fade-in">
      {/* Barra superior de acciones */}
      <div className="opt-top-bar">
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

      <div className="opt-main-layout">
        {/* Lado Izquierdo: El Visor de Imagen */}
        <div className="opt-workspace">
          <div 
            className="opt-preview-card"
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={handleDrop}
          >
            <ImagePreviewCanvas 
              imageUrl={result ? result.url : originalUrl} 
              maxHeight="60vh"
              className={`opt-preview-img ${isProcessing ? 'is-processing' : ''} ${isDragOver ? 'cropper-drag-over' : ''}`}
              alt="Vista previa"
            />
            
            {isProcessing && (
              <div className="opt-processing-overlay">
                <div className="opt-spinner"></div>
                <span className="opt-processing-text">{t('opt.optimizing')}</span>
              </div>
            )}
          </div>

          {/* Barra de Resultados (Dock horizontal) */}
          <div className="opt-results-bar">
            <div className="opt-res-group">
              <span className="opt-res-label">{t('opt.original')}</span>
              <span className="opt-res-value">{formatBytes(originalFile!.size)}</span>
            </div>
            
            <div className="opt-res-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>

            <div className="opt-res-group success">
              <span className="opt-res-label">{t('opt.optimized')}</span>
              <span className="opt-res-value">{result ? formatBytes(result.newSize) : '---'}</span>
            </div>

            {result && (
              <div className="opt-res-badge">
                -{result.reductionPercentage.toFixed(1)}%
              </div>
            )}
          </div>

          {/* Hint informativo */}
          <p className="optimizer-hint">{t('shared.privacyLocal')}</p>
        </div>

        {/* Lado Derecho: Controles y Estadísticas */}
        <aside className="opt-sidebar">
          {/* Configuración */}
          <div className="opt-section">
            <h4 className="opt-section-title">{t('opt.compression')}</h4>
            <p className="opt-section-desc">
              {t('opt.compressionDesc')}
            </p>
            <PresetSelector 
              selectedId={selectedPreset.id} 
              disabled={isProcessing}
              onSelect={(preset) => setSelectedPreset(preset)} 
            />
          </div>

          {/* Opciones Avanzadas */}
          <div className="opt-section">
            <h4 className="opt-section-title">{t('opt.options')}</h4>
            <div className="opt-advanced">
              <label className="opt-toggle">
                <input 
                  type="checkbox" 
                  checked={preserveResolution} 
                  onChange={(e) => setPreserveResolution(e.target.checked)} 
                  disabled={isProcessing}
                />
                <div className="opt-toggle-content">
                  <span className="opt-toggle-title">{t('opt.keepDimensions')}</span>
                  <span className="opt-toggle-desc">{t('opt.keepDimensionsDesc')}</span>
                </div>
              </label>

              <label className="opt-toggle">
                <input 
                  type="checkbox" 
                  checked={useWebP} 
                  onChange={(e) => setUseWebP(e.target.checked)} 
                  disabled={isProcessing}
                />
                <div className="opt-toggle-content">
                  <span className="opt-toggle-title">{t('opt.webpFormat')}</span>
                  <span className="opt-toggle-desc">{t('opt.webpFormatDesc')}</span>
                </div>
              </label>
            </div>
          </div>

          {/* Botón de Acción Principal */}
          <div className="opt-actions">
            <button 
              className="btn-download-primary" 
              onClick={handleDownload}
              disabled={isProcessing || !result}
            >
              {isProcessing ? (
                <>
                  <div className="btn-spinner"></div>
                  {t('shared.processing')}
                </>
              ) : (
                <>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  {t('shared.download')}
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
