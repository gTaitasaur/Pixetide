import { CropperModule } from './CropperModule';
import { Workspace } from '../../shared/components/UI/Workspace/Workspace';
import { useState } from 'react';
import { useLocale } from '../../core/i18n/useLocale';
import { getSeoById } from '../../core/seo/seoConfig';

export const AspectRatioTool: React.FC = () => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const { locale, t } = useLocale();
  const seo = getSeoById('crop');

  return (
    <div className="home-container" style={{ paddingBottom: '80px' }}>
      <header className="tool-header">
        <h1 className="tool-title">
          {seo?.h1[locale].split('—')[0]} <span>{seo?.h1[locale].split('—')[1] || ''}</span>
        </h1>
        <p className="tool-subtitle">
          {t('tool.crop.subtitle')}
        </p>
      </header>

      <Workspace>
        <CropperModule 
          imageUrl={currentImage} 
          onImageSelected={(url) => setCurrentImage(url)}
        />
      </Workspace>
    </div>
  );
};
