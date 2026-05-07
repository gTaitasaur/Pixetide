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

  const isRotated90 = Math.abs(rotate / 90) % 2 === 1;

  // Lógica crítica: Al estar rotada 90/270°, los límites se intercambian
  // El ancho físico de la imagen se limita por la altura del contenedor
  // La altura física de la imagen se limita por el ancho del contenedor
  const finalImageStyle: React.CSSProperties = {
    ...imageStyle,
    maxWidth: isRotated90 ? `${containerDim.h}px` : '100%',
    maxHeight: isRotated90 ? `${containerDim.w}px` : '100%',
    // Forzamos que la rotación siempre sea sobre el eje central
    transformOrigin: 'center center',
  };

  return (
    <div 
      ref={containerRef}
      className={`image-preview-canvas ${className} ${isRotated90 ? 'is-rotated' : ''}`} 
      style={{ height: maxHeight, maxHeight: maxHeight }}
    >
      <img 
        src={imageUrl} 
        alt={alt} 
        className="image-preview-canvas__image" 
        style={finalImageStyle}
        loading="lazy"
      />
    </div>
  );
};

export default ImagePreviewCanvas;
