import React, { useState } from 'react';
import { ConverterModule } from '../../../components/Converter/ConverterModule';
import { Workspace } from '../../../components/UI/Workspace/Workspace';
import { useLocale } from '../../../i18n/useLocale';
import { getSeoById } from '../../../seo/seoConfig';

export const ConverterTool: React.FC = () => {
  const [activeFiles, setActiveFiles] = useState<File[]>([]);
  const { locale, t } = useLocale();
  const seo = getSeoById('convert');

  const handleAddFiles = (newFiles: File[]) => {
    setActiveFiles(prev => [...prev, ...newFiles]);
  };

  const handleClearAll = () => {
    setActiveFiles([]);
  };

  return (
    <div className="home-container" style={{ paddingBottom: '80px' }}>
      <header className="tool-header">
        <h1 className="tool-title">
          {seo?.h1[locale].split('—')[0]} <span>{seo?.h1[locale].split('—')[1] || ''}</span>
        </h1>
        <p className="tool-subtitle">
          {t('tool.convert.subtitle')}
        </p>
      </header>

      <Workspace>
        <ConverterModule 
          files={activeFiles} 
          onAddFiles={handleAddFiles} 
          onClearAll={handleClearAll}
        />
      </Workspace>
    </div>
  );
};
