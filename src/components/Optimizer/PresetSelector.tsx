import React from 'react';
import { OptimizationPreset, OPTIMIZATION_PRESETS } from '../../types/optimizer';
import { useLocale } from '../../i18n/useLocale';

interface PresetSelectorProps {
  selectedId: string;
  onSelect: (preset: OptimizationPreset) => void;
  disabled?: boolean;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ selectedId, onSelect, disabled }) => {
  const { t } = useLocale();

  const getPresetLabel = (id: string) => {
    switch (id) {
      case 'lossless': return t('opt.presetLossless');
      case 'normal': return t('opt.presetNormal');
      case 'aggressive': return t('opt.presetAggressive');
      case 'ultra': return t('opt.presetMax');
      default: return id;
    }
  };

  const getPresetDesc = (id: string) => {
    switch (id) {
      case 'lossless': return t('opt.presetLosslessDesc');
      case 'normal': return t('opt.presetNormalDesc');
      case 'aggressive': return t('opt.presetAggressiveDesc');
      case 'ultra': return t('opt.presetMaxDesc');
      default: return '';
    }
  };

  return (
    <div className="preset-grid">
      {OPTIMIZATION_PRESETS.map((preset) => (
        <button
          key={preset.id}
          className={`preset-chip ${selectedId === preset.id ? 'is-active' : ''}`}
          onClick={() => onSelect(preset)}
          disabled={disabled}
          type="button"
        >
          <div className="chip-content">
            <span className="chip-label">{getPresetLabel(preset.id)}</span>
            <span className="chip-value">{Math.round(preset.quality * 100)}%</span>
            <span className="chip-desc">{getPresetDesc(preset.id)}</span>
          </div>
          {preset.id === 'normal' && <div className="chip-dot"></div>}
        </button>
      ))}
    </div>
  );
};
