import React from 'react';
import { 
  Sparkles, 
  Wifi, 
  Wind, 
  ShowerHead, 
  Car, 
  Tv, 
  Sparkle, 
  ShieldCheck, 
  Clock, 
  Luggage, 
  Coffee, 
  Shirt, 
  Compass,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AmenitiesPage: React.FC = () => {
  const roomAmenities = [
    {
      icon: <Wifi size={24} color="var(--gold-primary)" />,
      title: 'Free High-Speed Wi-Fi',
      desc: 'Seamless high-speed internet available in all bedrooms, lobby, and common areas. Perfect for remote work, streaming, or video calls.',
      tag: 'Free Included'
    },
    {
      icon: <Wind size={24} color="var(--gold-primary)" />,
      title: 'Air Conditioning & Fan',
      desc: 'Individual split AC units and whisper-quiet ceiling fans so you can personalize room temperature for a deep, restful night of sleep.',
      tag: 'Climate Control'
    },
    {
      icon: <ShowerHead size={24} color="var(--gold-primary)" />,
      title: '24/7 Hot Water Shower',
      desc: 'Spotless private attached bathroom with instant 24-hour hot water, high pressure shower head, fresh sanitized towels, and complimentary toiletries.',
      tag: 'Private Attached'
    },
    {
      icon: <Sparkle size={24} color="var(--gold-primary)" />,
      title: 'Daily Housekeeping & Linen',
      desc: 'Every stay includes freshly sanitized bedsheets, clean pillow covers, and spotless floor cleaning done daily by our meticulous team.',
      tag: '100% Sanitized'
    },
    {
      icon: <Car size={24} color="var(--gold-primary)" />,
      title: 'Free Safe Parking',
      desc: 'Spacious on-premises parking space for two-wheelers and four-wheelers with round-the-clock security and CCTV monitoring.',
      tag: 'Secure & Free'
    },
    {
      icon: <Tv size={24} color="var(--gold-primary)" />,
      title: 'Smart LED TV',
      desc: 'Wall-mounted high definition LED television in your room with local news, entertainment, and sports channels.',
      tag: 'HD Entertainment'
    },
    {
      icon: <Coffee size={24} color="var(--gold-primary)" />,
      title: 'Electric Kettle & Hot Water',
      desc: 'Electric kettle in comfort rooms with tea bags, coffee sachets, sugar, and daily fresh drinking water bottles.',
      tag: 'Comfort Rooms'
    },
    {
      icon: <ShieldCheck size={24} color="var(--gold-primary)" />,
      title: '24/7 CCTV & Security',
      desc: 'Comprehensive security cameras at entrances, corridors, and parking areas to keep you and your family safe at all times.',
      tag: 'Full Safety'
    }
  ];

  const hotelServices = [
    {
      title: '24/7 Helpful Front Desk',
      desc: 'Our hospitable reception desk is staffed around the clock to assist you with quick check-in, late arrival, directions, or room needs.',
      badge: 'Always Open'
    },
    {
      title: 'Clean Linen & Laundry Service',
      desc: 'Affordable, same-day laundry and ironing service available upon request. Fast towel change whenever you need.',
      badge: 'Hygienic Care'
    },
    {
      title: 'Cab & Local Transit Assistance',
      desc: 'Our staff will arrange reliable local auto rickshaws, cabs, or airport transit rides at standard local rates without price gouging.',
      badge: 'Travel Desk'
    },
    {
      title: 'Secure Luggage Storage',
      desc: 'Arriving before check-in or exploring town after checkout? Safely deposit your suitcases and bags in our monitored luggage room for free.',
      badge: 'Free Guest Perk'
    }
  ];

  return (
    <div style={{ padding: '2rem 1.5rem 5rem 1.5rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>
          <Sparkles size={14} /> GUEST COMFORTS &amp; FACILITIES
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', color: 'var(--text-main)', marginBottom: '0.6rem' }}>
          Hotel <span className="text-gold">Amenities</span> &amp; Services
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '700px', lineHeight: 1.6 }}>
          Everything you need for an enjoyable, hygienic, and comfortable hotel experience. No unnecessary luxury extras — just clean, reliable essentials.
        </p>
      </div>

      {/* Room Amenities Grid */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <span className="gold-subheading">IN-ROOM COMFORTS</span>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>What You Get in Every Room</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '1.5rem',
        }}>
          {roomAmenities.map((item, idx) => (
            <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid var(--border-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {item.icon}
                </div>
                <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>
                  {item.tag}
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                {item.title}
              </h3>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Hotel Services Section */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <span className="gold-subheading">HOSPITALITY SERVICES</span>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Front Desk &amp; Hotel Services</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
        }}>
          {hotelServices.map((service, idx) => (
            <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.75rem' }}>
              <div>
                <div className="badge badge-gold" style={{ marginBottom: '0.85rem' }}>
                  {service.badge}
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.65rem' }}>{service.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.65', marginBottom: '1.25rem' }}>
                  {service.desc}
                </p>
              </div>
              <div style={{ color: 'var(--gold-primary)', fontSize: '0.825rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>Included with Your Stay</span> ✓
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cleanliness Promise Card */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.12) 0%, #FFFFFF 100%)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        padding: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
            <ShieldCheck size={20} />
            <span>OUR HYGIENE &amp; CLEANLINESS STANDARDS</span>
          </div>
          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>100% Sanitized Bedding &amp; Clean Bathrooms</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
            Every room undergoes strict hospital-grade surface sanitization, fresh laundered linens, and bathroom scrubbing before keys are handed over. Your health and comfort are our top priority.
          </p>
        </div>

        <Link to="/rooms" className="btn-primary" style={{ padding: '0.85rem 1.85rem', fontSize: '0.95rem' }}>
          <span>View Rooms with These Amenities</span>
          <ArrowRight size={17} />
        </Link>
      </div>
    </div>
  );
};

