import React from 'react';
import { Card } from '../../components/UI/Card';
import { useLocale } from '../../i18n/useLocale';
import { SEO_PAGES } from '../../seo/seoConfig';
import './Home.css';

/**
 * Home Page — Hub de herramientas con contenido localizado.
 *
 * Copy optimizado para SEO:
 * - H1 incluye keywords principales + nombre de marca
 * - Subtítulo refuerza el ángulo de privacidad (diferenciador clave)
 * - Cada card tiene copy orientado a intención de búsqueda
 *
 * Los links se generan desde seoConfig.ts, así si cambias una URL
 * allí, se actualiza automáticamente aquí.
 */

/** Helper para obtener la ruta de una herramienta por su ID y locale */
function getToolPath(id: string, locale: 'en' | 'es'): string {
  const page = SEO_PAGES.find((p) => p.id === id);
  return page?.path[locale] ?? '/';
}

export const Home: React.FC = () => {
  const { t, locale } = useLocale();

  return (
    <div className="home-container">
      <div className="hub-wrapper">
        <section className="hero-section">
          <h1 className="hero-title">{t('home.heroTitle')}</h1>
          <p className="hero-subtitle">{t('home.heroSubtitle')}</p>
        </section>

        <div className="tools-grid">
          {/* 1. Comprimir */}
          <Card
            to={getToolPath('compress', locale)}
            icon={(
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            )}
            title={t('card.compress.title')}
            description={t('card.compress.desc')}
          />

          {/* 2. Convertir */}
          <Card
            to={getToolPath('convert', locale)}
            icon={(
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            )}
            title={t('card.convert.title')}
            description={t('card.convert.desc')}
          />

          {/* 3. Recortar */}
          <Card
            to={getToolPath('crop', locale)}
            icon={(
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
            title={t('card.crop.title')}
            description={t('card.crop.desc')}
          />

          {/* 4. Marca de agua */}
          <Card
            to={getToolPath('watermark', locale)}
            icon={(
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            )}
            title={t('card.watermark.title')}
            description={t('card.watermark.desc')}
          />

          {/* 5. Quitar fondo */}
          <Card
            to={getToolPath('remove-bg', locale)}
            icon={(
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
            )}
            title={t('card.removeBg.title')}
            description={t('card.removeBg.desc')}
          />

          {/* 6. Girar y Voltear */}
          <Card
            to={getToolPath('rotate-flip', locale)}
            icon={(
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            title={t('card.rotateFlip.title')}
            description={t('card.rotateFlip.desc')}
          />

          {/* 7. Paleta de Colores */}
          <Card
            to={getToolPath('color-palette', locale)}
            icon={(
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            )}
            title={t('card.colorPalette.title')}
            description={t('card.colorPalette.desc')}
          />

          {/* 8. Base64 */}
          <Card
            to={getToolPath('base64', locale)}
            icon={(
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            )}
            title={t('card.base64.title')}
            description={t('card.base64.desc')}
          />

          {/* 9. Próximamente */}
          <Card
            disabled
            icon={(
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            )}
            title={t('card.upscale.title')}
            description={t('card.upscale.desc')}
          />

          <Card
            disabled
            icon={(
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            )}
            title={t('card.photoEditor.title')}
            description={t('card.photoEditor.desc')}
          />

          <Card
            disabled
            icon={(
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            )}
            title={t('card.favicon.title')}
            description={t('card.favicon.desc')}
          />
        </div>
      </div>
    </div>
  );
};
