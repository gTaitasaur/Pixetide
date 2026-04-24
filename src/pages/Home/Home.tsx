import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

export const Home: React.FC = () => {
  return (
    <div className="home-container">
      <section className="hero-section">
        <h1 className="hero-title">
          Tus imágenes, <span>perfectas.</span>
        </h1>
        <p className="hero-subtitle">
          Herramientas gratuitas y seguras para preparar tus fotos físicas para el mundo digital. Todo el procesamiento ocurre en tu dispositivo, nada se sube a internet.
        </p>
      </section>

      <div className="tools-grid">
        <Link to="/herramientas/recorte-aspect-ratio" className="tool-card">
          <div className="tool-icon-wrapper">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
          <h3>Encuadre Redes Sociales</h3>
          <p>Ajusta tu fotografía exactamente a la proporción que usan plataformas como Instagram o Pinterest de forma intuitiva.</p>
        </Link>
        
        {/* Optimización de Peso */}
        <Link to="/herramientas/optimizar-peso" className="tool-card">
          <div className="tool-icon-wrapper">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3>Optimización de Peso</h3>
          <p>Comprime drásticamente el peso de tus imágenes (hasta un 80% menos) conservando su resolución.</p>
        </Link>

        {/* Cambio de formato */}
        <Link to="/herramientas/cambiar-formato" className="tool-card">
          <div className="tool-icon-wrapper">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3>Conversor de Formatos</h3>
          <p>Transforma al instante entre JPG, PNG, y los modernos WebP / AVIF para la web.</p>
        </Link>

        {/* Marca de agua */}
        <div style={{opacity: 0.6}} className="tool-card">
          <div className="tool-icon-wrapper" style={{ backgroundColor: '#f5f5f7', color: '#86868b' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h3>Sello y Marca de Agua</h3>
          <p>Firma tus fotografías con tu propio logotipo o texto para evitar el uso indebido de tus obras. (Próximamente)</p>
        </div>

        {/* Mejorar Calidad */}
        <div style={{opacity: 0.6}} className="tool-card">
          <div className="tool-icon-wrapper" style={{ backgroundColor: '#f5f5f7', color: '#86868b' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h3>Escalado de Calidad</h3>
          <p>Recupera la nitidez de fotos antiguas o ensancha el tamaño (Upscaler) usando tecnología moderna. (Próximamente)</p>
        </div>

        {/* Removedor de Fondo */}
        <div style={{opacity: 0.6}} className="tool-card">
          <div className="tool-icon-wrapper" style={{ backgroundColor: '#f5f5f7', color: '#86868b' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
            </svg>
          </div>
          <h3>Recorte Mágico de Fondo</h3>
          <p>Extrae instantáneamente el sujeto principal de tu foto eliminando el fondo para usarlo en miniaturas o perfiles. (Próximamente)</p>
        </div>

        {/* Paleta de Colores */}
        <div style={{opacity: 0.6}} className="tool-card">
          <div className="tool-icon-wrapper" style={{ backgroundColor: '#f5f5f7', color: '#86868b' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h3>Paleta de Colores Externa</h3>
          <p>Obtén muestras hexadecimales precisas y genera una paleta hermosa calculando los tonos base de tu fotografía. (Próximamente)</p>
        </div>

        {/* Filtros */}
        <div style={{opacity: 0.6}} className="tool-card">
          <div className="tool-icon-wrapper" style={{ backgroundColor: '#f5f5f7', color: '#86868b' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h3>Retoque Inteligente</h3>
          <p>Corrige iluminación, aplica filtros intensos o dale texturas creativas a tus fotos en apenas un par de clics. (Próximamente)</p>
        </div>

        {/* Transformador Base64 */}
        <div style={{opacity: 0.6}} className="tool-card">
          <div className="tool-icon-wrapper" style={{ backgroundColor: '#f5f5f7', color: '#86868b' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h3>Compilador a Base64</h3>
          <p>Descompone imágenes ultraligeras en puro texto encriptado para integrarlas directamente dentro del código de sitios web. (Próximamente)</p>
        </div>

        {/* Favicons */}
        <div style={{opacity: 0.6}} className="tool-card">
          <div className="tool-icon-wrapper" style={{ backgroundColor: '#f5f5f7', color: '#86868b' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <h3>Generador de Favicons</h3>
          <p>Sube tu logotipo y descarga instantáneamente el paquete de iconos estandarizados (.ico) para la pestaña de tu navegador. (Próximamente)</p>
        </div>
      </div>
    </div>
  );
};
