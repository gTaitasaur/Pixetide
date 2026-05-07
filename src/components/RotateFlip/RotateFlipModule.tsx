import React, { useState, useEffect, useRef } from 'react';
import { DragAndDrop } from '../DragAndDrop/DragAndDrop';
import { processRotationAndFlip, RotateFlipParams } from '../../utils/rotateFlip';
import { validateImageFile } from '../../utils/fileUpload';
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
  onClear,
}) => {
  const [params, setParams] = useState<RotateFlipParams>({
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      alert(validation.error);
      return;
    }
    const url = URL.createObjectURL(file);
    onImageSelected(url, file);
  };

  const handleRotateLeft = () => {
    setParams(prev => ({ ...prev, rotation: prev.rotation - 90 }));
  };

  const handleRotateRight = () => {
    setParams(prev => ({ ...prev, rotation: prev.rotation + 90 }));
  };

  const handleFlipHorizontal = () => {
    setParams(prev => {
      // Si la imagen está rotada 90 o 270 grados, el flip horizontal visualmente es un flip vertical de la imagen base.
      // Pero como estamos aplicando el flip EN CASCADA en CSS, solo invertimos el booleano.
      return { ...prev, flipHorizontal: !prev.flipHorizontal };
    });
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
      alert('Hubo un error al procesar la imagen.');
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
  const isRotated = Math.abs((params.rotation / 90) % 2) === 1;
  const previewStyle: React.CSSProperties = {
    transform: `rotate(${params.rotation}deg) scaleX(${params.flipHorizontal ? -1 : 1}) scaleY(${params.flipVertical ? -1 : 1})`,
    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    // Para evitar que se corte al rotar 90/270 grados (la altura original se vuelve ancho, y el ancho original se vuelve altura)
    maxWidth: isRotated ? '380px' : '100%',
    maxHeight: isRotated ? '100%' : '380px'
  };

  const hasChanges = (params.rotation % 360) !== 0 || params.flipHorizontal || params.flipVertical;

  return (
    <div className="rotate-flip-stage">
      <div className="rotate-flip-hero">
        
        {/* Acciones Superiores */}
        <div className="rotate-flip-header-actions">
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
          <button 
            className="btn-secondary" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isProcessing}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18" style={{marginRight: 6, verticalAlign: 'text-bottom'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Cambiar Imagen
          </button>
          
          <button className="btn-clear-all" onClick={onClear} disabled={isProcessing}>
            Quitar
          </button>
        </div>

        {/* Zona de Vista Previa */}
        <div className="rotate-flip-preview-container">
          <div className="preview-checkerboard">
            <img 
              src={originalUrl} 
              alt="Preview" 
              className="rotate-flip-preview-img" 
              style={previewStyle}
            />
          </div>
        </div>

        {/* Controles de Herramientas */}
        <div className="rotate-flip-controls">
          <div className="control-group">
            <span className="control-label">Rotar</span>
            <div className="button-row">
              <button className="tool-btn" onClick={handleRotateLeft} disabled={isProcessing} title="Rotar a la izquierda">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>-90°</span>
              </button>
              <button className="tool-btn" onClick={handleRotateRight} disabled={isProcessing} title="Rotar a la derecha">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
                <span>+90°</span>
              </button>
            </div>
          </div>

          <div className="control-divider"></div>

          <div className="control-group">
            <span className="control-label">Efecto Espejo</span>
            <div className="button-row">
              <button className={`tool-btn ${params.flipHorizontal ? 'active' : ''}`} onClick={handleFlipHorizontal} disabled={isProcessing} title="Voltear horizontalmente">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Horizontal</span>
              </button>
              <button className={`tool-btn ${params.flipVertical ? 'active' : ''}`} onClick={handleFlipVertical} disabled={isProcessing} title="Voltear verticalmente">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ transform: 'rotate(90deg)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Vertical</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Botón de Acción Principal */}
      <div className="rotate-flip-actions">
        <button 
          className={`btn-success ${!hasChanges ? 'no-changes' : ''}`}
          onClick={handleDownload}
          disabled={isProcessing}
        >
          {isProcessing ? 'Procesando imagen...' : (!hasChanges ? 'Descargar Original' : 'Descargar Imagen Modificada')}
        </button>
      </div>
    </div>
  );
};
