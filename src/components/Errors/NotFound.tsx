import React from 'react';
import { Link } from 'react-router-dom';
import './Errors.css';

export const NotFound: React.FC = () => {
  return (
    <div className="error-page-container">
      <div className="error-content-card">
        <div className="error-icon-wrapper">
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="error-svg"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="15" x2="16" y2="15" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>
        <h1 className="error-title">¡Ups! 404</h1>
        <p className="error-message">
          Esta foto se nos ha perdido en el revelado. La página que buscas no existe o ha sido movida a otro álbum.
        </p>
        <Link to="/" className="error-btn-primary">
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
};
