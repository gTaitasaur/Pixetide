import React, { useState } from 'react';
import { WatermarkModule } from '../../../components/Watermark/WatermarkModule';
import { Workspace } from '../../../components/UI/Workspace/Workspace';
import { useLocale } from '../../../i18n/useLocale';
import { getSeoById } from '../../../seo/seoConfig';

export const WatermarkTool: React.FC = () => {
  const [photos, setPhotos] = useState<File[]>([]);
  const { locale, t } = useLocale();
  const seo = getSeoById('watermark');

  const handleAddPhotos = (newFiles: File[]) => {
    setPhotos(prev => [...prev, ...newFiles]);
  };

  const handleClearAll = () => {
    setPhotos([]);
  };

  return (
    <div className="home-container" style={{ paddingBottom: '80px' }}>
      <header className="tool-header">
        <h1 className="tool-title">
          {seo?.h1[locale].split('—')[0]} <span>{seo?.h1[locale].split('—')[1] || ''}</span>
        </h1>
        <p className="tool-subtitle">
          {t('tool.watermark.subtitle')}
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
