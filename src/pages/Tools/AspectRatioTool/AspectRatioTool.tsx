import { CropperModule } from '../../../components/Cropper/CropperModule';
import { Workspace } from '../../../components/UI/Workspace/Workspace';
import { useState } from 'react';
import { useLocale } from '../../../i18n/useLocale';
import { getSeoById } from '../../../seo/seoConfig';

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
