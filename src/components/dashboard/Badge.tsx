import React from 'react';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  tone: BadgeTone;
  children: React.ReactNode;
  /** Renders a small leading dot (the "● Active" style from the spec). Off by default. */
  dot?: boolean;
}

/** A small status pill — never sized or weighted like a button. */
export const Badge: React.FC<BadgeProps> = ({ tone, children, dot = false }) => (
  <span className={`badge badge-${tone}`}>
    {dot && <span className="badge-dot" />}
    {children}
  </span>
);
