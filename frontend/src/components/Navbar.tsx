import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  User, 
  CalendarCheck, 
  CreditCard,
  LogOut, 
  Briefcase,
  PanelLeft
} from 'lucide-react';
import type { SystemHealthData, UserProfile } from '../services/api';
import { useBooking } from '../context/BookingContext';

interface NavbarProps {
  healthData: SystemHealthData | null;
  healthError: boolean;
  onRefreshHealth: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenStaffPortal: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  healthData, 
  healthError, 
  onRefreshHealth,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenStaffPortal,
  onToggleSidebar,
}) => {
  const { userBookings, openMyBookings } = useBooking();

  const isStaff = currentUser && currentUser.role !== 'GUEST';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 900,
      background: '#FFFFFF',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #E2E8F0',
      boxShadow: '0 2px 12px rgba(6, 26, 64, 0.08)'
    }}>
      {/* Top Header Row */}
      <div style={{
        padding: '0 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '62px'
      }}>
        {/* Left: Mobile Sidebar Toggle & Page Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#F0F4F8',
                border: '1px solid #E2E8F0',
                color: '#061A40',
                borderRadius: '8px',
                padding: '0.45rem',
                cursor: 'pointer',
              }}
              title="Toggle Left Navigation Sidebar"
              aria-label="Toggle Sidebar"
            >
              <PanelLeft size={18} />
            </button>
          )}

          {/* Hotel Logo & Name */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: '#F5C542',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(245, 197, 66, 0.35)'
            }}>
              <Building2 size={18} color="#FFFFFF" strokeWidth={2.4} />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                fontWeight: 800,
                color: '#061A40',
                lineHeight: 1
              }}>
                AURA
              </div>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.58rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)'
              }} className="hide-on-mobile-tiny">
                Comfort Hotel
              </div>
            </div>
          </Link>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          
          {/* Real-time Backend Connection Status */}
          <button 
            onClick={onRefreshHealth}
            title={healthData ? `Backend connected! Latency: ${healthData.database.latency_ms}ms` : 'Connecting to FastAPI backend...'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              background: healthData 
                ? 'rgba(22, 163, 74, 0.12)' 
                : healthError 
                  ? 'rgba(220, 38, 38, 0.12)' 
                  : 'rgba(245, 197, 66, 0.15)',
              border: `1px solid ${healthData ? 'rgba(22, 163, 74, 0.4)' : healthError ? 'rgba(220, 38, 38, 0.4)' : 'rgba(245, 197, 66, 0.4)'}`,
              color: healthData ? '#16A34A' : healthError ? '#DC2626' : '#D4A017',
              cursor: 'pointer'
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: healthData ? '#16A34A' : healthError ? '#DC2626' : '#F5C542',
              boxShadow: healthData ? '0 0 6px #16A34A' : 'none',
              display: 'inline-block'
            }}></span>
            <span className="hide-on-mobile-tiny">{healthData ? 'API Online' : 'Connecting'}</span>
          </button>

          {/* Bookings Drawer Button */}
          <button 
            className="btn-outline-gold"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
            onClick={openMyBookings}
            title="View confirmed room reservations"
          >
            <CalendarCheck size={13} />
            <span>Bookings ({userBookings.length})</span>
          </button>

          {/* Payments & Receipts Link */}
          <Link
            to="/my-payments"
            className="btn-outline-gold"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            title="View Razorpay payment invoices & receipts"
          >
            <CreditCard size={13} />
            <span className="hide-on-mobile-tiny">Payments</span>
          </Link>

          {/* Staff Portal Link */}
          {isStaff && (
            <button
              onClick={onOpenStaffPortal}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-pill)',
                background: '#F0F4F8',
                border: '1px solid #E2E8F0',
                color: '#061A40',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Open Staff Operations"
            >
              <Briefcase size={13} color="#061A40" />
              <span className="hide-on-small">Staff</span>
            </button>
          )}

          {/* User Profile / Auth */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.28rem 0.55rem',
                borderRadius: '999px',
                background: '#F0F4F8',
                border: '1px solid #E2E8F0',
              }}>
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#061A40',
                  color: '#F5C542',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                }}>
                  {currentUser.full_name.charAt(0)}
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#0B1B3A' }} className="hide-on-small">
                  {currentUser.full_name.split(' ')[0]}
                </span>
              </div>

              <button 
                onClick={onLogout}
                title="Sign out of account"
                style={{
                  padding: '0.35rem 0.5rem',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.72rem',
                  background: 'rgba(220, 38, 38, 0.08)',
                  cursor: 'pointer',
                }}
              >
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <button 
              className="btn-secondary" 
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              onClick={onOpenAuth}
              title="Sign in or use 1-click Demo"
            >
              <User size={13} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .hide-on-small {
            display: none !important;
          }
        }
        @media (max-width: 420px) {
          .hide-on-mobile-tiny {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
