import React from 'react';
import { BackgroundRemoverModule } from '../../../components/BackgroundRemover/BackgroundRemoverModule';

export const BackgroundRemoverTool: React.FC = () => {
  return (
    <div className="home-container" style={{ paddingTop: '20px' }}>
      <section className="hero-section" style={{ marginBottom: '40px' }}>
        <h1 className="hero-title">Quitar <span>Fondo.</span></h1>
        <p className="hero-subtitle">Elimina el fondo de cualquier imagen mágicamente usando Inteligencia Artificial directamente en tu navegador. Privado, rápido y profesional.</p>
      </section>

      <BackgroundRemoverModule />
    </div>
  );
};
