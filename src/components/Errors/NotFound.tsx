import React from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../i18n/useLocale';
import './Errors.css';

export const NotFound: React.FC = () => {
  const { t, locale } = useLocale();
  const homePath = locale === 'es' ? '/es/' : '/';

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
        <h1 className="error-title">{t('notFound.title')}</h1>
        <p className="error-message">{t('notFound.message')}</p>
        <Link to={homePath} className="error-btn-primary">
          {t('notFound.backHome')}
        </Link>
      </div>
    </div>
  );
};
