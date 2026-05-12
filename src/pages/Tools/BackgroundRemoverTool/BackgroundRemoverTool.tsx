import React from 'react';
import { BackgroundRemoverModule } from '../../../components/BackgroundRemover/BackgroundRemoverModule';
import { Workspace } from '../../../components/UI/Workspace/Workspace';
import { useLocale } from '../../../i18n/useLocale';
import { getSeoById } from '../../../seo/seoConfig';

export const BackgroundRemoverTool: React.FC = () => {
  const { locale, t } = useLocale();
  const seo = getSeoById('remove-bg');

  return (
    <div className="home-container" style={{ paddingBottom: '80px' }}>
      <header className="tool-header">
        <h1 className="tool-title">
          {seo?.h1[locale].split('—')[0]} <span>{seo?.h1[locale].split('—')[1] || ''}</span>
        </h1>
        <p className="tool-subtitle">
          {t('tool.removeBg.subtitle')}
        </p>
      </header>

      <Workspace>
        <BackgroundRemoverModule />
      </Workspace>
    </div>
  );
};
