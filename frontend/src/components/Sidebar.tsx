import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Search, 
  BedDouble, 
  BookOpen, 
  Sparkles, 
  Info, 
  PhoneCall, 
  CalendarCheck,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  X
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import type { UserProfile } from '../services/api';

interface SidebarProps {
  currentUser: UserProfile | null;
  onOpenStaffPortal: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  onOpenStaffPortal,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { userBookings, openMyBookings } = useBooking();
  const location = useLocation();

  const isStaff = currentUser && currentUser.role !== 'GUEST';

  const navItems = [
    {
      to: '/',
      label: 'Home',
      icon: <Building2 size={19} />,
      badge: 'Overview'
    },
    {
      to: '/search',
      label: 'Search Rooms',
      icon: <Search size={19} />,
      badge: 'Live Dates'
    },
    {
      to: '/rooms',
      label: 'Rooms & Rates',
      icon: <BedDouble size={19} />,
      badge: 'From ₹599'
    },
    {
      to: '/how-to-book',
      label: 'How to Book Rooms',
      icon: <BookOpen size={19} />,
      badge: '3 Steps'
    },
    {
      to: '/amenities',
      label: 'Amenities',
      icon: <Sparkles size={19} />,
      badge: 'Wi-Fi & AC'
    },
    {
      to: '/my-payments',
      label: 'My Payments',
      icon: <CreditCard size={19} />,
      badge: 'Receipts'
    },
    {
      to: '/about',
      label: 'About',
      icon: <Info size={19} />,
      badge: 'Values'
    },
    {
      to: '/contact',
      label: 'Contact',
      icon: <PhoneCall size={19} />,
      badge: '24/7 Desk'
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 10, 24, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 998,
          }}
        />
      )}

      <aside className={`app-sidebar ${isOpenMobile ? 'mobile-open' : ''}`} style={{
        width: '270px',
        flexShrink: 0,
        background: '#04132F',
        borderRight: '1px solid #102B56',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 999,
        boxShadow: '4px 0 25px rgba(6, 26, 64, 0.25)',
        transition: 'transform 0.3s ease',
      }}>
        {/* Sidebar Header / Brand */}
        <div style={{
          padding: '1.25rem 1.25rem 1rem 1.25rem',
          borderBottom: '1px solid #102B56',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <NavLink 
            to="/" 
            onClick={onCloseMobile}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#F5C542',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(245, 197, 66, 0.35)',
              flexShrink: 0
            }}>
              <Building2 size={22} color="#FFFFFF" strokeWidth={2.4} />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: '#FFE08A',
                lineHeight: 1.1
              }}>
                AURA
              </div>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.62rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#94A3B8'
              }}>
                Hotel &amp; Rooms
              </div>
            </div>
          </NavLink>

          {/* Close button on mobile */}
          {isOpenMobile && (
            <button
              onClick={onCloseMobile}
              style={{
                background: '#102B56',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                padding: '0.4rem',
                cursor: 'pointer',
                display: 'flex',
              }}
              aria-label="Close Sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Category Label */}
        <div style={{
          padding: '1rem 1.25rem 0.4rem 1.25rem',
          fontSize: '0.68rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: '#94A3B8',
        }}>
          Hotel Navigation
        </div>

        {/* Navigation Links */}
        <nav style={{
          flex: 1,
          padding: '0.5rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem',
          overflowY: 'auto',
        }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0.95rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: isActive ? '#F5C542' : '#94A3B8',
                  background: isActive ? 'rgba(245, 197, 66, 0.12)' : 'transparent',
                  borderLeft: isActive ? '3px solid #F5C542' : '3px solid transparent',
                  border: isActive ? '1px solid rgba(245, 197, 66, 0.3)' : '1px solid transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.88rem',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 2px 8px rgba(245, 197, 66, 0.15)' : 'none',
                }}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ 
                    color: isActive ? '#F5C542' : '#94A3B8',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '999px',
                    background: isActive ? '#F5C542' : 'rgba(255,255,255,0.06)',
                    color: isActive ? '#061A40' : '#94A3B8',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    {item.badge}
                  </span>
                  <ChevronRight size={13} style={{ opacity: isActive ? 1 : 0.4, color: isActive ? '#F5C542' : 'inherit' }} />
                </div>
              </NavLink>
            );
          })}

          {/* Quick Action: My Reservations */}
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              openMyBookings();
            }}
            style={{
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 0.95rem',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#F5C542',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              textAlign: 'left',
              transition: 'background 0.2s',
            }}
            title="View confirmed bookings"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <CalendarCheck size={18} color="#F5C542" />
              <span>My Reservations</span>
            </div>
            <span style={{
              background: '#F5C542',
              color: '#061A40',
              borderRadius: '999px',
              padding: '0.1rem 0.5rem',
              fontSize: '0.7rem',
              fontWeight: 800
            }}>
              {userBookings.length}
            </span>
          </button>

          {/* Operations Portal Button for Staff */}
          {isStaff && (
            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                onOpenStaffPortal();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 0.95rem',
                borderRadius: '10px',
                background: '#F5C542',
                border: 'none',
                color: '#061A40',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.825rem',
                textAlign: 'left',
                boxShadow: '0 4px 12px rgba(245, 197, 66, 0.30)',
              }}
            >
              <Briefcase size={17} color="#061A40" />
              <span>Staff Portal ({currentUser.role})</span>
            </button>
          )}
        </nav>

        {/* Sidebar Footer: Quick Assistance Card */}
        <div style={{
          padding: '1rem 1.15rem',
          borderTop: '1px solid #102B56',
          background: '#04132F',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '0.75rem 0.85rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#F5C542', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              <ShieldCheck size={14} color="#F5C542" />
              <span>24/7 Front Desk Help</span>
            </div>
            <a 
              href="tel:+918639961089" 
              style={{
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'block',
                marginTop: '0.15rem',
              }}
            >
              📞 +91 8639961089
            </a>
            <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '0.2rem' }}>
              Station Road • Best Rates
            </div>
          </div>
        </div>
      </aside>

      <style>{`
        .sidebar-nav-item:hover {
          color: #FFE08A !important;
          background: rgba(245, 197, 66, 0.10) !important;
          transform: translateX(3px);
        }
        @media (max-width: 960px) {
          .app-sidebar {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            transform: translateX(-100%);
          }
          .app-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </>
  );
};
