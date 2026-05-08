import React from 'react';
import { OptimizationPreset, OPTIMIZATION_PRESETS } from '../../types/optimizer';

interface PresetSelectorProps {
  selectedId: string;
  onSelect: (preset: OptimizationPreset) => void;
  disabled?: boolean;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ selectedId, onSelect, disabled }) => {
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
            <span className="chip-label">{preset.id === 'lossless' ? 'Sin pérdida' : preset.label}</span>
            <span className="chip-value">{Math.round(preset.quality * 100)}%</span>
            <span className="chip-desc">{preset.id === 'lossless' ? 'Original' : preset.id === 'normal' ? 'Equilibrado' : preset.id === 'aggressive' ? 'Para Web' : 'Mínimo peso'}</span>
          </div>
          {preset.id === 'normal' && <div className="chip-dot"></div>}
        </button>
      ))}
    </div>
  );
};
