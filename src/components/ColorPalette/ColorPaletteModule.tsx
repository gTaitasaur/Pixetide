import React, { useState, useRef } from 'react';
import { DragAndDrop } from '../DragAndDrop/DragAndDrop';
import { ImagePreviewCanvas } from '../UI/ImagePreviewCanvas/ImagePreviewCanvas';
import { validateImageFile } from '../../utils/fileUpload';
import { extractColorsFromImage, generateHarmonies } from '../../utils/colorExtractor';
import { ExtractedSwatch, ColorFormat, HarmonicColor } from '../../types/color';
import { showToast } from '../UI/Toast/toastManager';
import './ColorPaletteModule.css';

export const ColorPaletteModule: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [swatches, setSwatches] = useState<ExtractedSwatch[] | null>(null);
  const [harmonies, setHarmonies] = useState<HarmonicColor[] | null>(null);
  
  // Controles
  const [format, setFormat] = useState<ColorFormat>('HEX');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processNewFile = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      showToast(validation.error || 'Error al validar el archivo.', 'error');
      return;
    }
    
    // Revocar URL anterior
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    
    // Iniciar extracción
    setIsProcessing(true);
    try {
      const extracted = await extractColorsFromImage(url);
      setSwatches(extracted);

      // Generar armonías basadas en el color 'Vibrante'
      const vibrant = extracted.find(s => s.name === 'Vibrante');
      if (vibrant) {
        const generated = await generateHarmonies(vibrant.hex);
        setHarmonies(generated);
      } else {
        setHarmonies(null);
      }
    } catch (error) {
      console.error("Error extrayendo colores:", error);
      showToast('No se pudieron extraer los colores.', 'error');
      setSwatches(null);
      setHarmonies(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processNewFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleCopyColor = (colorCode: string) => {
    navigator.clipboard.writeText(colorCode).then(() => {
      showToast(`¡Copiado! ${colorCode}`, 'success', 2500);
    }).catch(() => {
      showToast('Error al copiar', 'error');
    });
  };

  if (!imageUrl) {
    return <DragAndDrop onImageSelected={(_url, file) => processNewFile(file)} />;
  }

  const getFormatCode = (color: ExtractedSwatch | import('../../types/color').HarmonicColorScale) => {
    switch (format) {
      case 'HEX': return color.hex;
      case 'RGB': return color.rgb;
      case 'HSL': return color.hsl;
      case 'OKLCH': return color.oklch;
      default: return color.hex;
    }
  };

  return (
    <div className="cp-container fade-in">
      <div className="cp-top-bar">
        <button className="btn-text-action" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Subir otra foto
        </button>
        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processNewFile(e.target.files[0]);
            e.target.value = ''; 
          }
        }} />
      </div>

      <div className="cp-main-layout">
        {/* Lado Izquierdo: El Visor */}
        <div className="cp-preview-card" onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }} onDrop={handleDrop}>
          <ImagePreviewCanvas imageUrl={imageUrl} maxHeight="60vh" className={`cp-preview-img ${isProcessing ? 'is-processing' : ''} ${isDragOver ? 'cropper-drag-over' : ''}`} alt="Vista previa" />
          {isProcessing && (
            <div className="cp-processing-overlay">
              <div className="cp-spinner"></div>
              <span className="cp-processing-text">Analizando colores...</span>
            </div>
          )}
        </div>

        {/* Sidebar: Controles */}
        <aside className="cp-sidebar">
          <div className="cp-section">
            <h4 className="cp-section-title">Formato de Color</h4>
            <div className="cp-format-grid">
              {(['HEX', 'RGB', 'HSL', 'OKLCH'] as ColorFormat[]).map(fmt => (
                <button key={fmt} type="button" className={`cp-format-btn ${format === fmt ? 'is-active' : ''}`} onClick={() => setFormat(fmt)}>
                  {fmt}
                </button>
              ))}
            </div>
          </div>
          <div className="cp-section">
             <h4 className="cp-section-title">Ayuda</h4>
             <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                Haz clic en cualquier bloque de color para copiar su código.
             </div>
          </div>
        </aside>

        {/* Barra de Paleta Principal */}
        {swatches && !isProcessing && (
          <div className="cp-palette-dock">
            {swatches.map((swatch, idx) => {
              const code = getFormatCode(swatch);
              return (
                <div key={idx} className="cp-swatch-item" onClick={() => handleCopyColor(code)} title={`Copiar ${swatch.name}`}>
                  <div className="cp-swatch-color" style={{ backgroundColor: swatch.hex }}>
                    <span className="cp-swatch-label-overlay" style={{ color: swatch.textColor }}>Copiar</span>
                  </div>
                  <div className="cp-swatch-info">
                    <span className="cp-swatch-name">{swatch.name}</span>
                    <span className="cp-swatch-code">{code}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SECCIÓN: Paleta Armónica */}
        {harmonies && !isProcessing && (
          <div className="cp-harmonies-wrapper">
             <h3 className="cp-section-title" style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Paleta Armónica</h3>
             <div className="cp-harmonies-list">
                {harmonies.map((harmony, idx) => (
                  <div key={idx} className="cp-harmony-row">
                    <h4 className="cp-harmony-type-title">{harmony.type}</h4>
                    <div className="cp-harmony-scale">
                      {harmony.colors.map((color, colorIdx) => {
                        const code = getFormatCode(color);
                        return (
                          <div 
                            key={colorIdx} 
                            className="cp-harmony-scale-item"
                            onClick={() => handleCopyColor(code)}
                            title={`Copiar ${code}`}
                          >
                            <div className="cp-harmony-scale-color" style={{ backgroundColor: color.hex }}>
                              <span className="cp-harmony-copy-text" style={{ color: color.textColor }}>Copiar</span>
                            </div>
                            <span className="cp-harmony-scale-hex">{code}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        <p className="cp-legal-hint">Tus colores se extraen localmente. Privacidad total garantizada.</p>
      </div>
    </div>
  );
};
