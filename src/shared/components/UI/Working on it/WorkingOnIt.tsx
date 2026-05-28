import React from 'react';

/**
 * Componente WorkingOnIt (Widget de Sitio en Construcción)
 * 
 * Cambios destacados:
 * - Control de estado reactivo (isOpen) para habilitar triggers por click o tap en móviles.
 * - Auto-cierre automático tras 6 segundos (6000ms) de inactividad si no se cierra manualmente.
 * - Animación CSS fluida y sincronizada usando clases dinámicas de Tailwind.
 * - Retraso en la visualización del texto (delay-300) para asegurar la expansión completa del globo de diálogo.
 */
const WorkingOnIt: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        // Al abrir, iniciar temporizador de auto-cierre de 6 segundos
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsOpen(false);
        }, 6000);
      } else {
        // Al cerrar manualmente, limpiar temporizador
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
      return next;
    });
  };

  // Limpiar temporizador al desmontar el componente
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center mt-[60px]" style={{ filter: 'url("#goo")' }}>
      
      {/* Globo del Tooltip ("Web Under Construction") con animación y bordes de neón */}
      <div className={`
        absolute bottom-[50px] bg-black flex items-center justify-center transition-all duration-600 ease-[cubic-bezier(0.34,1.56,0.64,1)] 
        before:content-[''] before:absolute before:-inset-[5px] before:rounded-[inherit] 
        before:bg-[linear-gradient(45deg,#ff00ff,#00ffff,#ff00ff)] before:-z-10 before:blur-[10px] 
        before:animate-[spin_2s_linear_infinite] before:transition-opacity before:duration-500 ${
          isOpen 
            ? "opacity-100 w-[180px] h-[80px] rounded-[20px] -translate-y-[60px] scale-100 before:opacity-70" 
            : "opacity-0 w-[60px] h-[60px] rounded-full translate-y-[40px] scale-10 before:opacity-0 pointer-events-none"
        }
      `}>
        
        {/* Texto "Web Under Construction" con retraso para esperar la expansión del globo */}
        <div className={`
          transition-opacity duration-300 text-white font-['Syncopate',sans-serif] font-bold 
          text-[0.7rem] tracking-[4px] drop-shadow-[0_0_10px_#fff] text-center px-2 select-none ${
            isOpen ? "opacity-100 delay-300" : "opacity-0"
          }
        `}>
          <span className="glitch-text block leading-normal">Web Under<br />Construction</span>
        </div>
      </div>

      {/* Botón Trigger de Click / Tap */}
      <button 
        onClick={handleToggle}
        className={`
          relative z-10 px-10 py-5 bg-black text-white border-none rounded-lg cursor-pointer 
          font-['Syncopate',sans-serif] font-black tracking-[2px] transition-all duration-300 select-none ${
            isOpen
              ? "shadow-[0_0_30px_rgba(255,255,255,0.2)] scale-95 tracking-[6px]"
              : "animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.35)] hover:animate-none hover:scale-98 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          }
        `}
      >
        Press Me!
      </button>

      {/* Filtro SVG "Gooey" para efecto orgánico de fusión */}
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{ display: 'block', width: 0, height: 0 }}>
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation={10} result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default WorkingOnIt;
