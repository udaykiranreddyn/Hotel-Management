import React from 'react';
import { 
  BookOpen, 
  Search, 
  CheckCircle2, 
  CreditCard, 
  Clock, 
  ShieldCheck, 
  HelpCircle,
  ArrowRight,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HowToBookPage: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Select Dates & Room Category',
      desc: 'Browse our available rooms and choose from Standard Single (₹599), Standard Double (₹899), Comfort AC (₹1,199), or Family Room (₹1,499). Enter your check-in and check-out dates.',
      perk: 'Direct rates without agent commissions',
      icon: <Search size={24} color="var(--gold-primary)" />
    },
    {
      step: '02',
      title: 'Enter Guest Details & Preferences',
      desc: 'Fill in your name, contact phone number, and any special stay requests (such as high-floor, extra pillow, or quiet corner). Apply coupon codes like AURA10 for instant savings.',
      perk: '1-click quick autofill for saved profiles',
      icon: <CheckCircle2 size={24} color="var(--gold-primary)" />
    },
    {
      step: '03',
      title: 'Receive Instant Digital Voucher',
      desc: 'Click "Confirm Room Reservation". Your room is instantly locked in our database with a unique Reference Code (e.g., AURA-BK-2026-XXXX). Zero risk of overbooking.',
      perk: 'Digital voucher with 1-click code copy',
      icon: <CreditCard size={24} color="var(--gold-primary)" />
    }
  ];

  const faqs = [
    {
      q: 'What time is check-in and check-out?',
      a: 'Standard check-in begins at 12:00 PM (Noon), and check-out is by 11:00 AM. If you need early check-in or late departure, call our 24/7 front desk and we will gladly accommodate you based on room readiness.'
    },
    {
      q: 'Do I need to pay online in advance?',
      a: 'You can either pay securely online or pay directly at our front desk reception upon arrival via UPI (Google Pay, PhonePe, Paytm), cash, or credit/debit card.'
    },
    {
      q: 'What is your cancellation and refund policy?',
      a: 'We offer a 100% full refund policy with zero penalty fee if you cancel your reservation before your check-in time. You can cancel with 1 click directly in "My Reservations".'
    },
    {
      q: 'What documents do I need to present at check-in?',
      a: 'Please present your digital Booking Voucher Code along with any valid Government Photo ID (Aadhaar Card, Driving License, Passport, or Voter ID).'
    }
  ];

  return (
    <div style={{ padding: '2rem 1.5rem 5rem 1.5rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>
          <BookOpen size={14} /> BOOKING ASSISTANCE &amp; GUIDE
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', color: 'var(--text-main)', marginBottom: '0.6rem' }}>
          How to Book <span className="text-gold">Rooms</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '700px', lineHeight: 1.6 }}>
          Booking a comfortable room at Aura Hotel takes less than 60 seconds. Learn how our seamless 3-step digital reservation and instant voucher system works.
        </p>
      </div>

      {/* 3 Step Process Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        marginBottom: '3.5rem'
      }}>
        {steps.map((s) => (
          <div key={s.step} className="glass-card" style={{ position: 'relative', overflow: 'hidden', padding: '2rem' }}>
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1.25rem',
              fontSize: '3rem',
              fontFamily: 'var(--font-serif)',
              fontWeight: 800,
              color: 'rgba(212, 175, 55, 0.12)',
              lineHeight: 1
            }}>
              {s.step}
            </div>

            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(212, 175, 55, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-gold)',
              marginBottom: '1.25rem'
            }}>
              {s.icon}
            </div>

            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              {s.title}
            </h3>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.65', marginBottom: '1.25rem' }}>
              {s.desc}
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#34d399',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '0.85rem'
            }}>
              <CheckCircle2 size={14} />
              <span>{s.perk}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Key Guarantees Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3.5rem'
      }}>
        <div className="glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1.5rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={22} color="#16A34A" />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>100% Refund Cancellation</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Plans changed? Cancel any time before check-in without cancellation charges.
            </p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1.5rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(245,197,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={22} color="#D4A017" />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>24/7 Smooth Check-in</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Our reception is staffed 24 hours day and night to hand you your sanitized room key.
            </p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1.5rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(245,197,66,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CreditCard size={22} color="var(--gold-primary)" />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>Zero Double-Bookings</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Live SQLite database locking prevents collision conflicts or double room allocation.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <span className="gold-subheading">CLEAR ANSWERS</span>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Frequently Asked Booking Questions</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map((faq, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--gold-light)', fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>
                <HelpCircle size={18} color="var(--gold-primary)" />
                <span>{faq.q}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.65', margin: 0, paddingLeft: '1.75rem' }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(245,197,66,0.08) 0%, #F8FAFC 100%)',
        borderColor: 'var(--border-gold)',
        padding: '2.5rem',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
          Ready to Reserve Your Room?
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 1.75rem auto', fontSize: '0.95rem' }}>
          Choose your room right now with guaranteed transparent pricing starting from ₹599/night.
        </p>
        <Link to="/rooms" className="btn-primary" style={{ padding: '0.85rem 2.25rem', fontSize: '1rem', display: 'inline-flex' }}>
          <span>Explore Rooms &amp; Rates</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
};
