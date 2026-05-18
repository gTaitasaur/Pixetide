import React from 'react';
import { Link } from 'react-router-dom';
import './Card.css';

interface CardProps {
  to?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({ to, icon, title, description, disabled = false }) => {
  const content = (
    <>
      <div className="card-fold"></div>
      <div className="card-icon">
        {icon}
      </div>
      <h3 className="card-title">{title}</h3>
      <p className="card-description">{description}</p>
    </>
  );

  if (disabled || !to) {
    return (
      <div className={`neobrutal-card-wrapper disabled`}>
        <div className="card-shadow"></div>
        <div className="neobrutal-card">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="neobrutal-card-wrapper">
      <div className="card-shadow"></div>
      <Link to={to} className="neobrutal-card">
        {content}
      </Link>
    </div>
  );
};
