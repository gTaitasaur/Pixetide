import React, { useState } from 'react';
import { OptimizerModule } from '../../../components/Optimizer/OptimizerModule';
import { Workspace } from '../../../components/UI/Workspace/Workspace';
import { useLocale } from '../../../i18n/useLocale';
import { getSeoById } from '../../../seo/seoConfig';

export const OptimizerTool: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const { locale, t } = useLocale();
  const seo = getSeoById('compress');

  const handleImageSelected = (url: string, file: File) => {
    setCurrentUrl(url);
    setCurrentFile(file);
  };

  return (
    <div className="home-container" style={{ paddingBottom: '80px' }}>
      <header className="tool-header">
        <h1 className="tool-title">
          {seo?.h1[locale].split('—')[0]} <span>{seo?.h1[locale].split('—')[1] || ''}</span>
        </h1>
        <p className="tool-subtitle">
          {t('tool.compress.subtitle')}
        </p>
      </header>

      <Workspace>
        <OptimizerModule 
          originalUrl={currentUrl}
          originalFile={currentFile}
          onImageSelected={handleImageSelected}
        />
      </Workspace>
    </div>
  );
};
