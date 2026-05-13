/**
 * Footer.tsx — Footer semántico con links internos para SEO.
 *
 * ¿Por qué un footer con links?
 * Google valora los internal links porque le ayudan a descubrir y entender
 * la estructura del sitio. Un footer con links a todas las herramientas:
 * 1. Refuerza la autoridad de cada página (link equity)
 * 2. Facilita el crawl: Google puede llegar a cualquier herramienta desde cualquier página
 * 3. Mejora la UX: el usuario puede navegar a otra herramienta sin volver al home
 *
 * Los links se generan desde seoConfig.ts para mantener la fuente única de verdad.
 * Solo muestra herramientas del idioma actual (no mezcla EN con ES).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../i18n/useLocale';
import { SEO_PAGES, SITE_CONFIG } from '../../seo/seoConfig';
import './Footer.css';

export const Footer: React.FC = () => {
  const { t, locale } = useLocale();

  // Filtrar solo las herramientas (excluir home)
  const tools = SEO_PAGES.filter((page) => page.id !== 'home');

  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* ─── Columna 1: Branding ─── */}
          <div className="footer-col branding">
            <h3 className="footer-logo">Pixetide</h3>
            <p className="footer-tagline">{t('footer.tagline')}</p>
            <a
              href="https://ko-fi.com/taitasaur"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-kofi"
            >
              {t('nav.support')}
            </a>
          </div>

          {/* ─── Columna 2: Todas las herramientas ─── */}
          <nav className="footer-col" aria-label={t('footer.tools')}>
            <h4 className="footer-title">{t('footer.tools')}</h4>
            <ul className="footer-links">
              {tools.map((tool) => (
                <li key={tool.id}>
                  <Link to={tool.path[locale]} className="footer-link">
                    {tool.h1[locale].replace(/\s—.*$/, '')}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ─── Columna 3: Info ─── */}
          <div className="footer-col">
            <h4 className="footer-title">{t('footer.about')}</h4>
            <ul className="footer-links">
              <li>
                <Link to={locale === 'es' ? '/es/' : '/'} className="footer-link">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <a
                  href="https://ko-fi.com/pixetide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  Ko-fi
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── Bottom bar ─── */}
        <div className="footer-bottom">
          <p className="footer-copy">
            © {new Date().getFullYear()} {SITE_CONFIG.siteName}. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};
