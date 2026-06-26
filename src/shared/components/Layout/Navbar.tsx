import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../UI/Logo';
import { useLocale } from '../../../core/i18n/useLocale';
import { SEO_PAGES } from '../../../core/seo/seoConfig';
import { Sheet, SheetTrigger, SheetContent, SheetClose } from '@/shared/components/ui/sheet';
import { Globe, Menu } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

/**
 * Navbar rediseñado por completo con Tailwind CSS v4 y shadcn/ui Sheet.
 * 
 * Lógica funcional conservada:
 * - Selector de idioma con enrutamiento dinámico según la herramienta activa.
 * - Enlace a homePath localizado.
 * - Integración del logo oficial de Pixetide.
 * - Soporte para SSR y prerendering estático.
 */
export const Navbar: React.FC = () => {
  const { t, locale, setLocale } = useLocale();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const homePath = locale === 'es' ? '/es/' : '/';
  const toolsPath = locale === 'es' ? '/es/herramientas/' : '/tools/';

  const [isSmallScreen, setIsSmallScreen] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 390px)');
    setIsSmallScreen(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  /** Cambiar idioma y navegar a la ruta equivalente de la herramienta activa */
  const switchLanguage = () => {
    const targetLocale = locale === 'en' ? 'es' : 'en';
    setLocale(targetLocale);

    const currentPage = SEO_PAGES.find((page) => {
      const enPath = page.path.en.replace(/\/$/, '') || '/';
      const esPath = page.path.es.replace(/\/$/, '') || '/es';
      const normalizedCurrent = pathname.replace(/\/$/, '') || '/';
      return normalizedCurrent === enPath || normalizedCurrent === esPath;
    });

    if (currentPage) {
      navigate(currentPage.path[targetLocale], { replace: true });
    } else {
      navigate(targetLocale === 'es' ? '/es/' : '/', { replace: true });
    }
  };

  // Determinar estados activos para los enlaces principales
  const isHomeActive = pathname === homePath || pathname === (locale === 'es' ? '/es' : '');
  const isToolsActive = pathname.includes('/tools/') || pathname.includes('/herramientas/');

  return (
    <nav className="fixed top-0 left-0 w-full bg-white/70 backdrop-blur-xl z-50 transition-all duration-300 ease-in-out border-b border-gray-100">
      <div className="flex justify-between items-center h-20 px-6 md:px-12 max-w-[1600px] mx-auto">

        {/* Lado Izquierdo: Marca / Logo */}
        <Link to={homePath} className="flex items-center gap-2 max-[390px]:hidden">
          <Logo size={40} className="hover:opacity-90 transition-opacity" />
        </Link>

        {/* Centro: Enlaces de Navegación Desktop */}
        <div className="hidden min-[990px]:flex items-center space-x-12">
          <Link
            to={homePath}
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.2em] transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[1px] after:bg-primary after:transition-transform after:duration-300",
              isHomeActive
                ? "text-primary after:scale-x-100"
                : "text-muted-foreground hover:text-primary after:scale-x-0 hover:after:scale-x-100"
            )}
          >
            {t('nav.home')}
          </Link>
          <Link
            to={toolsPath}
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.2em] transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[1px] after:bg-primary after:transition-transform after:duration-300",
              isToolsActive
                ? "text-primary after:scale-x-100"
                : "text-muted-foreground hover:text-primary after:scale-x-0 hover:after:scale-x-100"
            )}
          >
            {t('nav.tools')}
          </Link>

          {/* Placeholders visuales del prototipo */}
          <span className="text-xs font-semibold text-muted-foreground/40 cursor-not-allowed uppercase tracking-[0.2em] select-none">
            Blogs
          </span>
          <span className="text-xs font-semibold text-muted-foreground/40 cursor-not-allowed uppercase tracking-[0.2em] select-none">
            {t('nav.about')}
          </span>
        </div>

        {/* Lado Derecho: Acciones Desktop */}
        <div className="flex items-center gap-4 md:gap-8 max-[390px]:w-full max-[390px]:justify-start">

          {/* Selector de idioma */}
          <button
            onClick={switchLanguage}
            className="flex items-center gap-1.5 text-[10px] font-bold text-foreground hover:bg-muted/50 transition-colors uppercase tracking-[0.12em] px-2.5 py-1.5 border border-gray-100 rounded cursor-pointer max-[390px]:hidden"
            aria-label={t('lang.switchLabel')}
            title={t('lang.switchLabel')}
          >
            <Globe className="size-3.5" />
            {t('lang.switch')}
          </button>

          {/* Botón de Apoyo (CTA) - Estilo Ko-fi Neobrutalista Pulsante */}
          <a
            href="https://ko-fi.com/taitasaur"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center px-5 py-2.5 btn-support-kofi text-[10px]"
          >
            {t('nav.support')}
            <svg 
              className="w-5 h-5 ml-2 flex-shrink-0" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Contorno de la taza */}
              <path 
                d="M3 5C3 3.89543 3.89543 3 5 3H15C16.1046 3 17 3.89543 17 5V11C17 14.3137 14.3137 17 11 17H9C5.68629 17 3 14.3137 3 11V5Z" 
                fill="#ffffff" 
                stroke="#000000" 
                strokeWidth="2.5" 
                strokeLinejoin="round"
              />
              {/* Asa de la taza */}
              <path 
                d="M17 6H19C20.6569 6 22 7.34315 22 9C22 10.6569 20.6569 12 19 12H17" 
                stroke="#000000" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              {/* Corazón en el centro */}
              <path 
                d="M10 6.6C9.64 6.12 9.09 5.92 8.55 5.92C7.38 5.92 6.47 6.83 6.47 8.01C6.47 9.42 7.52 10.33 8.68 11.47L10 12.7L11.32 11.47C12.48 10.33 13.53 9.42 13.53 8.01C13.53 6.83 12.62 5.92 11.45 5.92C10.91 5.92 10.36 6.12 10 6.6Z" 
                fill="#ff5e5b"
                stroke="#ff5e5b"
                strokeWidth="0.5"
              />
            </svg>
          </a>

          {/* Menú Hamburguesa Móvil (shadcn/ui Sheet) */}
          <div className="min-[990px]:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="p-2 text-foreground hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                  aria-label={t('nav.openMenu')}
                >
                  <Menu className="size-6" />
                </button>
              </SheetTrigger>
              <SheetContent
                side={isSmallScreen ? "left" : "right"}
                className={cn(
                  "w-[300px] sm:w-[350px] p-6 flex flex-col justify-between bg-white",
                  isSmallScreen ? "border-r border-border" : "border-l border-border"
                )}
                showCloseButton={true}
              >

                {/* Enlaces Móviles */}
                <div className="flex flex-col space-y-8 mt-12">
                  <div className="flex flex-col space-y-4">
                    <SheetClose asChild>
                      <Link
                        to={homePath}
                        className={cn(
                          "text-lg font-semibold uppercase tracking-[0.15em] transition-colors py-2 border-b border-border/30",
                          isHomeActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                        )}
                      >
                        {t('nav.home')}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to={toolsPath}
                        className={cn(
                          "text-lg font-semibold uppercase tracking-[0.15em] transition-colors py-2 border-b border-border/30",
                          isToolsActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                        )}
                      >
                        {t('nav.tools')}
                      </Link>
                    </SheetClose>
                    <span className="text-lg font-semibold text-muted-foreground/30 cursor-not-allowed uppercase tracking-[0.15em] py-2 border-b border-border/30 select-none">
                      Blogs
                    </span>
                    <span className="text-lg font-semibold text-muted-foreground/30 cursor-not-allowed uppercase tracking-[0.15em] py-2 border-b border-border/30 select-none">
                      {t('nav.about')}
                    </span>
                  </div>

                  {/* Selector de idioma móvil */}
                  <SheetClose asChild>
                    <button
                      onClick={switchLanguage}
                      className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors py-2 cursor-pointer text-left uppercase tracking-wider"
                    >
                      <Globe className="size-4" />
                      {locale === 'en' ? 'Español' : 'English'}
                    </button>
                  </SheetClose>
                </div>

                {/* Soporte Móvil */}
                <div className="flex flex-col space-y-4 mb-8">
                  <span className="text-[11px] text-muted-foreground/80 leading-relaxed font-medium">
                    {t('nav.supportMicrocopy')}
                  </span>
                  <SheetClose asChild>
                    <a
                      href="https://ko-fi.com/taitasaur"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center py-3 btn-support-kofi text-xs text-center"
                    >
                      {t('nav.support')}
                      <svg 
                        className="w-5.5 h-5.5 ml-2 flex-shrink-0" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Contorno de la taza */}
                        <path 
                          d="M3 5C3 3.89543 3.89543 3 5 3H15C16.1046 3 17 3.89543 17 5V11C17 14.3137 14.3137 17 11 17H9C5.68629 17 3 14.3137 3 11V5Z" 
                          fill="#ffffff" 
                          stroke="#000000" 
                          strokeWidth="2.5" 
                          strokeLinejoin="round"
                        />
                        {/* Asa de la taza */}
                        <path 
                          d="M17 6H19C20.6569 6 22 7.34315 22 9C22 10.6569 20.6569 12 19 12H17" 
                          stroke="#000000" 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                        {/* Corazón en el centro */}
                        <path 
                          d="M10 6.6C9.64 6.12 9.09 5.92 8.55 5.92C7.38 5.92 6.47 6.83 6.47 8.01C6.47 9.42 7.52 10.33 8.68 11.47L10 12.7L11.32 11.47C12.48 10.33 13.53 9.42 13.53 8.01C13.53 6.83 12.62 5.92 11.45 5.92C10.91 5.92 10.36 6.12 10 6.6Z" 
                          fill="#ff5e5b"
                          stroke="#ff5e5b"
                          strokeWidth="0.5"
                        />
                      </svg>
                    </a>
                  </SheetClose>
                </div>

              </SheetContent>
            </Sheet>
          </div>

        </div>

      </div>
    </nav>
  );
};
