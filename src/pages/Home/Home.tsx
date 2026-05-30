import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../shared/components/UI/Card';
import { useLocale } from '../../core/i18n/useLocale';
import { SEO_PAGES } from '../../core/seo/seoConfig';
import WorkingOnIt from '../../shared/components/UI/WorkingOnIt/WorkingOnIt';
import { 
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
  Globe 
} from 'lucide-react';

/** Helper para obtener la ruta de una herramienta por su ID y locale */
function getToolPath(id: string, locale: 'en' | 'es'): string {
  const page = SEO_PAGES.find((p) => p.id === id);
  return page?.path[locale] ?? '/';
}

/**
 * Home Page — Rework completo del Hero Section con diseño editorial de alta fidelidad.
 * 
 * Cambios destacados:
 * - Colocación exacta debajo del Navbar mediante pt-20 (80px) en el flujo normal del documento.
 * - Marca de agua decorativa gigante ("PRIVACIDAD" / "PRIVACY") con opacidad del 3%.
 * - Layout de dos columnas en desktop (Tipografía y CTAs a la izquierda, lista editorial a la derecha).
 * - Grilla original de herramientas (.tools-grid) conservada intacta debajo.
 */
export const Home: React.FC = () => {
  const { t, locale } = useLocale();

  const scrollToTools = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById('tools-grid-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const githubText = t('home.heroGithubCta');
  const ctaText = t('home.heroPrimaryCta');
  const badgeText = t('home.badgeText');
  const featuredTitle = t('home.featuredTitle');
  const watermarkText = t('home.watermarkText');

  // Texto del subtítulo del Hero
  const heroSubtitle = t('home.editorialHeroSubtitle');

  // Herramientas destacadas en la columna editorial derecha — Alineadas con el prototipo exacto
  const featuredTools = [
    { id: 'convert', label: t('home.featured.convert'), num: '01' },
    { id: 'remove-bg', label: t('home.featured.removeBg'), num: '02' },
    { id: 'watermark', label: t('home.featured.watermark'), num: '03' },
    { id: 'compress', label: t('home.featured.compress'), num: '04' },
  ] as const;

  const moreToolsLabel = t('home.moreTools');

  return (
    <div className="w-full flex flex-col items-center bg-background min-h-screen relative pt-20 overflow-x-hidden">

      {/* Marca de agua gigante decorativa de fondo */}
      <div className="absolute top-24 left-0 w-full overflow-hidden pointer-events-none select-none z-0 opacity-[0.03]">
        <h1 className="text-[15vw] font-serif font-bold leading-none whitespace-nowrap tracking-tighter text-primary">
          {watermarkText}
        </h1>
      </div>

      {/* ─── NEW HERO SECTION ─── */}
      <section className="relative z-10 w-full max-w-[1600px] px-6 md:px-12 pt-16 md:pt-24 lg:pt-36 pb-6 md:pb-8 flex flex-col lg:flex-row gap-16 items-start">

        {/* Columna Izquierda: Tipografía y Botones de Acción */}
        <div className="flex-1 lg:pr-12">
          <div className="mb-8 md:mb-12">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-4 leading-snug">
              <span className="w-8 h-px bg-muted-foreground shrink-0"></span>
              <span>
                <>{t('home.heroMicrocopyLine1')}<br />{t('home.heroMicrocopyLine2')}</>
              </span>
            </p>

            <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-primary font-black leading-[1.05] tracking-tight mb-8">
              {t('home.heroTitleLine1')}<br />
              <span className="italic font-semibold text-neutral-500">{t('home.heroTitleAccent')}</span>
            </h2>

            {/* Subtítulo — Hardcodeado temporalmente para fidelidad con el prototipo */}
            <p className="text-xl md:text-2xl text-neutral-700 max-w-xl leading-relaxed font-light">
              {heroSubtitle}
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-6 mt-12">
            <a
              href="#tools-grid-section"
              onClick={scrollToTools}
              className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-primary text-white font-medium text-sm uppercase tracking-[0.12em] hover:bg-neutral-800 transition-all border-2 border-primary hover:-translate-y-1 cursor-pointer"
            >
              {ctaText}
            </a>
            <a
              href="https://github.com/taitasaur/MarkWaterImg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-transparent text-primary font-medium text-sm uppercase tracking-[0.12em] border-2 border-primary hover:bg-neutral-50 transition-all cursor-pointer"
            >
              {githubText}
            </a>
          </div>

          {/* Badge de confianza — Icono "verified" similar al del prototipo (Material Symbols) */}
          <p className="mt-12 text-sm text-muted-foreground flex items-center gap-2 font-mono">
            <svg className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1.5 15.5l-4-4 1.41-1.41L10.5 13.67l5.59-5.59L17.5 9.5l-7 7z" />
            </svg>
            {badgeText}
          </p>
        </div>

        {/* Columna Derecha: Grilla/Listado Editorial */}
        <div className="flex-1 w-full lg:mt-0 relative">
          <div className="border-t-2 border-gray-300 pt-8">
            <h3 className="font-serif text-2xl mb-8 font-semibold text-primary">
              {featuredTitle}
            </h3>

            <div className="space-y-0 divide-y divide-gray-300">
              {featuredTools.map(({ id, label, num }) => (
                <Link
                  key={id}
                  to={getToolPath(id, locale)}
                  className="group flex items-center justify-between py-6 hover:pl-4 transition-all duration-300"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="text-xs font-mono tracking-wider text-muted-foreground/80 select-none">{num}</span>
                    <h4 className="text-xl font-medium text-foreground group-hover:text-primary transition-colors">
                      {label}
                    </h4>
                  </div>
                  <svg
                    className="size-5 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              ))}

              {/* Ítem final: "05 Más Herramientas . . ." — enlaza al Hub */}
              <a
                href="#tools-grid-section"
                onClick={scrollToTools}
                className="group flex items-center justify-between py-6 hover:pl-4 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-baseline gap-4">
                  <span className="text-xs font-mono tracking-wider text-muted-foreground/80 select-none">05</span>
                  <h4 className="text-xl font-medium text-foreground group-hover:text-primary transition-colors">
                    {moreToolsLabel}
                  </h4>
                </div>
                <svg
                  className="size-5 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>

      </section>

      {/* ─── NEW TOOLS GRID SECTION ─── */}
      <section id="tools-grid-section" className="relative z-10 w-full max-w-[1600px] px-6 md:px-12 pb-24 md:pb-32 mt-6 md:mt-8 scroll-mt-24">

        <div className="border-t border-border/80 pt-12 md:pt-16 mb-12 flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
          <div>
            <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-primary">
              {t('home.allToolsTitle')}
            </h2>
          </div>
        </div>

        {/* Grilla Responsiva: 1 col en mobile, 2 en tablet (sm/md), 3 en laptops, 4 en desktop xl */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">

          {/* 1. Comprimir */}
          <Card
            to={getToolPath('compress', locale)}
            icon={<Minimize2 />}
            title={t('card.compress.title')}
            description={t('card.compress.desc')}
          />

          {/* 2. Convertir */}
          <Card
            to={getToolPath('convert', locale)}
            icon={<ArrowLeftRight />}
            title={t('card.convert.title')}
            description={t('card.convert.desc')}
          />

          {/* 3. Recortar */}
          <Card
            to={getToolPath('crop', locale)}
            icon={<Crop />}
            title={t('card.crop.title')}
            description={t('card.crop.desc')}
          />

          {/* 4. Marca de agua */}
          <Card
            to={getToolPath('watermark', locale)}
            icon={<Stamp />}
            title={t('card.watermark.title')}
            description={t('card.watermark.desc')}
          />

          {/* 5. Quitar fondo */}
          <Card
            to={getToolPath('remove-bg', locale)}
            icon={<Eraser />}
            title={t('card.removeBg.title')}
            description={t('card.removeBg.desc')}
          />

          {/* 6. Girar y Voltear */}
          <Card
            to={getToolPath('rotate-flip', locale)}
            icon={<RotateCw />}
            title={t('card.rotateFlip.title')}
            description={t('card.rotateFlip.desc')}
          />

          {/* 7. Paleta de Colores */}
          <Card
            to={getToolPath('color-palette', locale)}
            icon={<Palette />}
            title={t('card.colorPalette.title')}
            description={t('card.colorPalette.desc')}
          />

          {/* 8. Base64 */}
          <Card
            to={getToolPath('base64', locale)}
            icon={<Binary />}
            title={t('card.base64.title')}
            description={t('card.base64.desc')}
          />

          {/* 9. Próximamente */}
          <Card
            disabled
            icon={<Sparkles />}
            title={t('card.upscale.title')}
            description={t('card.upscale.desc')}
          />

          <Card
            disabled
            icon={<Sliders />}
            title={t('card.photoEditor.title')}
            description={t('card.photoEditor.desc')}
          />

          <Card
            disabled
            icon={<Globe />}
            title={t('card.favicon.title')}
            description={t('card.favicon.desc')}
          />
        </div>
      </section>

      {/* Floating fixed widget for Working On It */}
      <div className="fixed bottom-12 right-6 z-50 scale-105 md:scale-95 lg:scale-100 origin-bottom-right transition-transform duration-300">
        <WorkingOnIt />
      </div>
    </div>
  );
};
