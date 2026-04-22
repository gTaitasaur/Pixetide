import React from 'react';
import { ASPECT_RATIOS } from '../../types/cropper';

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
    <div className="aspect-controls-container" style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <h3 className="aspect-controls-title">Formato</h3>
      <div className="aspect-buttons">
        {ASPECT_RATIOS.map((option) => (
          <button
            key={option.label}
            className={`btn-aspect ${currentRatio === option.value ? 'active' : ''}`}
            onClick={() => onChangeRatio(option.value)}
            disabled={disabled}
          >
            {option.icon && (
              <svg className="aspect-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d={option.icon} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <div className="aspect-btn-text">
              <span className="aspect-label">{option.label}</span>
              {option.subLabel && <span className="aspect-sublabel">{option.subLabel}</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
