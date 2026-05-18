import React from 'react';
import './Logo.css';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Componente Logo "Núcleo Púrpura"
 * Diseño independiente y fidedigno al laboratorio de logos.
 */
export const Logo: React.FC<LogoProps> = ({ size = 32, className = '' }) => {
  return (
    <div className={`pixetide-logo-standalone ${className}`}>
      <div
        className="pixetide-logo-icon"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Píxeles Negros Exteriores */}
          <rect x="6" y="6" width="4" height="4" fill="black" />
          <rect x="14" y="6" width="4" height="4" fill="black" />
          <rect x="6" y="14" width="4" height="4" fill="black" />
          <rect x="14" y="14" width="4" height="4" fill="black" />

          {/* Núcleo Púrpura Central */}
          <rect x="10" y="10" width="4" height="4" fill="#a855f7" />
        </svg>
      </div>
      <span className="pixetide-logo-text">Pixetide</span>
    </div>
  );
};
