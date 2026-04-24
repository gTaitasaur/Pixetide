import React, { useState } from 'react';
import { OptimizerModule } from '../../../components/Optimizer/OptimizerModule';

export const OptimizerTool: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const handleImageSelected = (url: string, file: File) => {
    setCurrentUrl(url);
    setCurrentFile(file);
  };

  return (
    <div className="home-container" style={{ paddingTop: '20px' }}>
      <section className="hero-section" style={{ marginBottom: '40px' }}>
        <h1 className="hero-title">Peso <span>pluma.</span></h1>
        <p className="hero-subtitle">Reduce el tamaño de tus imágenes hasta un 80% sin que nadie note la diferencia.</p>
      </section>

      <OptimizerModule 
        originalUrl={currentUrl}
        originalFile={currentFile}
        onImageSelected={handleImageSelected}
      />
    </div>
  );
};
