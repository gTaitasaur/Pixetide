import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../UI/Logo';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    // Evitar scroll cuando el menú está abierto
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

  return (
    <div className="navbar-wrapper">
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="brand-link" onClick={closeMenu}>
            <Logo size={64} />
          </Link>

          {/* Desktop Links */}
          <div className="navbar-links desktop-only">
            <Link to="/" className="nav-link">Inicio</Link>
            <Link to="/" className="nav-link">Herramientas</Link>
            <Link to="/" className="nav-link">Acerca de</Link>
            <div className="nav-support-wrapper">
              <a
                href="https://ko-fi.com/TU_USUARIO"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-btn-support"
              >
                Apoya a Pixetide ☕
              </a>
            </div>
          </div>

          {/* Burger Button (Mobile) */}
          <button
            className={`burger-menu ${isOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label="Abrir menú"
          >
            <span className="burger-line"></span>
            <span className="burger-line"></span>
            <span className="burger-line"></span>
          </button>
        </div>
      </nav>

      {/* Fullscreen Overlay Mobile Menu */}
      <div className={`nav-overlay ${isOpen ? 'active' : ''}`}>
        <button className="close-overlay" onClick={closeMenu} aria-label="Cerrar menú">
          ×
        </button>
        <div className="overlay-content">
          <Link to="/" className="overlay-link" onClick={closeMenu}>Inicio</Link>
          <Link to="/" className="overlay-link" onClick={closeMenu}>Herramientas</Link>
          <Link to="/" className="overlay-link" onClick={closeMenu}>Acerca de</Link>
          <div className="mobile-support-wrapper">
            <span className="mobile-support-microcopy">Sin anuncios, sin suscripciones. Ayúdame a que siga así.</span>
            <a
              href="https://ko-fi.com/TU_USUARIO"
              target="_blank"
              rel="noopener noreferrer"
              className="overlay-link support-btn"
              onClick={closeMenu}
            >
              Apoya a Pixetide ☕
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

