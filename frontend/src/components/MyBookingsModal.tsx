import React from 'react';
import { 
  X, 
  BedDouble, 
  CheckCircle2, 
  Trash2, 
  CalendarCheck,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';

export const MyBookingsModal: React.FC = () => {
  const { isMyBookingsOpen, closeMyBookings, userBookings, cancelBooking } = useBooking();
  const navigate = useNavigate();

  if (!isMyBookingsOpen) return null;

  const handleCancel = async (id: string) => {
    if (window.confirm(`Are you sure you want to cancel room reservation ${id}? 100% full refund policy applied.`)) {
      await cancelBooking(id);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2500,
      background: 'rgba(7, 11, 20, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '640px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#FFFFFF',
        borderColor: '#BAE6FD',
        boxShadow: '0 20px 60px rgba(14, 165, 233, 0.2)',
        padding: '2rem',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div>
            <span className="gold-subheading">HOTEL RESERVATIONS</span>
            <h3 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--text-main)' }}>My Room Bookings ({userBookings.length})</h3>
          </div>
          <button 
            onClick={closeMyBookings}
            style={{
              background: '#E0F2FE',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* List of Bookings */}
        {userBookings.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {userBookings.map((b) => (
              <div key={b.id} style={{
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                    <img 
                      src={b.roomImage || '/images/deluxe_suite.jpg'} 
                      alt={b.roomName} 
                      style={{ width: '60px', height: '50px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
                    />
                    <div>
                      <h4 style={{ fontSize: '1.05rem', margin: 0 }}>{b.roomName}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 600 }}>{b.roomType} Room</span>
                    </div>
                  </div>
                  <span className="badge badge-success">
                    <CheckCircle2 size={12} /> {b.status}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.75rem',
                  background: '#E0F2FE',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem'
                }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Voucher Code</div>
                    <div style={{ fontWeight: 700, color: 'var(--gold-light)', fontFamily: 'monospace' }}>{b.id}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Dates</div>
                    <div>{b.checkIn} - {b.checkOut} ({b.nights}n)</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Guests</div>
                    <div>{b.guests} Guests</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Total Amount</div>
                    <div style={{ fontWeight: 700, color: '#34d399' }}>₹{b.totalAmount.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div>Guest: <strong style={{ color: 'var(--text-main)' }}>{b.guestName}</strong></div>
                  <button 
                    onClick={() => handleCancel(b.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    <Trash2 size={13} /> Cancel Reservation
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <BedDouble size={44} color="var(--gold-primary)" style={{ margin: '0 auto 1rem auto' }} />
            <h4 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>No Active Room Bookings Found</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              You haven't reserved any rooms yet. Explore our affordable rooms starting at just ₹599/night!
            </p>
            <button 
              onClick={() => {
                closeMyBookings();
                navigate('/rooms');
              }}
              className="btn-primary"
            >
              <Search size={16} />
              <span>Explore Rooms &amp; Rates</span>
            </button>
          </div>
        )}

        <div style={{ marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={closeMyBookings}
            className="btn-secondary"
            style={{ padding: '0.5rem 1.25rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
