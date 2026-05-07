import React, { useRef, useEffect, useState } from 'react';
import './ImagePreviewCanvas.css';

/**
 * Propiedades del componente ImagePreviewCanvas.
 */
interface ImagePreviewCanvasProps {
  /** URL de la imagen a previsualizar */
  imageUrl: string;
  /** Texto alternativo para la imagen */
  alt?: string;
  /** Altura máxima del contenedor. Por defecto 500px */
  maxHeight?: string;
  /** Clase CSS adicional opcional */
  className?: string;
  /** Estilos en línea para la etiqueta img (útil para transformaciones) */
  imageStyle?: React.CSSProperties;
  /** Ángulo de rotación actual en grados */
  rotate?: number;
}

/**
 * Componente ImagePreviewCanvas
 * 
 * Estandariza la visualización de imágenes con soporte para transparencia
 * mediante un fondo de tablero de ajedrez (checkerboard) generado con CSS puro.
 * 
 * @param {ImagePreviewCanvasProps} props - Propiedades del componente.
 * @returns {JSX.Element} El componente de previsualización.
 */
export const ImagePreviewCanvas: React.FC<ImagePreviewCanvasProps> = ({
  imageUrl,
  alt = "Previsualización de imagen",
  maxHeight = "500px",
  className = "",
  imageStyle = {},
  rotate = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDim, setContainerDim] = useState({ w: 0, h: 0 });
  const [hasError, setHasError] = useState(false);

  // Guardián de seguridad: Si no hay imagen, no renderizamos nada
  if (!imageUrl) return null;

  // Monitorizamos el tamaño real del contenedor para ajustar la imagen al rotar
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerDim({ w: width, h: height });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Resetear error cuando cambia la URL
  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  const isRotated90 = Math.abs(rotate / 90) % 2 === 1;

  // Lógica crítica: Al estar rotada 90/270°, los límites se intercambian
  const finalImageStyle: React.CSSProperties = {
    ...imageStyle,
    width: isRotated90 ? `${containerDim.h}px` : '100%',
    height: isRotated90 ? `${containerDim.w}px` : '100%',
    transformOrigin: 'center center',
  };

  return (
    <div 
      ref={containerRef}
      className={`image-preview-canvas ${className} ${isRotated90 ? 'is-rotated' : ''} ${hasError ? 'image-preview-canvas--error' : ''}`} 
      style={{ height: maxHeight, maxHeight: maxHeight }}
    >
      {hasError ? (
        <div className="image-preview-canvas__error-msg">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>No se pudo cargar la imagen. El archivo podría estar corrupto o no ser válido.</p>
        </div>
      ) : (
        <img 
          src={imageUrl} 
          alt={alt} 
          className="image-preview-canvas__image" 
          style={finalImageStyle}
          loading="lazy"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
};

export default ImagePreviewCanvas;
