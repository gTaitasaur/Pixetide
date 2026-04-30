import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateFlipModule } from '../../../components/RotateFlip/RotateFlipModule';
import './RotateFlipTool.css';

export const RotateFlipTool: React.FC = () => {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<File | null>(null);

  const handleImageSelected = (url: string, file: File) => {
    setActiveUrl(url);
    setActiveFile(file);
  };

  const handleClear = () => {
    setActiveUrl(null);
    setActiveFile(null);
  };

  return (
    <div className="tool-page-container fade-in">
      {/* Navegación tipo "Breadcrumb" / Regresar */}
      <nav className="tool-nav">
        <Link to="/" className="back-link">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al Inicio
        </Link>
      </nav>

      {/* Título de la Herramienta */}
      <header className="tool-header">
        <h1>Girar y Voltear Imágenes</h1>
        <p>Rota y aplica efectos de espejo a tus fotos de manera fácil y rápida, 100% privado desde tu navegador.</p>
      </header>

      {/* Contenedor principal de la herramienta */}
      <RotateFlipModule 
        originalUrl={activeUrl}
        originalFile={activeFile}
        onImageSelected={handleImageSelected}
        onClear={handleClear}
      />
    </div>
  );
};
