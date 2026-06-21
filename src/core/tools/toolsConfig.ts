import { TranslationKey } from '../i18n/translations';

export type ToolIconName =
  | 'Minimize2'
  | 'ArrowLeftRight'
  | 'Crop'
  | 'Stamp'
  | 'Eraser'
  | 'RotateCw'
  | 'Palette'
  | 'Binary'
  | 'Sparkles'
  | 'Sliders'
  | 'Globe';

export interface ToolItem {
  id: string;
  iconName: ToolIconName;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  disabled?: boolean;
}

/**
 * Fuente Única de Verdad para las herramientas de Pixetide.
 * Solo contiene datos puros: IDs, nombres de íconos y claves de traducción.
 * Los íconos se resuelven en el componente que los renderiza (Home.tsx).
 */
export const TOOLS_CONFIG: ToolItem[] = [
  { id: 'compress',      iconName: 'Minimize2',      titleKey: 'card.compress.title',      descKey: 'card.compress.desc',       disabled: true },
  { id: 'convert',       iconName: 'ArrowLeftRight',  titleKey: 'card.convert.title',       descKey: 'card.convert.desc',        disabled: true },
  { id: 'crop',          iconName: 'Crop',            titleKey: 'card.crop.title',          descKey: 'card.crop.desc' },
  { id: 'watermark',     iconName: 'Stamp',           titleKey: 'card.watermark.title',     descKey: 'card.watermark.desc' },
  { id: 'remove-bg',     iconName: 'Eraser',          titleKey: 'card.removeBg.title',      descKey: 'card.removeBg.desc' },
  { id: 'rotate-flip',   iconName: 'RotateCw',        titleKey: 'card.rotateFlip.title',    descKey: 'card.rotateFlip.desc' },
  { id: 'color-palette', iconName: 'Palette',         titleKey: 'card.colorPalette.title',  descKey: 'card.colorPalette.desc' },
  { id: 'base64',        iconName: 'Binary',          titleKey: 'card.base64.title',        descKey: 'card.base64.desc' },
  { id: 'upscale',       iconName: 'Sparkles',        titleKey: 'card.upscale.title',       descKey: 'card.upscale.desc',       disabled: true },
  { id: 'photo-editor',  iconName: 'Sliders',         titleKey: 'card.photoEditor.title',   descKey: 'card.photoEditor.desc',   disabled: true },
  { id: 'favicon',       iconName: 'Globe',           titleKey: 'card.favicon.title',       descKey: 'card.favicon.desc',       disabled: true },
];
