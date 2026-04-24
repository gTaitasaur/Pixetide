import React, { useState } from 'react';
import { ConverterModule } from '../../../components/Converter/ConverterModule';

export const ConverterTool: React.FC = () => {
  const [activeFiles, setActiveFiles] = useState<File[]>([]);

  const handleAddFiles = (newFiles: File[]) => {
    setActiveFiles(prev => [...prev, ...newFiles]);
  };

  const handleClearAll = () => {
    setActiveFiles([]);
  };

  return (
    <div className="home-container" style={{ paddingTop: '20px' }}>
      <section className="hero-section" style={{ marginBottom: '40px' }}>
        <h1 className="hero-title">Formatos <span>mágicos.</span></h1>
        <p className="hero-subtitle">Convierte tus imágenes al formato que necesites en segundos, sin subir nada a internet.</p>
      </section>

      <ConverterModule 
        files={activeFiles} 
        onAddFiles={handleAddFiles} 
        onClearAll={handleClearAll}
      />
    </div>
  );
};
