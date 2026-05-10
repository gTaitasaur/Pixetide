import React, { useState } from 'react';
import { WatermarkModule } from '../../../components/Watermark/WatermarkModule';
import { Workspace } from '../../../components/UI/Workspace/Workspace';

export const WatermarkTool: React.FC = () => {
  const [photos, setPhotos] = useState<File[]>([]);

  const handleAddPhotos = (newFiles: File[]) => {
    setPhotos(prev => [...prev, ...newFiles]);
  };

  const handleClearAll = () => {
    setPhotos([]);
  };

  return (
    <div className="home-container" style={{ paddingBottom: '80px' }}>
      <header className="tool-header">
        <h1 className="tool-title">Poner Marca de <span>Agua a Fotos.</span></h1>
        <p className="tool-subtitle">
          Protege tus fotos añadiendo tu logo o firma como marca de agua. 
          Todo se procesa localmente en tu navegador para garantizar tu privacidad.
        </p>
      </header>

      <Workspace>
        <WatermarkModule
          photos={photos}
          onAddPhotos={handleAddPhotos}
          onClearAll={handleClearAll}
        />
      </Workspace>
    </div>
  );
};
