import React from 'react';
import { Calendar, Users, ShieldCheck, Lock, Sparkles, Building2, Tag } from 'lucide-react';

export interface PaymentSummaryData {
  hotelName?: string;
  roomName: string;
  roomType: string;
  roomImage?: string;
  checkInDate: string;
  checkOutDate: string;
  numNights: number;
  numGuests: number;
  pricePerNight: number;
  roomCharges: number;
  taxes: number;
  discountAmount?: number;
  totalAmount: number;
  currency?: string;
  couponCode?: string;
}

interface PaymentSummaryProps {
  data: PaymentSummaryData;
  isLoading?: boolean;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({ data, isLoading = false }) => {
  const currencySymbol = data.currency === 'USD' ? '$' : '₹';

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.75rem',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-gold)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-gold), 0 10px 30px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Hotel Branding Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid var(--border-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-main)',
          }}
        >
          <Building2 size={20} />
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-light)' }}>
            Official Booking Folio
          </span>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            {data.hotelName || 'Aura Grand Luxury Hotel & Suites'}
          </h3>
        </div>
      </div>

      {/* Room Details Card */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          marginBottom: '1.5rem',
        }}
      >
        {data.roomImage && (
          <img
            src={data.roomImage}
            alt={data.roomName}
            style={{
              width: '90px',
              height: '80px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--gold-main)', fontWeight: 600 }}>
            {data.roomType}
          </div>
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            {data.roomName}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={13} style={{ color: 'var(--gold-main)' }} />
              {data.checkInDate} → {data.checkOutDate}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Users size={13} style={{ color: 'var(--gold-main)' }} />
              {data.numGuests} {data.numGuests === 1 ? 'Guest' : 'Guests'} ({data.numNights} {data.numNights === 1 ? 'Night' : 'Nights'})
            </span>
          </div>
        </div>
      </div>

      {/* Itemized Financial Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <span>
            {currencySymbol}{data.pricePerNight.toLocaleString('en-IN')} × {data.numNights} nights
          </span>
          <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
            {currencySymbol}{data.roomCharges.toLocaleString('en-IN')}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            Hospitality GST & Luxury Tax (12%)
          </span>
          <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
            +{currencySymbol}{data.taxes.toLocaleString('en-IN')}
          </span>
        </div>

        {data.discountAmount && data.discountAmount > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontSize: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Tag size={13} />
              Promo Discount {data.couponCode ? `(${data.couponCode})` : ''}
            </span>
            <span style={{ fontWeight: 600 }}>
              -{currencySymbol}{data.discountAmount.toLocaleString('en-IN')}
            </span>
          </div>
        ) : null}

        <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.25rem 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Total Payable Amount
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Includes all taxes and services • No surprise fees
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gold-light)', fontFamily: 'var(--font-heading)' }}>
            {currencySymbol}{data.totalAmount.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Security Assurance Badges */}
      <div
        style={{
          padding: '0.85rem',
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.825rem', fontWeight: 600 }}>
          <ShieldCheck size={16} />
          <span>Guaranteed Secure Razorpay Checkout</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Lock size={12} /> 256-Bit SSL Encrypted
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Sparkles size={12} /> UPI, Cards, NetBanking, Wallets
          </span>
        </div>
      </div>
    </div>
  );
};
