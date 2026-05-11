import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { ErrorBoundary } from './components/Errors/ErrorBoundary';
import { ToastProvider } from './components/Errors/ToastContext';
import { ToastContainer } from './components/UI/Toast/ToastContainer';
import { SeoHead } from './seo/SeoHead';
import { SchemaMarkup } from './seo/SchemaMarkup';
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
