import React, { useState, DragEvent, ChangeEvent } from 'react';
import './DragAndDrop.css';
import { validateImageFile } from '../../utils/fileUpload';
import { useLocale } from '../../i18n/useLocale';

interface DragAndDropProps {
  onImageSelected: (url: string, file: File) => void;
}

export const DragAndDrop: React.FC<DragAndDropProps> = ({ onImageSelected }) => {
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLocale();

  const processFile = (file: File) => {
    setError(null);

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    const url = URL.createObjectURL(file);
    onImageSelected(url, file);
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
      processFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="drag-drop-container">
      {error && <div className="error-message">{error}</div>}
      
      <div 
        className={`drop-zone ${isDragActive ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          accept="image/*" 
          className="file-input" 
          onChange={handleChange}
          aria-label={t('dragdrop.ariaLabel')}
        />
        <div className="drop-zone-content">
          <svg className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-primary">{t('dragdrop.prompt')}</span>
          <span className="text-secondary">{t('dragdrop.hint')}</span>
        </div>
      </div>
    </div>
  );
};
