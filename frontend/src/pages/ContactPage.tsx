import React, { useState } from 'react';
import { 
  PhoneCall, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  ShieldCheck,
  Building2,
  Navigation
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setName('');
    setPhone('');
    setEmail('');
    setMessage('');
    setTimeout(() => setIsSubmitted(false), 6000);
  };

  return (
    <div style={{ padding: '2rem 1.5rem 5rem 1.5rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>
          <PhoneCall size={14} /> 24/7 GUEST SUPPORT
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', color: 'var(--text-main)', marginBottom: '0.6rem' }}>
          Contact <span className="text-gold">Our Front Desk</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '700px', lineHeight: 1.6 }}>
          Have questions about room availability, check-in timings, group discounts, or need directions? Our reception desk is open 24 hours a day, 7 days a week.
        </p>
      </div>

      {/* Main Contact Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '3rem',
        alignItems: 'flex-start',
        marginBottom: '3.5rem'
      }}>
        {/* Contact Info Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--text-main)' }}>Direct Reach Channels</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Phone Numbers */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-gold)' }}>
                  <PhoneCall size={20} color="var(--gold-primary)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone Numbers (24/7 Helpline)</div>
                  <a href="tel:+918639961089" style={{ display: 'block', fontWeight: 700, color: '#D4A017', textDecoration: 'none', fontSize: '1.05rem', marginTop: '0.2rem' }}>
                    +91 8639961089
                  </a>
                  <a href="tel:+918008733423" style={{ display: 'block', fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.92rem', marginTop: '0.15rem' }}>
                    +91 8008733423
                  </a>
                </div>
              </div>

              {/* Email Addresses */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(245,197,66,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(245,197,66,0.3)' }}>
                  <Mail size={20} color="#D4A017" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Inquiries</div>
                  <a href="mailto:nossamudaykiran@gmail.com" style={{ display: 'block', fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.88rem', marginTop: '0.2rem' }}>
                    nossamudaykiran@gmail.com
                  </a>
                  <a href="mailto:vallurushakeer970@gmail.com" style={{ display: 'block', fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.88rem', marginTop: '0.15rem' }}>
                    vallurushakeer970@gmail.com
                  </a>
                </div>
              </div>

              {/* Address */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <MapPin size={20} color="#34d399" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hotel Physical Address</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem', marginTop: '0.2rem' }}>
                    Station Road, Near Central Transit Hub
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>City Center Landmark</div>
                </div>
              </div>

              {/* Timings */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-subtle)' }}>
                  <Clock size={20} color="var(--gold-primary)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hours of Operation</div>
                  <div style={{ fontWeight: 600, color: '#34d399', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                    Front Desk Open 24/7 (365 Days)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Standard Check-in: 12:00 PM • Check-out: 11:00 AM
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nearby Transport Landmarks */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold-primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              <Navigation size={16} />
              <span>NEARBY TRANSIT POINTS</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.825rem' }}>
              <div style={{ background: 'rgba(245,197,66,0.05)', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>Railway Station</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>5 mins (800m)</div>
              </div>
              <div style={{ background: 'rgba(245,197,66,0.05)', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>Main Bus Stand</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>7 mins (1.2 km)</div>
              </div>
              <div style={{ background: 'rgba(245,197,66,0.05)', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>Food Street &amp; Cafes</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>2 mins walk</div>
              </div>
              <div style={{ background: 'rgba(245,197,66,0.05)', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>Pharmacy / Hospital</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>3 mins walk</div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Inquiry Form */}
        <div className="glass-card" style={{
          padding: '2.25rem',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-md), var(--shadow-gold)'
        }}>
          <span className="gold-subheading">SEND A MESSAGE</span>
          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            Quick Front Desk Inquiry
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Need to request early check-in, arrange airport transit, or ask about monthly tariffs? Send us a quick note.
          </p>

          {isSubmitted && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '1rem',
              color: '#34d399',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <CheckCircle2 size={18} color="#10b981" />
              <span>Thank you! Your message has been received by our front desk. We will call you shortly.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Your Name *
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Mobile / Phone Number *
                </label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 12345"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Your Message / Room Inquiry *
              </label>
              <textarea 
                rows={4} 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about dates, early check-in, group room rates, or directions..."
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                  resize: 'vertical',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit'
                }}
              ></textarea>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.85rem', justifyContent: 'center', fontSize: '0.95rem' }}>
              <Send size={16} />
              <span>Send Message to Front Desk</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
