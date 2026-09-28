import React from 'react';
import { Link } from 'react-router-dom';

interface CardProps {
  title?: string;
  subtitle?: string;
  /** Optional "view all" style link shown in the card header. */
  link?: { to: string; label: string };
  className?: string;
  children: React.ReactNode;
}

/** Shared card: 16px radius, 20px padding, 1px border. Title, supporting text, then content. */
export const Card: React.FC<CardProps> = ({ title, subtitle, link, className = '', children }) => (
  <section className={`card ${className}`}>
    {(title || link) && (
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          {title && <h2 className="card-title">{title}</h2>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
        {link && <Link to={link.to} className="card-link">{link.label}</Link>}
      </header>
    )}
    {children}
  </section>
);
