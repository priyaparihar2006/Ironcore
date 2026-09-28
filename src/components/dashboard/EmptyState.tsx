import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: { label: string; onClick?: () => void; href?: string };
}

/** A page or card never looks "broken" when there's no data — an icon, a heading, one line of context, and one action. */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, body, action }) => (
  <div className="empty-state">
    <div className="empty-state-icon">
      <Icon size={26} />
    </div>
    <p className="empty-state-title">{title}</p>
    {body && <p className="empty-state-body">{body}</p>}
    {action && (
      action.href ? (
        <a href={action.href} className="btn btn-primary">{action.label}</a>
      ) : (
        <button type="button" onClick={action.onClick} className="btn btn-primary">{action.label}</button>
      )
    )}
  </div>
);
