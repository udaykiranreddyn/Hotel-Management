import React from 'react';
import { 
  Building2, 
  Award, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Compass, 
  CheckCircle2, 
  ArrowRight,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  const promises = [
    {
      icon: <ShieldCheck size={26} color="var(--gold-primary)" />,
      title: 'Best Price Guarantee',
      desc: 'Transparent direct prices starting from ₹599/night. What you see on our screen is exactly what you pay at checkout with zero middleman commissions.'
    },
    {
      icon: <Sparkles size={26} color="var(--gold-primary)" />,
      title: '100% Sanitized Rooms',
      desc: 'Freshly laundered linens, disinfected mattresses, and sanitized private bathrooms before every single guest arrival.'
    },
    {
      icon: <Clock size={26} color="var(--gold-primary)" />,
      title: 'Zero Double-Bookings',
      desc: 'Our real-time backend inventory synchronization ensures your room reservation is completely secure the moment you book.'
    },
    {
      icon: <Compass size={26} color="var(--gold-primary)" />,
      title: 'Centrally Located',
      desc: 'Situated right on Station Road close to major transit terminals, food streets, bus stands, and commercial centers for easy commuting.'
    }
  ];

  return (
    <div style={{ padding: '2rem 1.5rem 5rem 1.5rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>
          <Building2 size={14} /> OUR STORY &amp; MISSION
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', color: 'var(--text-main)', marginBottom: '0.6rem' }}>
          About <span className="text-gold">Aura Hotel</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '700px', lineHeight: 1.6 }}>
          Quality stays at honest everyday prices. Discover how we are redefining budget hotel accommodations with modern cleanliness, digital efficiency, and warm hospitality.
        </p>
      </div>

      {/* Main Story Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '3rem',
        alignItems: 'center',
        marginBottom: '4rem'
      }}>
        <div>
          <span className="gold-subheading">OUR PHILOSOPHY</span>
          <h2 style={{ fontSize: '1.65rem', marginBottom: '1.25rem', color: 'var(--text-main)', lineHeight: 1.3 }}>
            Comfort Shouldn't Cost <span className="text-gold">A Fortune</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1.25rem' }}>
            At Aura Hotel, our philosophy is refreshingly simple: deliver clean, comfortable, and safe rooms with friendly hospitality at prices that make complete sense. Whether you're traveling for work, student exams, family vacations, or short city stopovers, you deserve a peaceful night's rest.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.7', marginBottom: '2rem' }}>
            We eliminate unnecessary luxury markups so you pay strictly for what matters: comfortable mattresses, crisp washed bedsheets, individual AC, 24/7 hot showers, reliable high-speed Wi-Fi, and courteous front desk staff ready to assist you day and night.
          </p>

          {/* Key Metric Numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
            <div className="glass-card" style={{ padding: '1.25rem 0.5rem' }}>
              <div style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--gold-light)', fontWeight: 800 }}>40+</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Clean Rooms</div>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem 0.5rem' }}>
              <div style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--gold-light)', fontWeight: 800 }}>99.2%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Satisfaction</div>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem 0.5rem' }}>
              <div style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--gold-light)', fontWeight: 800 }}>24/7</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Front Desk</div>
            </div>
          </div>
        </div>

        {/* Feature Image Card */}
        <div style={{ position: 'relative' }}>
          <div style={{
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg), var(--shadow-gold)',
            border: '1px solid var(--border-gold)'
          }}>
            <img 
              src="/images/deluxe_suite.jpg" 
              alt="Aura Hotel Clean Deluxe Bedroom" 
              style={{ width: '100%', height: '390px', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <div className="glass-card" style={{
            position: 'absolute',
            bottom: '-1.5rem',
            left: '1.5rem',
            maxWidth: '300px',
            padding: '1.25rem',
            border: '1px solid var(--border-gold)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold-primary)', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.35rem' }}>
              <Award size={18} /> Best Value Comfort Hotel 2026
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Honored for continuous hygiene standards, price transparency, and seamless digital booking.
            </p>
          </div>
        </div>
      </div>

      {/* The 4 Core Hotel Commitments */}
      <div style={{ marginBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="gold-subheading">STANDARDS YOU CAN COUNT ON</span>
          <h2 style={{ fontSize: '1.65rem', color: 'var(--text-main)' }}>Why Travelers Choose Aura Hotel</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.75rem',
        }}>
          {promises.map((p, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                border: '1px solid var(--border-gold)'
              }}>
                {p.icon}
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.6rem', color: 'var(--text-main)' }}>{p.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.65', margin: 0 }}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Location Advantage Banner */}
      <div className="glass-card" style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-gold)',
        padding: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '2rem',
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--gold-primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
            <Compass size={18} />
            <span>EXCELLENT TRANSIT CONNECTIVITY</span>
          </div>
          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Located at Station Road, City Center</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
            Convenient access to railway station, inter-city bus terminal, popular local restaurants, pharmacies, and shopping avenues. Enjoy quick rides anywhere in the city.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/contact" className="btn-secondary" style={{ padding: '0.8rem 1.6rem' }}>
            <span>Get Directions &amp; Contact</span>
          </Link>
          <Link to="/rooms" className="btn-primary" style={{ padding: '0.8rem 1.8rem' }}>
            <span>Reserve A Room</span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </div>
  );
};

