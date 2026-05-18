import React from 'react';
import { BackgroundRemoverModule } from './BackgroundRemoverModule';
import { Workspace } from '../../shared/components/UI/Workspace/Workspace';
import { useLocale } from '../../core/i18n/useLocale';
import { getSeoById } from '../../core/seo/seoConfig';

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
