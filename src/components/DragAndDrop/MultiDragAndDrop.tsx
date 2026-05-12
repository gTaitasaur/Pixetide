import React, { useState, DragEvent, ChangeEvent } from 'react';
import './DragAndDrop.css'; // Reutilizamos estilos base
import { validateImageFile } from '../../utils/fileUpload';
import { useLocale } from '../../i18n/useLocale';

interface MultiDragAndDropProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number; // Si no se pasa, no hay límite
}

export const MultiDragAndDrop: React.FC<MultiDragAndDropProps> = ({ onFilesSelected, maxFiles }) => {
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLocale();

  const processFiles = (fileList: FileList | File[]) => {
    setError(null);
    const validFiles: File[] = [];
    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      const validation = validateImageFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        // Localizamos el error de validación dinámico
        setError(t('conv.invalidFile').replace('{name}', file.name).replace('{error}', validation.error || ''));
      }
    }

    if (maxFiles && validFiles.length > maxFiles) {
      setError(t('conv.maxFilesError').replace('{max}', maxFiles.toString()));
      onFilesSelected(validFiles.slice(0, maxFiles));
    } else if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    } else if (!error) {
      setError(t('conv.noValidImages'));
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
          aria-label={t('dragdrop.multiAriaLabel')}
        />
        <div className="drop-zone-content">
          <svg className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <span className="text-primary">{t('dragdrop.multiPrompt')}</span>
          <span className="text-secondary">{t('dragdrop.multiHint')}</span>
        </div>
      </div>
    </div>
  );
};
