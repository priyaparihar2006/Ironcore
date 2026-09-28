import React from 'react';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  /** Small unit shown after the value, e.g. "kg". */
  unit?: string;
  /** One line of supporting text (trend or context). */
  support?: string;
  tone?: 'neutral' | 'positive' | 'negative';
}

/** KPI card: label, one large number, and one line of supporting information. */
export const KpiCard: React.FC<KpiCardProps> = ({ label, value, unit, support, tone = 'neutral' }) => (
  <div className="card kpi-card">
    <span className="kpi-label">{label}</span>
    <div className="kpi-value">
      {value}
      {unit && <span className="kpi-unit">{unit}</span>}
    </div>
    {support && <span className="kpi-support" data-tone={tone}>{support}</span>}
  </div>
);
