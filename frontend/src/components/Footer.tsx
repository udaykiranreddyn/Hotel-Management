import React from 'react';
import { Building2, Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border-subtle)',
      padding: '4rem 0 2rem 0',
      marginTop: 'auto'
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '2.5rem',
        marginBottom: '3rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Building2 size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--primary)', fontWeight: 800 }}>AURA</div>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>COMFORT HOTEL &amp; ROOMS</div>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.7', marginBottom: '1.25rem' }}>
            Providing clean, comfortable, and affordable hotel rooms with honest pricing, fresh sanitized linens, and 24/7 friendly front desk service.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>
            <ShieldCheck size={16} /> Verified Clean &amp; Budget-Friendly Stays
          </div>
        </div>

        <div>
          <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '1.25rem', fontFamily: 'var(--font-display)' }}>EXPLORE</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <li><a href="#hero" style={{ color: 'var(--text-muted)' }}>Home &amp; Overview</a></li>
            <li><a href="#search-section" style={{ color: 'var(--text-muted)' }}>Check Room Availability</a></li>
            <li><a href="#rooms" style={{ color: 'var(--text-muted)' }}>Rooms &amp; Affordable Rates</a></li>
            <li><a href="#booking-guide" style={{ color: 'var(--text-muted)' }}>How to Book</a></li>
            <li><a href="#amenities" style={{ color: 'var(--text-muted)' }}>Hotel Essentials</a></li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '1.25rem', fontFamily: 'var(--font-display)' }}>STAY INFORMATION</h4>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.8' }}>
            <div><strong>Check-in:</strong> 2:00 PM (14:00)</div>
            <div><strong>Checkout:</strong> 11:00 AM (11:00)</div>
            <div><strong>Reception:</strong> 24 Hours / 7 Days</div>
            <div><strong>Cancellation:</strong> Flexible up to 24 hrs</div>
            <div><strong>Valet Parking:</strong> Complimentary</div>
          </div>
        </div>

        <div>
          <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '1.25rem', fontFamily: 'var(--font-display)' }}>CONTACT &amp; LOCATION</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <MapPin size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>Marine Drive Oceanfront, Boulevard Luxury Bay, Coastal District</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Phone size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span>+91 8639961089 / +91 8008733423</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Mail size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem' }}>nossamudaykiran@gmail.com / vallurushakeer970@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', fontSize: '0.8rem',
        color: 'var(--text-muted)', gap: '1rem'
      }}>
        <div>© 2026 AURA Hotel. All rights reserved.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>B.Tech Final-Year Capstone Project</span>
          <span>•</span>
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Smart Hotel Management System</span>
        </div>
      </div>
    </footer>
  );
};
