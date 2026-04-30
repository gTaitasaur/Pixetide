import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

export const Home: React.FC = () => {
  return (
    <div className="home-container">
      <section className="hero-section">
        <h1 className="hero-title">
          Optimiza tus imágenes. <span>Rápido, gratis y 100% privado.</span>
        </h1>
        <p className="hero-subtitle">
          Edita, comprime y convierte tus fotos sin subir nada a internet. Todo el procesamiento se realiza localmente en tu navegador para garantizar tu privacidad y ahorrarte horas de trabajo. Una suite creada con dedicación para hacerte la vida más fácil.
        </p>
      </section>

      <div className="tools-grid">
        <Link to="/herramientas/recorte-aspect-ratio" className="tool-card">
          <div className="tool-icon-wrapper">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
          <h3>Recortar Fotos para Redes</h3>
          <p>Adapta tus imágenes al tamaño perfecto para Instagram, Facebook o Pinterest. Recorta fotos online fácilmente y sin perder calidad.</p>
        </Link>
        
        {/* Optimización de Peso */}
        <Link to="/herramientas/optimizar-peso" className="tool-card">
          <div className="tool-icon-wrapper">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3>Comprimir Imágenes sin Perder Calidad</h3>
          <p>Reduce el peso de tus fotos JPG, PNG o WebP hasta en un 80% para que tu web cargue más rápido. Compresión inteligente, segura y al instante.</p>
        </Link>

        {/* Cambio de formato */}
        <Link to="/herramientas/cambiar-formato" className="tool-card">
          <div className="tool-icon-wrapper">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3>Convertir Formato de Imagen</h3>
          <p>Convierte fotos a WebP, AVIF, JPG o PNG de forma masiva. El formato ideal para optimizar tu SEO y mejorar la experiencia de tus usuarios.</p>
        </Link>

        {/* Girar y Voltear */}
        <Link to="/herramientas/girar-voltear" className="tool-card">
          <div className="tool-icon-wrapper">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3>Girar y Voltear Imágenes</h3>
          <p>Rota tus fotos o aplícales un efecto espejo fácilmente. Ideal para enderezar imágenes torcidas o crear composiciones simétricas de forma 100% privada.</p>
        </Link>

        {/* Marca de agua */}
        <div style={{opacity: 0.6}} className="tool-card">
          <div className="tool-icon-wrapper" style={{ backgroundColor: '#f5f5f7', color: '#86868b' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h3>Poner Marca de Agua a Fotos</h3>
          <p>Protege tus fotografías añadiendo tu logo o texto como marca de agua. Como procesamos todo localmente, nadie más verá tus archivos originales. (Próximamente)</p>
        </div>

        {/* Mejorar Calidad */}
        <div style={{opacity: 0.6}} className="tool-card">
          <div className="tool-icon-wrapper" style={{ backgroundColor: '#f5f5f7', color: '#86868b' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h3>Mejorar Calidad de Imagen</h3>
          <p>Aumenta la resolución de fotos borrosas o antiguas. Agranda imágenes sin pixelarlas usando tecnología de escalado avanzada desde tu navegador. (Próximamente)</p>
        </div>

        {/* Removedor de Fondo */}
        <div style={{opacity: 0.6}} className="tool-card">
          <div className="tool-icon-wrapper" style={{ backgroundColor: '#f5f5f7', color: '#86868b' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
            </svg>
          </div>
          <h3>Quitar Fondo de Imagen</h3>
          <p>Elimina el fondo de tus fotos automáticamente de forma segura. Crea recortes perfectos con fondo transparente para tus diseños web o miniaturas. (Próximamente)</p>
        </div>

        {/* Paleta de Colores */}
        <div style={{opacity: 0.6}} className="tool-card">
          <div className="tool-icon-wrapper" style={{ backgroundColor: '#f5f5f7', color: '#86868b' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h3>Extraer Paleta de Colores</h3>
          <p>Saca los colores predominantes de cualquier imagen y obtén sus códigos HEX. La herramienta ideal para diseñadores web y creativos. (Próximamente)</p>
        </div>

        {/* Filtros */}
        <div style={{opacity: 0.6}} className="tool-card">
          <div className="tool-icon-wrapper" style={{ backgroundColor: '#f5f5f7', color: '#86868b' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h3>Editor de Fotos Online</h3>
          <p>Ajusta el brillo, contraste y aplica filtros profesionales gratis. Edición fotográfica rápida y privada desde la comodidad de tu pantalla. (Próximamente)</p>
        </div>

        {/* Transformador Base64 */}
        <div style={{opacity: 0.6}} className="tool-card">
          <div className="tool-icon-wrapper" style={{ backgroundColor: '#f5f5f7', color: '#86868b' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h3>Convertir Imagen a Base64</h3>
          <p>Transforma tus iconos e imágenes a código Base64 para incrustarlos directamente en tu HTML o CSS, ahorrando peticiones al servidor. (Próximamente)</p>
        </div>

        {/* Favicons */}
        <div style={{opacity: 0.6}} className="tool-card">
          <div className="tool-icon-wrapper" style={{ backgroundColor: '#f5f5f7', color: '#86868b' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <h3>Generador de Favicon ICO</h3>
          <p>Crea el icono perfecto para tu página web. Sube tu logo y conviértelo a .ico y otros formatos estandarizados listos para usar. (Próximamente)</p>
        </div>
      </div>
    </div>
  );
};
