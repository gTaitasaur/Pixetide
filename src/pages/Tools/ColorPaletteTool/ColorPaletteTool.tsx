import React from 'react';
import { ColorPaletteModule } from '../../../components/ColorPalette/ColorPaletteModule';
import { Workspace } from '../../../components/UI/Workspace/Workspace';
import { useLocale } from '../../../i18n/useLocale';
import { getSeoById } from '../../../seo/seoConfig';

export const ColorPaletteTool: React.FC = () => {
  const { locale, t } = useLocale();
  const seo = getSeoById('color-palette');

  return (
    <div className="home-container" style={{ paddingBottom: '80px' }}>
      <header className="tool-header">
        <h1 className="tool-title">
          {seo?.h1[locale].split('—')[0]} <span>{seo?.h1[locale].split('—')[1] || ''}</span>
        </h1>
        <p className="tool-subtitle">
          {t('tool.palette.subtitle')}
        </p>
      </header>

      <Workspace>
        <ColorPaletteModule />
      </Workspace>
    </div>
  );
};
