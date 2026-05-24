import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { ErrorBoundary } from './shared/components/Errors/ErrorBoundary';
import { ToastProvider } from './shared/components/Errors/ToastContext';
import { ToastContainer } from './shared/components/UI/Toast/ToastContainer';
import { SeoHead } from './core/seo/SeoHead';
import { SchemaMarkup } from './core/seo/SchemaMarkup';
import { LocaleProvider } from './core/i18n/LocaleProvider';
import './App.css';

/**
 * App.tsx — Punto de entrada del CLIENTE.
 *
 * Envuelve AppRoutes con BrowserRouter (necesita window.history).
 * SeoHead solo se monta aquí (cliente) porque manipula document.head.
 * El servidor inyecta los meta tags directamente en el HTML.
 *
 * LocaleProvider va DENTRO de BrowserRouter para acceder a useLocation.
 * El idioma se persiste en localStorage y se sincroniza con la URL.
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LocaleProvider>
        <ToastProvider>
          <ErrorBoundary>
            <SeoHead />
            <SchemaMarkup />
            <ToastContainer />
            <AppRoutes />
          </ErrorBoundary>
        </ToastProvider>
      </LocaleProvider>
    </BrowserRouter>
  );
}

export default App;
