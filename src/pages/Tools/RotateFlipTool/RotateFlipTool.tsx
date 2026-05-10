import React, { useState } from 'react';
import { RotateFlipModule } from '../../../components/RotateFlip/RotateFlipModule';
import { Workspace } from '../../../components/UI/Workspace/Workspace';

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
    <div className="home-container" style={{ paddingBottom: '80px' }}>
      <header className="tool-header">
        <h1 className="tool-title">Girar y Voltear <span>Imágenes.</span></h1>
        <p className="tool-subtitle">
          Rota y aplica efectos de espejo a tus fotos de manera fácil y rápida, 
          100% privado desde tu navegador.
        </p>
      </header>

      <Workspace>
        <RotateFlipModule 
          originalUrl={activeUrl}
          originalFile={activeFile}
          onImageSelected={handleImageSelected}
          onClear={handleClear}
        />
      </Workspace>
    </div>
  );
};
