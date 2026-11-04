import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Download, ArrowRight, Home, Calendar, ShieldCheck, FileText } from 'lucide-react';
import { PaymentReceiptModal } from '../components/payment/PaymentReceiptModal';
import { PaymentService } from '../services/paymentService';
import type { PaymentReceipt, VerifyPaymentResponse } from '../services/paymentService';

export const PaymentSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  // Read data passed from router state or fall back to mock demonstration data
  const paymentData: Partial<VerifyPaymentResponse> = location.state?.paymentData || {
    booking_reference: 'AURA-BK-SUCCESS',
    razorpay_payment_id: 'pay_rzp_demo_live',
    amount: 2462.88,
    currency: 'INR',
    payment_status: 'SUCCESS',
    booking_status: 'CONFIRMED',
    payment_method: 'UPI / CARD',
    paid_at: new Date().toISOString(),
    payment_id: 1,
  };

  const handleFetchReceipt = async () => {
    setIsLoadingReceipt(true);
    try {
      if (paymentData.payment_id) {
        const data = await PaymentService.getReceipt(paymentData.payment_id);
        setReceipt(data);
        setIsReceiptOpen(true);
      } else {
        // Fallback simulated receipt
        setReceipt({
          hotel_name: 'Aura Grand Luxury Hotel & Suites',
          hotel_address: '742 Evergreen Promenade, Bandra Kurla Complex, Mumbai, Maharashtra 400051',
          hotel_gstin: '27AAACH7429K1ZX',
          hotel_contact_phone: '+91 22 4988 7000',
          hotel_contact_email: 'reservations@aurahotels.com',
          receipt_number: `REC-${paymentData.booking_reference}`,
          booking_reference: paymentData.booking_reference || 'AURA-BK-SUCCESS',
          payment_id: paymentData.payment_id || 1,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_order_id: paymentData.razorpay_order_id,
          guest_name: 'Valued Guest',
          guest_email: 'guest@aurahotels.com',
          room_number: '102',
          room_type: 'Deluxe Suite',
          check_in_date: '2026-09-25',
          check_out_date: '2026-09-27',
          total_nights: 2,
          num_guests: 2,
          price_per_night: 1100,
          room_charges: 2200,
          taxes: 264,
          discount_amount: 0,
          total_amount: paymentData.amount || 2464,
          currency: 'INR',
          payment_method: paymentData.payment_method || 'CARD',
          payment_status: 'SUCCESS',
          payment_date: paymentData.paid_at || new Date().toISOString(),
        });
        setIsReceiptOpen(true);
      }
    } catch (err) {
      console.error('Failed to load receipt:', err);
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '3rem auto', padding: '0 1rem' }}>
      <div
        className="glass-card animate-fade-in"
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-gold)',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-gold), var(--shadow-lg)',
          padding: '2.5rem',
          textAlign: 'center',
        }}
      >
        {/* Animated Green Success Badge */}
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid #10b981',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
          }}
        >
          <CheckCircle2 size={46} />
        </div>

        <div className="badge badge-success" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
          VERIFIED BY RAZORPAY
        </div>

        <h1 style={{ fontSize: '1.85rem', color: 'var(--gold-light)', margin: '0 0 0.5rem 0', fontFamily: 'var(--font-heading)' }}>
          Payment Successful!
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 2rem 0' }}>
          Your payment has been authorized and your luxury room reservation is officially confirmed.
        </p>

        {/* Transaction Summary Card */}
        <div
          style={{
            background: 'rgba(245,197,66,0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '1.25rem',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '2rem',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Booking Reference</span>
            <strong style={{ color: 'var(--gold-main)', letterSpacing: '0.05em' }}>
              {paymentData.booking_reference}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Razorpay Transaction ID</span>
            <code style={{ color: 'var(--text-main)', background: 'rgba(255, 255, 255, 0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              {paymentData.razorpay_payment_id || 'N/A'}
            </code>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Amount Paid</span>
            <strong style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>
              ₹{Number(paymentData.amount || 0).toLocaleString('en-IN')}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Payment Method</span>
            <span style={{ color: 'var(--text-main)' }}>{paymentData.payment_method || 'CARD'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Payment Date</span>
            <span style={{ color: 'var(--text-main)' }}>
              {paymentData.paid_at ? new Date(paymentData.paid_at).toLocaleString() : new Date().toLocaleString()}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Booking Status</span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>CONFIRMED</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={handleFetchReceipt}
            disabled={isLoadingReceipt}
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
            <Download size={18} />
            <span>{isLoadingReceipt ? 'Generating Receipt...' : 'Download Official Receipt (PDF)'}</span>
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-my-bookings'));
              }}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.75rem',
                fontSize: '0.85rem',
              }}
            >
              <FileText size={16} />
              <span>View My Bookings</span>
            </button>

            <Link
              to="/"
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.75rem',
                fontSize: '0.85rem',
                textDecoration: 'none',
              }}
            >
              <Home size={16} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tax Receipt Modal */}
      <PaymentReceiptModal
        receipt={receipt}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
};
