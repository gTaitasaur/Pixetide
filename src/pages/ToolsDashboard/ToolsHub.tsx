import React from 'react';
import { useLocale } from '../../core/i18n/useLocale';
import { TOOLS_CONFIG, type ToolIconName } from '../../core/tools/toolsConfig';
import { getToolPath } from '../../core/seo/getToolPath';
import { Card } from '../../shared/components/UI/Card';
import {
  Minimize2,
  ArrowLeftRight,
  Crop,
  Stamp,
  Eraser,
  RotateCw,
  Palette,
  Binary,
  Sparkles,
  Sliders,
  Globe,
  type LucideIcon
} from 'lucide-react';

const ICON_MAP: Record<ToolIconName, LucideIcon> = {
  Minimize2,
  ArrowLeftRight,
  Crop,
  Stamp,
  Eraser,
  RotateCw,
  Palette,
  Binary,
  Sparkles,
  Sliders,
  Globe,
};

export const ToolsHub: React.FC = () => {
  const { t, locale } = useLocale();

  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="mb-10">
        <h2 className="font-serif text-3xl md:text-4xl text-primary font-medium tracking-tight mb-2">
          {locale === 'es' ? 'Todas las Herramientas' : 'All Image Tools'}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {locale === 'es' 
            ? 'Procesa, edita y optimiza tus imágenes localmente en el navegador. Tus archivos nunca salen de tu dispositivo.'
            : 'Process, edit and optimize your images locally in your browser. Your files never leave your device.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 pb-12">
        {TOOLS_CONFIG.map(({ id, iconName, titleKey, descKey, disabled }) => {
          const Icon = ICON_MAP[iconName];
          return (
            <Card
              key={id}
              to={disabled ? undefined : getToolPath(id, locale)}
              disabled={disabled}
              icon={<Icon />}
              title={t(titleKey)}
              description={t(descKey)}
            />
          );
        })}
      </div>
    </div>
  );
};
