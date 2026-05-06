import React, { Component, ErrorInfo, ReactNode } from 'react';
import './Errors.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Crítico detectado:', error, errorInfo);
  }

  private handleRestart = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-page-container">
          <div className="error-content-card critical">
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
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h1 className="error-title">Error Crítico</h1>
            <p className="error-message">
              Algo ha explotado internamente. No te preocupes, tus archivos están seguros porque todo se procesa en tu navegador.
            </p>
            <button 
              onClick={this.handleRestart} 
              className="error-btn-primary"
            >
              Reiniciar Aplicación
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="error-debug">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
