import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Primary action(s) shown on the right; use `btn btn-primary` / `btn btn-secondary` for buttons. */
  actions?: React.ReactNode;
}

/** Consistent page header: title + subtitle on the left, primary action on the right. */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <div className="page-header">
    <div className="min-w-0">
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="page-header-actions">{actions}</div>}
  </div>
);
