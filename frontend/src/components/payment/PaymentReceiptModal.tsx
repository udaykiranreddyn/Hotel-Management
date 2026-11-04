import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle2, Building2, ShieldCheck } from 'lucide-react';
import type { PaymentReceipt } from '../../services/paymentService';

interface PaymentReceiptModalProps {
  receipt: PaymentReceipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  receipt,
  isOpen,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const currencySymbol = receipt.currency === 'USD' ? '$' : '₹';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        background: 'rgba(7, 11, 20, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '94vh',
          overflowY: 'auto',
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-gold)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), var(--shadow-gold)',
          padding: '2.5rem',
          position: 'relative',
        }}
      >
        {/* Top Control Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handlePrint}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
              }}
            >
              <Printer size={15} />
              Print / Save PDF
            </button>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
              cursor: 'pointer',
            }}
            aria-label="Close Receipt"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Receipt Canvas */}
        <div
          ref={receiptRef}
          id="printable-receipt"
          style={{
            background: '#ffffff',
            color: '#0f172a',
            padding: '2.5rem',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontWeight: 800, fontSize: '1.35rem' }}>
                <Building2 size={24} />
                <span>{receipt.hotel_name}</span>
              </div>
              <p style={{ margin: '0.4rem 0 0.2rem 0', fontSize: '0.85rem', color: '#475569', maxWidth: '340px' }}>
                {receipt.hotel_address}
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                GSTIN: <strong>{receipt.hotel_gstin}</strong> • Phone: {receipt.hotel_contact_phone}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
                <CheckCircle2 size={13} />
                PAYMENT VERIFIED
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Receipt #:</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{receipt.receipt_number}</div>
            </div>
          </div>

          {/* Guest & Reservation Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>
                Billed To (Guest)
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{receipt.guest_name}</div>
              <div style={{ color: '#475569' }}>{receipt.guest_email}</div>
              {receipt.guest_phone && <div style={{ color: '#475569' }}>{receipt.guest_phone}</div>}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>
                Booking Reference
              </div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem', letterSpacing: '0.05em' }}>
                {receipt.booking_reference}
              </div>
              <div style={{ color: '#475569', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                Razorpay ID: <code>{receipt.razorpay_payment_id || 'N/A'}</code>
              </div>
            </div>
          </div>

          {/* Reservation Breakdown Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem' }}>Description</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Dates / Duration</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Rate</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem' }}>
                  <strong>{receipt.room_type}</strong> (Room {receipt.room_number})
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{receipt.num_guests} Guests • Climate Controlled Suite</div>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#334155' }}>
                  {receipt.check_in_date} to {receipt.check_out_date}
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{receipt.total_nights} Nights</div>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#334155' }}>
                  {currencySymbol}{receipt.price_per_night.toLocaleString('en-IN')}/night
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                  {currencySymbol}{receipt.room_charges.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Totals Section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Room Charges:</span>
                <span>{currencySymbol}{receipt.room_charges.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>GST & Hospitality Taxes (12%):</span>
                <span>+{currencySymbol}{receipt.taxes.toLocaleString('en-IN')}</span>
              </div>
              {receipt.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                  <span>Promotional Discount:</span>
                  <span>-{currencySymbol}{receipt.discount_amount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ borderTop: '2px solid #0f172a', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>
                <span>Total Paid:</span>
                <span>{currencySymbol}{receipt.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
            <div>
              Payment Method: <strong>{receipt.payment_method}</strong> • Status: <strong style={{ color: '#059669' }}>{receipt.payment_status}</strong>
              <br />
              Processed via Razorpay Payment Gateway on {new Date(receipt.payment_date).toLocaleString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#059669', fontWeight: 600 }}>
              <ShieldCheck size={16} />
              Verified Digital Receipt
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
