import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { WatermarkModule } from '../../../components/Watermark/WatermarkModule';
import './WatermarkTool.css';

export const WatermarkTool: React.FC = () => {
  const [photos, setPhotos] = useState<File[]>([]);

  const handleAddPhotos = (newFiles: File[]) => {
    setPhotos(prev => [...prev, ...newFiles]);
  };

  const handleClearAll = () => {
    setPhotos([]);
  };

  return (
    <div className="tool-page-container fade-in">
      <nav className="tool-nav">
        <Link to="/" className="back-link">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al Inicio
        </Link>
      </nav>

      <header className="tool-header">
        <h1>Poner Marca de Agua</h1>
        <p>Protege tus fotos añadiendo tu logo o firma como marca de agua. Todo se procesa localmente en tu navegador para garantizar tu privacidad.</p>
      </header>

      <WatermarkModule
        photos={photos}
        onAddPhotos={handleAddPhotos}
        onClearAll={handleClearAll}
      />
    </div>
  );
};
