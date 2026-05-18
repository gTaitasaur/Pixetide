import React from 'react';
import './Errors.css';

interface ToolErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ToolError: React.FC<ToolErrorProps> = ({ 
  title = "Error de Procesamiento", 
  message, 
  onRetry 
}) => {
  return (
    <div className="tool-error-container fade-up">
      <div className="tool-error-icon">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="3" fill="none">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="tool-error-content">
        <h4 className="tool-error-title">{title}</h4>
        <p className="tool-error-message">{message}</p>
      </div>
      {onRetry && (
        <button className="tool-error-retry" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
};
