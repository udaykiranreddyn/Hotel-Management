import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, ArrowLeft, Headphones, ShieldAlert } from 'lucide-react';

export const PaymentFailurePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const failureData = location.state || {
    reason: 'Payment was cancelled or rejected by issuing bank.',
    bookingReference: 'AURA-BK-PENDING',
    errorCode: 'PAYMENT_CANCELLED',
    bookingId: null,
  };

  const handleRetryPayment = () => {
    // Navigate back to payment page or open booking modal
    if (failureData.bookingReference && failureData.bookingReference !== 'AURA-BK-PENDING') {
      navigate(`/payment/${failureData.bookingReference}`, {
        state: { bookingId: failureData.bookingId, retry: true },
      });
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{ maxWidth: '580px', margin: '3.5rem auto', padding: '0 1rem' }}>
      <div
        className="glass-card animate-fade-in"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-lg)',
          padding: '2.5rem',
          textAlign: 'center',
        }}
      >
        {/* Red Warning Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid #ef4444',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.25)',
          }}
        >
          <AlertTriangle size={42} />
        </div>

        <div
          style={{
            display: 'inline-block',
            padding: '0.3rem 0.8rem',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            borderRadius: '9999px',
            color: '#ef4444',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}
        >
          PAYMENT NOT COMPLETED
        </div>

        <h1 style={{ fontSize: '1.75rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0', fontFamily: 'var(--font-heading)' }}>
          Payment Unsuccessful
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 1.75rem 0' }}>
          We were unable to complete your transaction with Razorpay. Your card has not been charged, and no reservation was confirmed.
        </p>

        {/* Reason Box */}
        <div
          style={{
            background: 'rgba(220,38,38,0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '1.25rem',
            textAlign: 'left',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Booking Reference</span>
            <strong style={{ color: 'var(--gold-main)' }}>{failureData.bookingReference}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Failure Reason</span>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>{failureData.reason}</span>
          </div>
          {failureData.errorCode && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Error Code</span>
              <code style={{ color: 'var(--text-secondary)' }}>{failureData.errorCode}</code>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={handleRetryPayment}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.85rem',
              fontSize: '0.95rem',
              width: '100%',
            }}
          >
            <RefreshCw size={17} />
            <span>Retry Payment (Razorpay)</span>
          </button>

          <Link
            to="/rooms"
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              fontSize: '0.875rem',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Room Selection</span>
          </Link>
        </div>

        {/* 24/7 Concierge Support Callout */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <Headphones size={15} style={{ color: 'var(--gold-main)' }} />
          <span>Need assistance? Our concierge is available 24/7 at +91 22 4988 7000</span>
        </div>
      </div>
    </div>
  );
};
