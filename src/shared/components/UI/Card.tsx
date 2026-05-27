import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/utils/cn';

interface CardProps {
  to?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
}

/**
 * Componente Card rediseñado por completo con Tailwind CSS v4.
 * 
 * Características:
 * - Estética minimalista, limpia, con bordes finos de alto contraste y esquinas redondeadas de 1rem.
 * - Micro-interacciones elásticas en hover: elevación sutil, cambio de color de borde e inversión cromática del icono.
 * - Tratamiento visual atenuado consistente para tarjetas deshabilitadas ("Próximamente") sin romper el diseño de la grilla.
 */
export const Card: React.FC<CardProps> = ({ to, icon, title, description, disabled = false }) => {
  const content = (
    <div className="flex flex-col h-full text-left">
      {/* Contenedor del Icono */}
      <div className={cn(
        "size-10 flex items-center justify-center rounded-lg mb-6 transition-all duration-350 ease-out",
        disabled 
          ? "bg-neutral-100 text-neutral-400" 
          : "bg-neutral-50 text-primary group-hover:bg-primary group-hover:text-white"
      )}>
        <div className="size-5 [&>svg]:size-full [&>svg]:stroke-[1.5]">
          {icon}
        </div>
      </div>
      
      {/* Titular */}
      <h3 className={cn(
        "font-serif text-lg font-semibold tracking-tight mb-2 transition-colors duration-300",
        disabled 
          ? "text-neutral-400" 
          : "text-foreground group-hover:text-primary"
      )}>
        {title}
      </h3>
      
      {/* Descripción */}
      <p className={cn(
        "text-xs leading-relaxed font-normal",
        disabled 
          ? "text-neutral-400/80" 
          : "text-muted-foreground group-hover:text-muted-foreground/80"
      )}>
        {description}
      </p>

      {/* Badge de Próximamente */}
      {disabled && (
        <div className="mt-auto pt-6 flex">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium font-mono uppercase tracking-widest bg-neutral-150 text-neutral-500 border border-neutral-200/50">
            Próximamente
          </span>
        </div>
      )}
    </div>
  );

  const cardClasses = cn(
    "group relative flex flex-col justify-between p-6 sm:p-8 bg-white border border-border/80 rounded-xl min-h-[220px] transition-all duration-300 ease-in-out select-none",
    disabled 
      ? "opacity-70 bg-neutral-50/50 border-neutral-200/50 cursor-not-allowed" 
      : "hover:border-primary hover:bg-neutral-50/20 hover:-translate-y-0.5 cursor-pointer"
  );

  if (disabled || !to) {
    return (
      <div className={cardClasses}>
        {content}
      </div>
    );
  }

  return (
    <Link to={to} className={cardClasses}>
      {content}
    </Link>
  );
};
