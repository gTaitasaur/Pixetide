import React from 'react';
import { Base64Module } from './Base64Module';
import { Workspace } from '../../shared/components/UI/Workspace/Workspace';
import { useLocale } from '../../core/i18n/useLocale';
import { getSeoById } from '../../core/seo/seoConfig';

export const Base64Tool: React.FC = () => {
  const { locale, t } = useLocale();
  const seo = getSeoById('base64');

  return (
    <div className="home-container" style={{ paddingBottom: '80px' }}>
      <header className="tool-header">
        <h1 className="tool-title">
          {seo?.h1[locale].split('—')[0]} <span>{seo?.h1[locale].split('—')[1] || ''}</span>
        </h1>
        <p className="tool-subtitle">
          {t('tool.base64.subtitle')}
        </p>
      </header>

      <Workspace>
        <Base64Module />
      </Workspace>
    </div>
  );
};
