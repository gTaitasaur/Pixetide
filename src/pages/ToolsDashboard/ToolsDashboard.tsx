import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useLocale } from '../../core/i18n/useLocale';
import { SEO_PAGES, getSeoByPath } from '../../core/seo/seoConfig';
import { TOOLS_CONFIG, type ToolIconName } from '../../core/tools/toolsConfig';
import { getToolPath } from '../../core/seo/getToolPath';
import { Logo } from '../../shared/components/UI/Logo';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '../../shared/components/ui/sheet';
import { cn } from '../../shared/utils/cn';
import {
  Home as HomeIcon,
  LayoutGrid,
  BookOpen,
  Info,
  Globe,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
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
  type LucideIcon
} from 'lucide-react';
import './ToolsDashboard.css';

const ICON_MAP: Record<ToolIconName, LucideIcon> = {
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
  Globe,
};

export const ToolsDashboard: React.FC = () => {
  const { t, locale, setLocale } = useLocale();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const currentToolSeo = getSeoByPath(pathname);
  const isDashboardHome = !currentToolSeo || currentToolSeo.id === 'tools-dashboard';

  // Obtener título limpio traducido para evitar sufijos de SEO como "Online Gratis"
  const currentToolConfig = currentToolSeo ? TOOLS_CONFIG.find(t => t.id === currentToolSeo.id) : null;
  const toolTitle = currentToolConfig 
    ? t(currentToolConfig.titleKey) 
    : (currentToolSeo ? currentToolSeo.title[locale].split('—')[0].trim() : '');

  // Estados de layout
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Rutas localizadas
  const homePath = locale === 'es' ? '/es/' : '/';
  const toolsPath = locale === 'es' ? '/es/herramientas' : '/tools';

  // Cambiar idioma y redirigir
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
      navigate(targetLocale === 'es' ? '/es/herramientas/' : '/tools/', { replace: true });
    }
  };

  // Enlaces de navegación principales
  const navItems = [
    {
      label: t('nav.home'),
      to: homePath,
      icon: HomeIcon,
      disabled: false,
    },
    {
      label: t('nav.tools'),
      to: toolsPath,
      icon: LayoutGrid,
      disabled: false,
      active: true, // Esta es la sección activa actual
      subItems: TOOLS_CONFIG.map(tool => ({
        label: t(tool.titleKey),
        to: tool.disabled ? '#' : getToolPath(tool.id, locale),
        icon: ICON_MAP[tool.iconName],
        disabled: tool.disabled
      }))
    },
    {
      label: 'Blogs',
      to: '#',
      icon: BookOpen,
      disabled: true,
    },
    {
      label: t('nav.about'),
      to: '#',
      icon: Info,
      disabled: true,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
      
      {/* ─── SIDEBAR DESKTOP ─── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-white transition-all duration-300 ease-in-out select-none",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Header del Sidebar */}
        <div className={cn(
          "flex h-16 items-center border-b border-border/80 overflow-hidden shrink-0",
          isCollapsed ? "justify-center px-0" : "px-4"
        )}>
          <Link to={homePath} className="flex items-center shrink-0" title="Pixetide">
            <Logo 
              size={28} 
              className={cn(
                // Reduce el tamaño del texto un 5% y lo oculta si el sidebar colapsa
                "[&_span]:scale-95 [&_span]:origin-left",
                isCollapsed ? "[&_span]:hidden" : "[&_span]:block"
              )} 
            />
          </Link>
        </div>

        {/* Contenido / Navegación (con scroll interno si es necesario) */}
        <nav className="flex-1 overflow-y-auto min-h-0 space-y-1 px-3 py-4">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            if (item.disabled) {
              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/30 cursor-not-allowed select-none rounded-md",
                    isCollapsed && "justify-center"
                  )}
                  title={item.label}
                >
                  <Icon className="size-4.5 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
              );
            }

            return (
              <div key={index} className="flex flex-col">
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors",
                    item.active
                      ? "bg-slate-100 text-black border-l-2 border-black rounded-l-none"
                      : "text-muted-foreground hover:text-black hover:bg-slate-50",
                    isCollapsed && "justify-center px-0 rounded-md border-l-0"
                  )}
                  title={item.label}
                >
                  <Icon className={cn("size-4.5 shrink-0", item.active ? "text-black" : "text-muted-foreground")} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
                
                {/* Submenús para la sección activa (Herramientas) */}
                {item.subItems && !isCollapsed && (
                  <div className="ml-8 mt-1 mb-2 flex flex-col space-y-1 border-l border-border/60 pl-2">
                    {item.subItems.map((sub, subIdx) => {
                      const SubIcon = sub.icon;
                      if (sub.disabled) {
                        return (
                          <div 
                            key={subIdx} 
                            className="flex items-center gap-2.5 px-3 py-1.5 text-[11px] font-medium text-muted-foreground/30 cursor-not-allowed select-none"
                            title={locale === 'es' ? 'Próximamente disponible' : 'Available soon'}
                          >
                            <SubIcon className="size-3.5 shrink-0" />
                            <span className="truncate leading-tight">{sub.label}</span>
                          </div>
                        );
                      }
                      return (
                        <Link 
                          key={subIdx} 
                          to={sub.to} 
                          className="flex items-center gap-2.5 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-slate-50"
                        >
                          <SubIcon className="size-3.5 shrink-0" />
                          <span className="truncate leading-tight">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer del Sidebar */}
        <div className="border-t border-border/80 p-4 space-y-4 shrink-0 bg-white z-10">
          {/* Selector de idioma */}
          <button
            onClick={switchLanguage}
            className={cn(
              "flex items-center gap-2 text-[10px] font-bold text-foreground hover:bg-muted/50 transition-colors uppercase tracking-[0.12em] px-2.5 py-1.5 border border-gray-100 rounded cursor-pointer w-full justify-center",
              isCollapsed && "px-0 py-2 border-none"
            )}
            aria-label={t('lang.switchLabel')}
            title={t('lang.switchLabel')}
          >
            <Globe className="size-4 shrink-0" />
            {!isCollapsed && <span>{t('lang.switch')}</span>}
          </button>

          {/* Botón de donación Ko-fi */}
          {!isCollapsed ? (
            <a
              href="https://ko-fi.com/pixetide"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center py-2 px-4 btn-support-kofi text-[10px] w-full"
            >
              <span className="truncate">{t('nav.support')}</span>
              <svg 
                className="w-4 h-4 ml-1.5 flex-shrink-0" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M3 5C3 3.89543 3.89543 3 5 3H15C16.1046 3 17 3.89543 17 5V11C17 14.3137 14.3137 17 11 17H9C5.68629 17 3 14.3137 3 11V5Z" 
                  fill="#ffffff" 
                  stroke="#000000" 
                  strokeWidth="2.5" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M17 6H19C20.6569 6 22 7.34315 22 9C22 10.6569 20.6569 12 19 12H17" 
                  stroke="#000000" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M10 6.6C9.64 6.12 9.09 5.92 8.55 5.92C7.38 5.92 6.47 6.83 6.47 8.01C6.47 9.42 7.52 10.33 8.68 11.47L10 12.7L11.32 11.47C12.48 10.33 13.53 9.42 13.53 8.01C13.53 6.83 12.62 5.92 11.45 5.92C10.91 5.92 10.36 6.12 10 6.6Z" 
                  fill="#ff5e5b"
                  stroke="#ff5e5b"
                  strokeWidth="0.5"
                />
              </svg>
            </a>
          ) : (
            <a
              href="https://ko-fi.com/pixetide"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2 rounded-full border-2 border-black bg-[#ff5e5b] text-white hover:-translate-y-0.5 transition-transform size-9 mx-auto cursor-pointer"
              title={t('nav.support')}
            >
              <svg 
                className="w-4 h-4" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3 5C3 3.89543 3.89543 3 5 3H15C16.1046 3 17 3.89543 17 5V11C17 14.3137 14.3137 17 11 17H9C5.68629 17 3 14.3137 3 11V5Z" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
                <path d="M17 6H19C20.6569 6 22 7.34315 22 9C22 10.6569 20.6569 12 19 12H17" stroke="#000000" strokeWidth="2.5" />
              </svg>
            </a>
          )}
        </div>
      </aside>

      {/* ─── CONTENIDO Y HEADER PRINCIPAL ─── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        {/* Header superior del Dashboard */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-6 z-40 select-none">
          
          {/* Botón de colapso/menú y título de sección */}
          <div className="flex items-center gap-4">
            {/* Botón Desktop (Plegar / Desplegar Sidebar) */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center size-9 rounded-md border border-border bg-white hover:bg-slate-50 text-muted-foreground transition-colors cursor-pointer"
              aria-label="Toggle sidebar"
            >
              {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>

            {/* Botón Móvil (Menú Drawer shadcn/ui) */}
            <div className="lg:hidden">
              <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                  <button
                    className="flex items-center justify-center size-9 rounded-md border border-border bg-white hover:bg-slate-50 text-muted-foreground transition-colors cursor-pointer"
                    aria-label="Open menu"
                  >
                    <Menu className="size-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 bg-white flex flex-col justify-between h-full border-r border-border" showCloseButton={false}>
                  
                  <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
                    {/* Header del Drawer */}
                    <div className="flex h-16 shrink-0 items-center border-b border-border/80 px-6 justify-between">
                      <Link to={homePath} className="flex items-center gap-2" onClick={() => setIsMobileOpen(false)}>
                        <Logo size={28} className="[&_span]:scale-95 [&_span]:origin-left" />
                      </Link>
                      <SheetClose asChild>
                        <button className="rounded-md p-1.5 text-muted-foreground hover:bg-slate-100 cursor-pointer">
                          <X className="size-5" />
                        </button>
                      </SheetClose>
                    </div>

                    {/* Contenido / Navegación Móvil */}
                    <nav className="space-y-1 px-4 py-6 flex-1">
                      {navItems.map((item, index) => {
                        const Icon = item.icon;
                        if (item.disabled) {
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/30 cursor-not-allowed select-none rounded-md"
                            >
                              <Icon className="size-4.5 shrink-0" />
                              <span>{item.label}</span>
                            </div>
                          );
                        }

                        return (
                          <div key={index} className="flex flex-col">
                            <Link
                              to={item.to}
                              onClick={() => setIsMobileOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors",
                                item.active
                                  ? "bg-slate-100 text-black border-l-2 border-black rounded-l-none"
                                  : "text-muted-foreground hover:text-black hover:bg-slate-50"
                              )}
                            >
                              <Icon className={cn("size-4.5 shrink-0", item.active ? "text-black" : "text-muted-foreground")} />
                              <span>{item.label}</span>
                            </Link>

                            {/* Submenús Móviles */}
                            {item.subItems && (
                              <div className="ml-8 mt-1 mb-4 flex flex-col space-y-1.5 border-l border-border/60 pl-3">
                                {item.subItems.map((sub, subIdx) => {
                                  const SubIcon = sub.icon;
                                  if (sub.disabled) {
                                    return (
                                      <div 
                                        key={subIdx} 
                                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground/30 cursor-not-allowed select-none"
                                      >
                                        <SubIcon className="size-3.5 shrink-0" />
                                        <span className="truncate leading-tight">{sub.label}</span>
                                      </div>
                                    );
                                  }
                                  return (
                                    <Link 
                                      key={subIdx} 
                                      to={sub.to} 
                                      onClick={() => setIsMobileOpen(false)}
                                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-slate-50"
                                    >
                                      <SubIcon className="size-3.5 shrink-0" />
                                      <span className="truncate leading-tight">{sub.label}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Footer del Drawer */}
                  <div className="border-t border-border/80 p-6 space-y-4 shrink-0 bg-white">
                    {/* Selector de idioma móvil */}
                    <button
                      onClick={() => {
                        setIsMobileOpen(false);
                        switchLanguage();
                      }}
                      className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors py-2.5 cursor-pointer text-left uppercase tracking-wider w-full justify-center border border-border/80 rounded"
                    >
                      <Globe className="size-4" />
                      {locale === 'en' ? 'Español' : 'English'}
                    </button>

                    {/* Botón de donación Ko-fi móvil */}
                    <a
                      href="https://ko-fi.com/pixetide"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center py-3 px-5 btn-support-kofi text-xs w-full"
                    >
                      <span>{t('nav.support')}</span>
                      <svg 
                        className="w-5 h-5 ml-2 flex-shrink-0" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M3 5C3 3.89543 3.89543 3 5 3H15C16.1046 3 17 3.89543 17 5V11C17 14.3137 14.3137 17 11 17H9C5.68629 17 3 14.3137 3 11V5Z" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
                        <path d="M17 6H19C20.6569 6 22 7.34315 22 9C22 10.6569 20.6569 12 19 12H17" stroke="#000000" strokeWidth="2.5" />
                      </svg>
                    </a>
                  </div>

                </SheetContent>
              </Sheet>
            </div>

            {/* Título de la sección actual (Herramientas / Tools) con Breadcrumb dinámico unificado en tipografía sans-serif */}
            <h1 className="text-xs sm:text-sm font-sans font-semibold text-primary flex items-center gap-1.5 sm:gap-2 select-none">
              {isDashboardHome ? (
                <span>{t('nav.tools')}</span>
              ) : (
                <>
                  <Link to={toolsPath} className="text-muted-foreground hover:text-primary transition-colors font-medium">
                    {t('nav.tools')}
                  </Link>
                  <span className="text-muted-foreground/45 font-light text-xs font-mono">&gt;</span>
                  <span className="text-primary font-semibold">
                    {toolTitle}
                  </span>
                </>
              )}
            </h1>
          </div>

          {/* Lado derecho del Header: Botón de GitHub */}
          <div className="flex items-center gap-4 select-none shrink-0">
            <a
              href="https://github.com/gTaitasaur"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-transparent text-primary hover:bg-neutral-50 border border-primary font-medium text-xs uppercase tracking-[0.1em] transition-all cursor-pointer gap-2"
            >
              <svg className="size-4 text-primary shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>

        </header>

        {/* ─── CONTENIDO PRINCIPAL (OUTLET PARA SUBRUTAS) ─── */}
        <main className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden p-6 md:p-8 lg:p-8 w-full">
          <div className="flex-1 min-h-0 w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};
