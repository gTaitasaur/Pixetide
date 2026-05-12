import React, { useState } from 'react';
import { RotateFlipModule } from '../../../components/RotateFlip/RotateFlipModule';
import { Workspace } from '../../../components/UI/Workspace/Workspace';
import { useLocale } from '../../../i18n/useLocale';
import { getSeoById } from '../../../seo/seoConfig';

export const RotateFlipTool: React.FC = () => {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const { locale, t } = useLocale();
  const seo = getSeoById('rotate-flip');

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
        <h1 className="tool-title">
          {seo?.h1[locale].split('—')[0]} <span>{seo?.h1[locale].split('—')[1] || ''}</span>
        </h1>
        <p className="tool-subtitle">
          {t('tool.rotate.subtitle')}
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
