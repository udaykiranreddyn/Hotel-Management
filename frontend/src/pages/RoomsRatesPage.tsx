import React, { useState, useMemo } from 'react';
import { 
  BedDouble, 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  IndianRupee, 
  Tag, 
  Wifi, 
  Wind, 
  ShowerHead,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import type { RoomItem } from '../context/BookingContext';

export const RoomsRatesPage: React.FC = () => {
  const { rooms, openBookingModal } = useBooking();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [maxPrice, setMaxPrice] = useState<number>(3000);

  const categories = [
    { id: 'ALL', label: 'All Rooms & Tariffs' },
    { id: 'STANDARD', label: 'Standard Single (₹599)' },
    { id: 'DELUXE', label: 'Standard Double (₹899)' },
    { id: 'PREMIUM', label: 'Comfort AC Room (₹1,199)' },
    { id: 'SUITE', label: 'Family Room (₹1,499)' },
  ];

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchCat = selectedCategory === 'ALL' || r.type.toUpperCase() === selectedCategory.toUpperCase();
      const matchPrice = r.price <= maxPrice;
      return matchCat && matchPrice;
    });
  }, [rooms, selectedCategory, maxPrice]);

  return (
    <div style={{ padding: '2rem 1.5rem 5rem 1.5rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>
          <BedDouble size={14} /> HONEST &amp; TRANSPARENT PRICING
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', color: 'var(--text-main)', marginBottom: '0.6rem' }}>
          Rooms &amp; <span className="text-gold">Rates</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '700px', lineHeight: 1.6 }}>
          Explore our complete catalog of clean, sanitized, and comfortable hotel rooms. Honest direct prices starting from ₹599 with no surprise platform surcharges.
        </p>
      </div>

      {/* Quick Tariff Summary Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2.5rem',
      }}>
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--gold-primary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Standard Single</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--gold-light)', margin: '0.2rem 0' }}>₹599<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / night</span></div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>Solo travelers &amp; students</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--gold-primary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Standard Double</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--gold-light)', margin: '0.2rem 0' }}>₹899<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / night</span></div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>2 Adults • Queen Bed</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--gold-primary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Comfort AC Room</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--gold-light)', margin: '0.2rem 0' }}>₹1,199<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / night</span></div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>Split AC • King Bed</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--gold-primary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Comfort Family Room</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--gold-light)', margin: '0.2rem 0' }}>₹1,499<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / night</span></div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>Up to 4 Guests • 2 Beds</div>
        </div>
      </div>

      {/* Filter Tabs & Budget Filter */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '2rem',
        padding: '1rem 1.25rem',
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '999px',
                  border: isSelected ? '1px solid #F5C542' : '1px solid var(--border-subtle)',
                  background: isSelected ? '#F5C542' : '#FFFFFF',
                  color: isSelected ? '#061A40' : 'var(--text-muted)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Max Budget Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Budget limit:</span>
          <select
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--gold-light)',
              fontSize: '0.85rem',
              outline: 'none',
              fontWeight: 600
            }}
          >
            <option value={700}>Under ₹700 (Economy)</option>
            <option value={1000}>Under ₹1,000 (Standard)</option>
            <option value={1300}>Under ₹1,300 (AC Comfort)</option>
            <option value={3000}>All Price Ranges</option>
          </select>
        </div>
      </div>

      {/* Rooms Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem',
      }}>
        {filteredRooms.map((room) => (
          <div 
            key={room.id} 
            className="glass-card" 
            style={{ 
              padding: 0, 
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
          >
            {/* Image Header with Badge */}
            <div style={{ position: 'relative', height: '230px', overflow: 'hidden' }}>
              <img 
                src={room.image} 
                alt={room.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                background: 'rgba(11, 17, 30, 0.88)',
                backdropFilter: 'blur(8px)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--gold-light)',
                border: '1px solid var(--border-gold)'
              }}>
                {room.type} Room
              </div>
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(16, 185, 129, 0.9)',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#ffffff'
              }}>
                {room.status}
              </div>

              {/* Price Tag Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '0.75rem',
                right: '1rem',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #F5C542',
                color: 'var(--gold-dark)',
                fontWeight: 800,
                fontSize: '1.1rem',
              }}>
                ₹{room.price.toLocaleString('en-IN')}<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/night</span>
              </div>
            </div>

            {/* Room Content */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{room.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 600 }}>
                  <Star size={14} fill="#fbbf24" /> {room.rating}
                </div>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                {room.description}
              </p>

              {/* Specs */}
              <div style={{ 
                color: 'var(--gold-light)', 
                fontSize: '0.8rem', 
                marginBottom: '1rem', 
                display: 'flex', 
                gap: '0.75rem', 
                flexWrap: 'wrap',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px'
              }}>
                <span>👥 {room.capacity}</span>
                <span>•</span>
                <span>🛏️ {room.bed}</span>
                <span>•</span>
                <span>🏢 {room.floor}</span>
              </div>

              {/* Amenities Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                {room.amenities.map((amenity, idx) => (
                  <span key={idx} style={{
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {amenity}
                  </span>
                ))}
              </div>

              {/* Bottom Book Button */}
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--gold-light)' }}>
                    ₹{room.price.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Includes Wi-Fi &amp; Hot Water</div>
                </div>

                <button 
                  className="btn-primary" 
                  style={{ padding: '0.6rem 1.4rem', fontSize: '0.9rem' }}
                  onClick={() => openBookingModal(room)}
                >
                  Book This Room
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Price Transparency Guarantee Box */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(17, 29, 56, 0.9) 100%)',
        borderColor: 'var(--border-gold)',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
      }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold-primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
            <ShieldCheck size={20} />
            <span>OUR 100% TRANSPARENT TARIFF PROMISE</span>
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Hidden Service Charges. Zero Surprise Taxes.</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
            Every rate published above is strictly what you pay at checkout. What you see is guaranteed with 100% full refund cancellation should your travel plans change.
          </p>
        </div>

        <button 
          onClick={() => openBookingModal(filteredRooms[0] || rooms[0])}
          className="btn-primary"
          style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem' }}
        >
          Book Your Stay Now
        </button>
      </div>
    </div>
  );
};
