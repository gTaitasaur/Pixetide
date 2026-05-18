import React from 'react';
import { ASPECT_RATIOS } from './cropper';

interface AspectRatioControlsProps {
  currentRatio: number | undefined;
  disabled?: boolean;
  onChangeRatio: (ratio: number | undefined) => void;
}

export const AspectRatioControls: React.FC<AspectRatioControlsProps> = ({
  currentRatio,
  disabled,
  onChangeRatio,
}) => {
  return (
    <div className={`aspect-ratio-selector ${disabled ? 'is-disabled' : ''}`}>
      <div className="aspect-ratio-header">
        <h3 className="aspect-ratio-title">Selecciona un formato</h3>
        <span className="aspect-ratio-hint">Ajusta tu imagen a las medidas ideales</span>
      </div>
      
      <div className="aspect-ratio-grid">
        {ASPECT_RATIOS.map((option) => (
          <button
            key={option.label}
            className={`aspect-chip ${currentRatio === option.value ? 'is-active' : ''}`}
            onClick={() => onChangeRatio(option.value)}
            disabled={disabled}
            title={option.subLabel}
          >
            <div className="aspect-chip-icon-wrapper">
              {option.icon ? (
                <svg className="aspect-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d={option.icon} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <div className="aspect-chip-icon-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  </svg>
                </div>
              )}
            </div>
            <div className="aspect-chip-info">
              <span className="aspect-chip-label">{option.label}</span>
              <span className="aspect-chip-ratio">{option.subLabel}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
