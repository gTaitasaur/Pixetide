import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../UI/Logo';
import { useLocale } from '../../i18n/useLocale';
import { SEO_PAGES } from '../../seo/seoConfig';
import './Navbar.css';

/**
 * Navbar con internacionalización y selector de idioma.
 *
 * El selector EN/ES funciona así:
 * 1. Detecta en qué página estás (ej: /tools/compress-image)
 * 2. Busca la página equivalente en el otro idioma en seoConfig
 * 3. Navega a esa URL (ej: /es/herramientas/comprimir-imagen)
 *
 * Si no encuentra equivalente (ej: estás en una página que no existe
 * en seoConfig), redirige al home del otro idioma.
 */
export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t, locale } = useLocale();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const homePath = locale === 'es' ? '/es/' : '/';

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    document.body.style.overflow = 'unset';
  };

  /**
   * Cambia al otro idioma manteniendo la misma herramienta.
   * Busca la página actual en seoConfig y navega a su equivalente.
   */
  const switchLanguage = () => {
    const targetLocale = locale === 'en' ? 'es' : 'en';

    // Buscar la página actual en cualquier idioma
    const currentPage = SEO_PAGES.find((page) => {
      const enPath = page.path.en.replace(/\/$/, '') || '/';
      const esPath = page.path.es.replace(/\/$/, '') || '/es';
      const normalizedCurrent = pathname.replace(/\/$/, '') || '/';
      return normalizedCurrent === enPath || normalizedCurrent === esPath;
    });

    if (currentPage) {
      navigate(currentPage.path[targetLocale]);
    } else {
      // Fallback: ir al home del otro idioma
      navigate(targetLocale === 'es' ? '/es/' : '/');
    }

    closeMenu();
  };

  return (
    <div className="navbar-wrapper">
      <nav className="navbar">
        <div className="navbar-container">
          <Link to={homePath} className="brand-link" onClick={closeMenu}>
            <Logo size={64} />
          </Link>

          {/* Desktop Links */}
          <div className="navbar-links desktop-only">
            <Link to={homePath} className="nav-link">{t('nav.home')}</Link>
            <Link to={homePath} className="nav-link">{t('nav.tools')}</Link>

            {/* Selector de idioma */}
            <button
              className="lang-switch-btn"
              onClick={switchLanguage}
              aria-label={t('lang.switchLabel')}
              title={t('lang.switchLabel')}
            >
              {t('lang.switch')}
            </button>

            {/* Ko-fi Support */}
            <a
              href="https://ko-fi.com/taitasaur"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-btn-support"
            >
              {t('nav.support')}
            </a>
          </div>

          {/* Burger Button (Mobile) */}
          <button
            className={`burger-menu ${isOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label={t('nav.openMenu')}
          >
            <span className="burger-line"></span>
            <span className="burger-line"></span>
            <span className="burger-line"></span>
          </button>
        </div>
      </nav>

      {/* Fullscreen Overlay Mobile Menu */}
      <div className={`nav-overlay ${isOpen ? 'active' : ''}`}>
        <button className="close-overlay" onClick={closeMenu} aria-label={t('nav.closeMenu')}>
          ×
        </button>
        <div className="overlay-content">
          <Link to={homePath} className="overlay-link" onClick={closeMenu}>{t('nav.home')}</Link>
          <Link to={homePath} className="overlay-link" onClick={closeMenu}>{t('nav.tools')}</Link>

          {/* Selector de idioma mobile */}
          <button
            className="overlay-link lang-switch-mobile"
            onClick={switchLanguage}
          >
            🌐 {locale === 'en' ? 'Español' : 'English'}
          </button>

          {/* Ko-fi Support mobile */}
          <div className="mobile-support-wrapper">
            <span className="mobile-support-microcopy">{t('nav.supportMicrocopy')}</span>
            <a
              href="https://ko-fi.com/pixetide"
              target="_blank"
              rel="noopener noreferrer"
              className="overlay-link support-btn"
              onClick={closeMenu}
            >
              {t('nav.support')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
