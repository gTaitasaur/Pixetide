import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { ErrorBoundary } from './shared/components/Errors/ErrorBoundary';
import { ToastProvider } from './shared/components/Errors/ToastContext';
import { ToastContainer } from './shared/components/UI/Toast/ToastContainer';
import { SeoHead } from './core/seo/SeoHead';
import { SchemaMarkup } from './core/seo/SchemaMarkup';
import './App.css';

/**
 * App.tsx — Punto de entrada del CLIENTE.
 *
 * Envuelve AppRoutes con BrowserRouter (necesita window.history).
 * SeoHead solo se monta aquí (cliente) porque manipula document.head.
 * El servidor inyecta los meta tags directamente en el HTML.
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ErrorBoundary>
          <SeoHead />
          <SchemaMarkup />
          <ToastContainer />
          <AppRoutes />
        </ErrorBoundary>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
