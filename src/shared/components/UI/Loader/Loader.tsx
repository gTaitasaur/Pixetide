import React from 'react';
import './Loader.css';

interface LoaderProps {
  message?: string;
  description?: string;
  variant?: 'spinner' | 'overlay' | 'inline';
  size?: 'sm' | 'md' | 'lg';
}

export const Loader: React.FC<LoaderProps> = ({
  message,
  description,
  variant = 'spinner',
  size = 'md'
}) => {
  const containerClass = `loader-container loader-${variant} loader-size-${size}`;

  return (
    <div className={containerClass}>
      <div className="loader-spinner"></div>
      {(message || description) && (
        <div className="loader-text">
          {message && <h3 className="loader-message">{message}</h3>}
          {description && <p className="loader-description">{description}</p>}
        </div>
      )}
    </div>
  );
};
