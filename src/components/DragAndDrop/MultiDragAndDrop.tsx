import React, { useState, DragEvent, ChangeEvent } from 'react';
import './DragAndDrop.css'; // Reutilizamos estilos base
import { validateImageFile } from '../../utils/fileUpload';

interface MultiDragAndDropProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number; // Si no se pasa, no hay límite
}

export const MultiDragAndDrop: React.FC<MultiDragAndDropProps> = ({ onFilesSelected, maxFiles }) => {
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = (fileList: FileList | File[]) => {
    setError(null);
    const validFiles: File[] = [];
    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      const validation = validateImageFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        setError(`El archivo ${file.name} no es válido: ${validation.error}`);
        // Si hay un error con uno, podríamos rechazarlo o saltarlo. 
        // Para UX, si saltamos, el usuario no sabe por qué no subió. Mejor mostramos error y paramos si es crítico, 
        // o mejor solo ignoramos los malos y mostramos error general.
        // Aquí añadiremos solo los válidos y mostraremos el error del último archivo inválido.
      }
    }

    if (maxFiles && validFiles.length > maxFiles) {
      setError(`Solo puedes subir un máximo de ${maxFiles} imágenes a la vez.`);
      onFilesSelected(validFiles.slice(0, maxFiles));
    } else if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    } else if (!error) {
      setError("No se encontraron imágenes válidas.");
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Limpiamos el input para permitir subir la misma foto después si fue borrada
      e.target.value = ''; 
    }
  };

  return (
    <div className="drag-drop-container">
      {error && <div className="error-message" style={{ marginBottom: '16px' }}>{error}</div>}
      
      <div 
        className={`drop-zone ${isDragActive ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          accept="image/*" 
          multiple
          className="file-input" 
          onChange={handleChange}
          aria-label="Subir imágenes"
        />
        <div className="drop-zone-content">
          <svg className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          <span className="text-primary">Selecciona tus imágenes</span>
          <span className="text-secondary">Haz clic o arrastra fotos aquí</span>
        </div>
      </div>
    </div>
  );
};
