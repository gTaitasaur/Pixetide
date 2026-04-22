import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import { AspectRatioControls } from './AspectRatioControls';
import { exportCroppedImage } from '../../utils/imageExport';
import { validateImageFile } from '../../utils/fileUpload';
import './CropperModule.css';

import { DragAndDrop } from '../DragAndDrop/DragAndDrop';

interface CropperModuleProps {
  imageUrl: string | null;
  onImageSelected: (url: string, file: File) => void;
}

// Función auxiliar para forzar el recorte al máximo espacio posible sin salirse de la imagen
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): PixelCrop {
  let cropWidth = mediaWidth;
  let cropHeight = mediaWidth / aspect;

  if (cropHeight > mediaHeight) {
    cropHeight = mediaHeight;
    cropWidth = mediaHeight * aspect;
  }

  return {
    unit: 'px',
    x: (mediaWidth - cropWidth) / 2,
    y: (mediaHeight - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  };
}

function fullFreeCrop(mediaWidth: number, mediaHeight: number): PixelCrop {
  return { unit: 'px', x: 0, y: 0, width: mediaWidth, height: mediaHeight };
}

export const CropperModule: React.FC<CropperModuleProps> = ({ imageUrl, onImageSelected }) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processNewFile = (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    const url = URL.createObjectURL(file);
    onImageSelected(url, file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processNewFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  // Cuando la imagen se carga, cuadramos el crop por defecto
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = aspect 
      ? centerAspectCrop(width, height, aspect)
      : fullFreeCrop(width, height);
      
    setCrop(initialCrop);
    // Soluciona el problema de no poder descargar sin mover primero
    setCompletedCrop(initialCrop); 
  }, [aspect]);

  const handleRatioChange = (newAspect: number | undefined) => {
    setAspect(newAspect);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const newCrop = newAspect 
        ? centerAspectCrop(width, height, newAspect)
        : fullFreeCrop(width, height);
        
      setCrop(newCrop);
      // Soluciona el problema de no poder descargar tras clickear botón
      setCompletedCrop(newCrop); 
    }
  };

  const handleDownload = async () => {
    if (!completedCrop || !imgRef.current) return;
    
    // Evitamos clics dobles fastidiosos
    if(isExporting) return;
    setIsExporting(true);

    try {
      const localUrl = await exportCroppedImage(imgRef.current, completedCrop);
      
      // Auto-descargamos creando un tag <a> efímero
      const a = document.createElement('a');
      a.href = localUrl;
      a.download = `recorte-${Date.now()}.jpg`;
      a.click();
      
      // Limpiamos la memoria
      URL.revokeObjectURL(localUrl);
    } catch (error) {
      console.error('Error exportando la imagen: ', error);
      alert('Hubo un problema procesando el recorte.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="cropper-stage">
      <AspectRatioControls 
        currentRatio={aspect} 
        disabled={!imageUrl}
        onChangeRatio={handleRatioChange} 
      />

      <div 
        className="cropper-image-wrapper" 
        style={{
          border: isDragOver ? '3px dashed var(--color-accent)' : undefined,
          position: 'relative'
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={handleDrop}
      >
        {imageUrl ? (
          <>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  processNewFile(e.target.files[0]);
                }
              }}
            />
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button 
                className="btn-secondary-hand" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isExporting}
              >
                Cambiar Imagen
              </button>
            </div>
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              keepSelection
            >
              <img 
                ref={imgRef} 
                src={imageUrl} 
                alt="Para recortar" 
                onLoad={onImageLoad} 
              />
            </ReactCrop>
          </>
        ) : (
          <div style={{ width: '100%', minHeight: '350px', display: 'flex' }}>
            <DragAndDrop onImageSelected={onImageSelected} />
          </div>
        )}
      </div>

      {!imageUrl ? (
        <p className="cropper-hint">Sube una foto para empezar a recortar</p>
      ) : (
        <button 
          className="btn-download" 
          onClick={handleDownload}
          disabled={!completedCrop || isExporting}
        >
          {isExporting ? 'Guardando trazos...' : 'Descargar Recorte'}
        </button>
      )}
    </div>
  );
};
