import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, RotateCcw } from 'lucide-react';

interface PaymentStatusProps {
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const PaymentStatusBadge: React.FC<PaymentStatusProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const norm = (status || 'PENDING').toUpperCase();

  let bg = 'rgba(234, 179, 8, 0.15)';
  let border = 'rgba(234, 179, 8, 0.4)';
  let color = '#eab308';
  let label = 'Pending';
  let Icon = Clock;

  if (norm === 'SUCCESS' || norm === 'PAID') {
    bg = 'rgba(16, 185, 129, 0.15)';
    border = 'rgba(16, 185, 129, 0.4)';
    color = '#10b981';
    label = 'Success';
    Icon = CheckCircle2;
  } else if (norm === 'FAILED') {
    bg = 'rgba(239, 68, 68, 0.15)';
    border = 'rgba(239, 68, 68, 0.4)';
    color = '#ef4444';
    label = 'Failed';
    Icon = AlertTriangle;
  } else if (norm === 'REFUNDED' || norm === 'PARTIALLY_REFUNDED') {
    bg = 'rgba(148, 163, 184, 0.15)';
    border = 'rgba(148, 163, 184, 0.4)';
    color = '#94a3b8';
    label = norm === 'PARTIALLY_REFUNDED' ? 'Partial Refund' : 'Refunded';
    Icon = RotateCcw;
  }

  const padding = size === 'sm' ? '0.2rem 0.5rem' : size === 'lg' ? '0.45rem 1rem' : '0.3rem 0.75rem';
  const fontSize = size === 'sm' ? '0.75rem' : size === 'lg' ? '0.95rem' : '0.825rem';
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding,
        fontSize,
        fontWeight: 600,
        borderRadius: '9999px',
        background: bg,
        border: `1px solid ${border}`,
        color: color,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      }}
    >
      {showIcon && <Icon size={iconSize} />}
      <span>{label}</span>
    </span>
  );
};
