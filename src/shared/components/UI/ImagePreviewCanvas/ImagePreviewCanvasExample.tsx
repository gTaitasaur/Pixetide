import React, { useState } from 'react';
import { ImagePreviewCanvas } from './ImagePreviewCanvas';

/**
 * Ejemplo de uso del componente ImagePreviewCanvas.
 * 
 * Este componente demuestra cómo integrar la previsualización estándar
 * en cualquier herramienta de edición.
 */
export const ImagePreviewCanvasExample: React.FC = () => {
  const [sampleImage] = useState<string>("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1000");

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Demo de ImagePreviewCanvas</h1>
      
      <p>
        Este componente proporciona una base estandarizada para mostrar imágenes,
        incluyendo soporte para transparencia y escalado automático.
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h3>1. Vista Estándar (maxHeight: 500px)</h3>
        <ImagePreviewCanvas 
          imageUrl={sampleImage} 
          alt="Imagen de ejemplo" 
        />
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h3>2. Vista Compacta (maxHeight: 300px)</h3>
        <ImagePreviewCanvas 
          imageUrl={sampleImage} 
          maxHeight="300px" 
          alt="Imagen compacta"
        />
      </section>

      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        borderLeft: '4px solid #007bff'
      }}>
        <strong>Nota técnica:</strong> El fondo de cuadros es CSS puro y se adapta
        a cualquier tamaño. La imagen siempre usa <code>object-fit: contain</code> para 
        garantizar que nunca se recorte, independientemente de su relación de aspecto.
      </div>
    </div>
  );
};

export default ImagePreviewCanvasExample;
