import { LucideIcon } from 'lucide-react';
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
  Globe
} from 'lucide-react';
import { TranslationKey } from '../i18n/translations';

export interface ToolItem {
  id: string;
  icon: LucideIcon;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  disabled?: boolean;
}

/**
 * Fuente Única de Verdad para las herramientas disponibles en la grilla de Pixetide.
 * Centraliza los íconos de Lucide y las llaves de traducción (i18n) correspondientes.
 */
export const TOOLS_CONFIG: ToolItem[] = [
  {
    id: 'compress',
    icon: Minimize2,
    titleKey: 'card.compress.title',
    descKey: 'card.compress.desc'
  },
  {
    id: 'convert',
    icon: ArrowLeftRight,
    titleKey: 'card.convert.title',
    descKey: 'card.convert.desc'
  },
  {
    id: 'crop',
    icon: Crop,
    titleKey: 'card.crop.title',
    descKey: 'card.crop.desc'
  },
  {
    id: 'watermark',
    icon: Stamp,
    titleKey: 'card.watermark.title',
    descKey: 'card.watermark.desc'
  },
  {
    id: 'remove-bg',
    icon: Eraser,
    titleKey: 'card.removeBg.title',
    descKey: 'card.removeBg.desc'
  },
  {
    id: 'rotate-flip',
    icon: RotateCw,
    titleKey: 'card.rotateFlip.title',
    descKey: 'card.rotateFlip.desc'
  },
  {
    id: 'color-palette',
    icon: Palette,
    titleKey: 'card.colorPalette.title',
    descKey: 'card.colorPalette.desc'
  },
  {
    id: 'base64',
    icon: Binary,
    titleKey: 'card.base64.title',
    descKey: 'card.base64.desc'
  },
  {
    id: 'upscale',
    icon: Sparkles,
    titleKey: 'card.upscale.title',
    descKey: 'card.upscale.desc',
    disabled: true
  },
  {
    id: 'photo-editor',
    icon: Sliders,
    titleKey: 'card.photoEditor.title',
    descKey: 'card.photoEditor.desc',
    disabled: true
  },
  {
    id: 'favicon',
    icon: Globe,
    titleKey: 'card.favicon.title',
    descKey: 'card.favicon.desc',
    disabled: true
  }
];
