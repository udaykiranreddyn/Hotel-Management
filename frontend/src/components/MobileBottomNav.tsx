import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Building2, Search, BedDouble, BookOpen, PhoneCall, CalendarCheck } from 'lucide-react';
import { useBooking } from '../context/BookingContext';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { userBookings, openMyBookings } = useBooking();

  const items = [
    { to: '/', label: 'Home', icon: <Building2 size={18} /> },
    { to: '/search', label: 'Search', icon: <Search size={18} /> },
    { to: '/rooms', label: 'Rooms', icon: <BedDouble size={18} /> },
    { to: '/how-to-book', label: 'Guide', icon: <BookOpen size={18} /> },
    { to: '/contact', label: 'Contact', icon: <PhoneCall size={18} /> },
  ];

  return (
    <div
      className="mobile-bottom-bar"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 995,
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-subtle)',
        boxShadow: '0 -4px 20px rgba(6, 26, 64, 0.08)',
        padding: '0.45rem 0.5rem calc(0.45rem + env(safe-area-inset-bottom, 0px)) 0.5rem',
        alignItems: 'center', justifyContent: 'space-around',
      }}
    >
      {items.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <NavLink key={item.to} to={item.to} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '0.2rem',
            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            textDecoration: 'none', fontSize: '0.68rem',
            fontWeight: isActive ? 700 : 500, padding: '0.3rem 0.6rem',
            borderRadius: '8px',
            background: isActive ? 'rgba(168,135,85,0.1)' : 'transparent',
            transition: 'all 0.18s ease',
          }}>
            <span style={{ color: isActive ? 'var(--primary)' : 'inherit' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        );
      })}

      <button onClick={openMyBookings} style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '0.2rem', background: 'none', border: 'none',
        color: 'var(--primary)', fontSize: '0.68rem', padding: '0.3rem 0.5rem',
        cursor: 'pointer', position: 'relative',
      }}>
        <CalendarCheck size={18} color="var(--primary)" />
        <span style={{ color: 'var(--primary)' }}>Bookings</span>
        {userBookings.length > 0 && (
          <span style={{
            position: 'absolute', top: '0', right: '0.3rem',
            background: 'var(--primary)', color: '#FFFFFF',
            fontSize: '0.6rem', fontWeight: 800, borderRadius: '50%',
            width: '14px', height: '14px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {userBookings.length}
          </span>
        )}
      </button>

      <style>{`
        .mobile-bottom-bar { display: none; }
        @media (max-width: 768px) { .mobile-bottom-bar { display: flex !important; } }
      `}</style>
    </div>
  );
};
