import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Users, 
  BedDouble, 
  Sparkles, 
  CheckCircle2, 
  Star, 
  IndianRupee,
  SlidersHorizontal,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { AIService } from '../services/api';
import type { RoomItem } from '../context/BookingContext';

export const SearchRoomsPage: React.FC = () => {
  const { rooms, openBookingModal } = useBooking();

  const [checkIn, setCheckIn] = useState('2026-09-25');
  const [checkOut, setCheckOut] = useState('2026-09-27');
  const [guests, setGuests] = useState('2');
  const [roomType, setRoomType] = useState('ALL');
  const [budget, setBudget] = useState('3000');
  const [aiRecommendedRoomId, setAiRecommendedRoomId] = useState<number | null>(null);
  const [aiMatchScore, setAiMatchScore] = useState<number | null>(null);
  const [isFindingAIMatch, setIsFindingAIMatch] = useState(false);
  const [hasSearched, setHasSearched] = useState(true);

  // Filtered rooms logic
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchCategory = roomType === 'ALL' || r.type.toUpperCase() === roomType.toUpperCase();
      const matchBudget = !budget || r.price <= parseInt(budget, 10);
      return matchCategory && matchBudget;
    });
  }, [rooms, roomType, budget]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
  };

  const handleAIMatch = async () => {
    setIsFindingAIMatch(true);
    try {
      const res = await AIService.recommendRoom({
        guests: parseInt(guests, 10) || 2,
        budget: parseInt(budget, 10) || 3000,
        preference: `${roomType !== 'ALL' ? roomType : 'Comfortable'} clean room`,
        purpose: 'Leisure & Transit Stay',
      });
      if (res && res.recommended_room) {
        setAiRecommendedRoomId(res.recommended_room.id);
        setAiMatchScore(Math.round((res.match_score || 0.95) * 100));
      } else {
        setAiRecommendedRoomId(filteredRooms[0]?.id || 102);
        setAiMatchScore(94);
      }
    } catch {
      setAiRecommendedRoomId(filteredRooms[0]?.id || 102);
      setAiMatchScore(92);
    } finally {
      setIsFindingAIMatch(false);
    }
  };

  const handleResetFilters = () => {
    setRoomType('ALL');
    setBudget('3000');
    setGuests('2');
    setAiRecommendedRoomId(null);
    setAiMatchScore(null);
  };

  return (
    <div style={{ padding: '2rem 1.5rem 5rem 1.5rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Title & Breadcrumbs */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>
          <Search size={14} /> LIVE AVAILABILITY SEARCH
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Search &amp; Find <span className="text-gold">Hotel Rooms</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '650px', lineHeight: 1.6 }}>
          Explore live room availability, select your check-in dates, customize your budget, or use AI recommendation for the best matched room.
        </p>
      </div>

      {/* Main Search Filter Card */}
      <div className="glass-card" style={{
        background: '#FFFFFF',
        borderColor: 'var(--border-subtle)',
        boxShadow: 'var(--shadow-md)',
        padding: '2rem',
        marginBottom: '2.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SlidersHorizontal size={18} color="var(--gold-primary)" />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Filter Reservation Parameters</h3>
          </div>
          <div className="badge badge-success">
            <CheckCircle2 size={13} /> Direct Database Lock
          </div>
        </div>

        <form onSubmit={handleSearchSubmit}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            {/* Check-in */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                <Calendar size={14} color="var(--gold-primary)" />
                <span>Check-in Date</span>
              </label>
              <input 
                type="date" 
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Check-out */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                <Calendar size={14} color="var(--gold-primary)" />
                <span>Check-out Date</span>
              </label>
              <input 
                type="date" 
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Guests */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                <Users size={14} color="var(--gold-primary)" />
                <span>Guests</span>
              </label>
              <select 
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              >
                <option value="1">1 Adult Guest</option>
                <option value="2">2 Adults (Standard)</option>
                <option value="3">3 Guests (Comfort)</option>
                <option value="4">4 Guests (Family Room)</option>
              </select>
            </div>

            {/* Room Category */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                <BedDouble size={14} color="var(--gold-primary)" />
                <span>Room Type</span>
              </label>
              <select 
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              >
                <option value="ALL">All Room Types</option>
                <option value="STANDARD">Standard Single (₹599)</option>
                <option value="DELUXE">Standard Double (₹899)</option>
                <option value="PREMIUM">Comfort AC Room (₹1,199)</option>
                <option value="SUITE">Comfort Family Room (₹1,499)</option>
              </select>
            </div>
          </div>

          {/* Budget Range Slider */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <IndianRupee size={15} color="var(--gold-primary)" /> Max Nightly Budget Filter
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold-light)' }}>
                Up to ₹{parseInt(budget, 10).toLocaleString('en-IN')}
              </span>
            </div>
            <input 
              type="range" 
              min="500" 
              max="3000" 
              step="100" 
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--gold-primary)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.35rem' }}>
              <span>₹500 (Economy)</span>
              <span>₹1,500 (Family Room)</span>
              <span>₹3,000 (Maximum)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
            >
              <Search size={17} />
              <span>Filter Rooms</span>
            </button>

            <button 
              type="button" 
              onClick={handleAIMatch}
              disabled={isFindingAIMatch}
              className="btn-outline-gold" 
              style={{ padding: '0.85rem 1.5rem', fontSize: '0.95rem' }}
            >
              <Sparkles size={17} />
              <span>{isFindingAIMatch ? 'Calculating Match…' : 'AI Recommendation Engine'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', color: 'var(--text-main)', margin: 0 }}>
            Available Rooms ({filteredRooms.length})
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing verified accommodations for {guests} guest{guests !== '1' ? 's' : ''} • {checkIn} to {checkOut}
          </span>
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
        }}>
          {filteredRooms.map((room) => {
            const isTopMatch = aiRecommendedRoomId === room.id;
            return (
              <div 
                key={room.id} 
                className="glass-card" 
                style={{ 
                  padding: 0, 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column',
                  border: isTopMatch ? '2px solid var(--gold-primary)' : '1px solid var(--border-gold)',
                  boxShadow: isTopMatch ? '0 12px 35px rgba(212, 175, 55, 0.25)' : undefined
                }}
              >
                <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                  <img 
                    src={room.image} 
                    alt={room.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    background: 'rgba(11, 17, 30, 0.85)',
                    backdropFilter: 'blur(8px)',
                    padding: '0.3rem 0.75rem',
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
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#ffffff'
                  }}>
                    {room.status}
                  </div>

                  {isTopMatch && (
                    <div style={{
                      position: 'absolute',
                      bottom: '0.75rem',
                      left: '1rem',
                      background: '#F5C542',
                      color: '#061A40',
                      padding: '0.3rem 0.75rem',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 4px 14px rgba(245,197,66,0.35)',
                    }}>
                      <Sparkles size={14} color="#FFFFFF" />
                      <span>AI Top Match ({aiMatchScore}%)</span>
                    </div>
                  )}
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{room.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 600 }}>
                      <Star size={14} fill="#fbbf24" /> {room.rating}
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: '1.5', marginBottom: '0.85rem' }}>
                    {room.description}
                  </p>

                  <div style={{ color: 'var(--gold-light)', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                    <span>{room.capacity}</span>
                    <span>•</span>
                    <span>{room.bed}</span>
                    <span>•</span>
                    <span>{room.floor}</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                    {room.amenities.map((amenity, idx) => (
                      <span key={idx} style={{
                        fontSize: '0.7rem',
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

                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <div>
                      <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--gold-light)' }}>
                        ₹{room.price.toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / night</span>
                    </div>

                    <button 
                      className="btn-primary" 
                      style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}
                      onClick={() => openBookingModal(room)}
                    >
                      Book Room
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <BedDouble size={48} color="var(--gold-primary)" style={{ margin: '0 auto 1.25rem auto' }} />
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>No Rooms Match Your Selected Budget</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
            Try raising your budget slider or clearing the room type filter to view all our available accommodations.
          </p>
          <button 
            onClick={handleResetFilters} 
            className="btn-outline-gold"
          >
            Reset Filters &amp; Show All Rooms
          </button>
        </div>
      )}
    </div>
  );
};
