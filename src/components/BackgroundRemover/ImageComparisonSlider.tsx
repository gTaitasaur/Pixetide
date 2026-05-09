import React, { useState, useRef, useEffect, TouchEvent, MouseEvent } from 'react';
import { ImagePreviewCanvas } from '../UI/ImagePreviewCanvas/ImagePreviewCanvas';
import './ImageComparisonSlider.css';

interface ImageComparisonSliderProps {
  originalSrc: string;
  resultSrc: string;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({ originalSrc, resultSrc }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <ImagePreviewCanvas imageUrl={resultSrc} maxHeight="60vh" className="comparison-wrapper">
      <div 
        className="comparison-container"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseLeave={handleMouseUp}
      >
        {/* Imagen RESULTADO (sin fondo) que está por debajo de todo */}
        <img src={resultSrc} alt="Resultado sin fondo" className="comparison-img-base" draggable={false} />
        
        {/* Imagen ORIGINAL (con fondo) que se recorta con clip-path */}
        <div 
          className="comparison-overlay"
          style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
        >
          <img src={originalSrc} alt="Original con fondo" className="comparison-img-overlay" draggable={false} />
        </div>
        
        {/* Línea del slider interactivo */}
        <div 
          className="comparison-slider-line"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          <div className="comparison-slider-handle">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" transform="rotate(90 12 12)" />
            </svg>
          </div>
        </div>
      </div>
    </ImagePreviewCanvas>
  );
};
