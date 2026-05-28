import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Componente Logo "Núcleo Púrpura"
 * Rediseñado íntegramente con Tailwind CSS v4 para coherencia tipográfica y eliminación de CSS duplicado.
 */
export const Logo: React.FC<LogoProps> = ({ size = 32, className = '' }) => {
  return (
    <div className={`inline-flex items-center justify-center shrink-0 select-none no-underline group ${className}`}>
      {/* Icono Pixelado ("Núcleo Púrpura") con Rotación Diamante y efecto hover elástico */}
      <div
        className="flex items-center justify-center rotate-45 transition-transform duration-500 ease-out group-hover:scale-120"
        style={{ width: size, height: size }}
      >
        <svg className="size-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Píxeles Negros Exteriores */}
          <rect x="6" y="6" width="4" height="4" fill="black" />
          <rect x="14" y="6" width="4" height="4" fill="black" />
          <rect x="6" y="14" width="4" height="4" fill="black" />
          <rect x="14" y="14" width="4" height="4" fill="black" />

          {/* Núcleo Púrpura Central */}
          <rect x="10" y="10" width="4" height="4" fill="#a855f7" />
        </svg>
      </div>
      
      {/* Branding textual unificado bajo Playfair Display */}
      <span className="font-serif font-black text-2xl md:text-3xl tracking-tight text-primary translate-y-[1px] ml-2 max-[420px]:hidden select-none">
        Pixetide.
      </span>
    </div>
  );
};
