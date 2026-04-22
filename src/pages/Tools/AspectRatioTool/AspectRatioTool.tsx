import { CropperModule } from '../../../components/Cropper/CropperModule';
import { useState } from 'react';

export const AspectRatioTool: React.FC = () => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  return (
    <div className="home-container" style={{ paddingTop: '20px' }}>
      <section className="hero-section" style={{ marginBottom: '40px' }}>
        <h1 className="hero-title">Encuadre <span>perfecto.</span></h1>
        <p className="hero-subtitle">Adapta tus fotografías a las proporciones ideales para cada red social con un par de trazos.</p>
      </section>

      <CropperModule 
        imageUrl={currentImage} 
        onImageSelected={(url) => setCurrentImage(url)}
      />
    </div>
  );
};
