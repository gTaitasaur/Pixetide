import React, { useState, useEffect, useCallback } from 'react';
import { OptimizationPreset, OPTIMIZATION_PRESETS } from '../../types/optimizer';
import { rawOptimizeImage, formatBytes, OptimizationResult } from '../../utils/imageOptimizer';
import { PresetSelector } from './PresetSelector';
import { validateImageFile } from '../../utils/fileUpload';
import './OptimizerModule.css';

import { DragAndDrop } from '../DragAndDrop/DragAndDrop';

interface OptimizerModuleProps {
  originalUrl: string | null;
  originalFile: File | null;
  onImageSelected: (url: string, file: File) => void;
}

export const OptimizerModule: React.FC<OptimizerModuleProps> = ({ originalUrl, originalFile, onImageSelected }) => {
  // Opciones de configuración del usuario
  const [selectedPreset, setSelectedPreset] = useState<OptimizationPreset>(OPTIMIZATION_PRESETS[1]); // Default a Normal
  const [preserveResolution, setPreserveResolution] = useState<boolean>(false);
  const [useWebP, setUseWebP] = useState<boolean>(true); // WebP como recomendado

  // Estados de procesamiento
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processNewFile = (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    const url = URL.createObjectURL(file);
    onImageSelected(url, file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processNewFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
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
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, selectedPreset, preserveResolution, useWebP]);

  useEffect(() => {
    handleOptimize();
  }, [handleOptimize]);

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.file.name;
    a.click();
  };

  return (
    <div className="optimizer-stage">
      
      {/* Zona de Vista Previa */}
      <div 
        className="optimizer-hero" 
        style={{
          border: isDragOver ? '3px dashed var(--color-accent)' : undefined,
          position: 'relative'
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={handleDrop}
      >
        
        {originalUrl && originalFile ? (
          <>
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
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button 
                className="btn-secondary" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isProcessing}
              >
                Cambiar Imagen
              </button>
            </div>
            <div className="optimizer-preview-container">
              <img 
                src={result ? result.url : originalUrl} 
                alt="Preview" 
                className={`optimizer-preview-img ${isProcessing ? 'is-processing' : ''}`} 
              />
              {isProcessing && (
                <div className="processing-spinner-overlay">
                  <div className="spinner"></div>
                  <span className="processing-text">Optimizando...</span>
                </div>
              )}
            </div>
            <div className="optimizer-stats-panel">
              <div className="stat-group">
                <span className="stat-label">Original</span>
                <span className="stat-value">{formatBytes(originalFile.size)}</span>
              </div>
              
              {result && (
                <>
                  <div className="stat-arrow">→</div>
                  <div className="stat-group success">
                    <span className="stat-label">Optimizado</span>
                    <span className="stat-value">{formatBytes(result.newSize)}</span>
                  </div>
                  <div className="stat-badge">
                    -{result.reductionPercentage.toFixed(1)}%
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div style={{ width: '100%', minHeight: '350px', display: 'flex' }}>
            <DragAndDrop onImageSelected={onImageSelected} />
          </div>
        )}
      </div>

      {/* Controles de Configuración */}
      <div className="optimizer-controls">
        <h3 className="section-title">Nivel de Optimización</h3>
        <PresetSelector 
          selectedId={selectedPreset.id} 
          disabled={!originalUrl}
          onSelect={(preset) => setSelectedPreset(preset)} 
        />

        {/* Opciones Avanzadas */}
        <div 
          className="advanced-toggles" 
          style={{ 
            opacity: !originalUrl ? 0.4 : 1,
            pointerEvents: !originalUrl ? 'none' : 'auto'
          }}
        >
          <label className="toggle-label">
            <input 
              type="checkbox" 
              checked={preserveResolution} 
              onChange={(e) => setPreserveResolution(e.target.checked)} 
            />
            <div className="toggle-text">
              <strong>Conservar resolución original</strong>
              <span>Evita que la imagen cambie su ancho o alto. Mantiene sus dimensiones originales.</span>
            </div>
          </label>

          <label className="toggle-label">
            <input 
              type="checkbox" 
              checked={useWebP} 
              onChange={(e) => setUseWebP(e.target.checked)} 
            />
            <div className="toggle-text">
              <strong>Convertir a formato WebP</strong>
              <span>Genera un archivo ultra liviano ideal para web. Desmarca para conservar formato original.</span>
            </div>
          </label>
        </div>

        {/* Acciones */}
        <div className="optimizer-actions">
          {!originalUrl ? (
            <p className="optimizer-hint">Sube una foto para empezar a optimizar</p>
          ) : (
            <button 
              className="btn-success" 
              onClick={handleDownload}
              disabled={isProcessing || !result}
            >
              {isProcessing ? 'Calculando peso...' : `Descargar (${formatBytes(result?.newSize || 0)})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
