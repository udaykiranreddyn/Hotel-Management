import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Check, 
  Copy, 
  CreditCard,
  Download,
  Loader2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { BookingService } from '../services/api';
import { PaymentService, loadRazorpayScript } from '../services/paymentService';
import { PaymentReceiptModal } from './payment/PaymentReceiptModal';
import type { PaymentReceipt } from '../services/paymentService';
import type { BookingRecord } from '../context/BookingContext';
import { saveBookingToFirestore } from '../firebase';

interface BookingModalProps {
  onOpenAuth?: () => void;
  onOpenStaffPortal?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({}) => {
  const { 
    isBookingModalOpen, 
    closeBookingModal, 
    selectedRoomForBooking, 
    userBookings, 
    saveBookings, 
    refreshRooms, 
    openMyBookings,
    currentUser 
  } = useBooking();

  const [bookingCheckIn, setBookingCheckIn] = useState('2026-09-25');
  const [bookingCheckOut, setBookingCheckOut] = useState('2026-09-27');
  const [bookingGuests, setBookingGuests] = useState('2');
  const [guestName, setGuestName] = useState(currentUser?.full_name || '');
  const [guestEmail, setGuestEmail] = useState(currentUser?.email || '');
  const [guestPhone, setGuestPhone] = useState(currentUser?.phone || '');
  const [roomPreference, setRoomPreference] = useState(currentUser?.preferences || 'Quiet Room with Window');

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoFlatDiscount, setPromoFlatDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');

  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Receipt state
  const [lastPaymentId, setLastPaymentId] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setGuestName(currentUser.full_name);
      setGuestEmail(currentUser.email);
      if (currentUser.phone) setGuestPhone(currentUser.phone);
      if (currentUser.preferences) setRoomPreference(currentUser.preferences);
    }
    setConfirmedBooking(null);
    setBookingError(null);
    setPromoError('');
    setAppliedPromo(null);
    setPromoFlatDiscount(0);
  }, [currentUser, selectedRoomForBooking, isBookingModalOpen]);

  if (!isBookingModalOpen || !selectedRoomForBooking) return null;

  // Nights calculation
  const start = new Date(bookingCheckIn);
  const end = new Date(bookingCheckOut);
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const calculatedNights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

  const baseTotal = selectedRoomForBooking.price * calculatedNights;
  const taxes = Math.round(baseTotal * 0.12);
  const grandTotal = Math.max(0, baseTotal + taxes - promoFlatDiscount);

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await BookingService.validateCoupon(code, baseTotal);
      if (res.is_valid) {
        setAppliedPromo(`${res.code} (Saved ₹${res.discount_amount})`);
        setPromoFlatDiscount(res.discount_amount);
        setPromoError('');
      } else {
        setPromoError(res.message);
        setAppliedPromo(null);
        setPromoFlatDiscount(0);
      }
    } catch {
      if (code === 'AURA10' || code === 'SAVE10') {
        const disc = Math.round(baseTotal * 0.1);
        setAppliedPromo(`${code} (10% Off Applied)`);
        setPromoFlatDiscount(disc);
        setPromoError('');
      } else if (code === 'WELCOME20') {
        const disc = Math.round(baseTotal * 0.2);
        setAppliedPromo('WELCOME20 (20% Off Applied)');
        setPromoFlatDiscount(disc);
        setPromoError('');
      } else {
        setPromoError('Invalid coupon. Try "AURA10" for 10% off or "WELCOME20" for 20% off!');
      }
    }
  };

  const handleDownloadReceipt = async () => {
    if (!lastPaymentId && !confirmedBooking) return;
    setIsLoadingReceipt(true);
    try {
      if (lastPaymentId) {
        const data = await PaymentService.getReceipt(lastPaymentId);
        setReceipt(data);
        setIsReceiptOpen(true);
      } else if (confirmedBooking) {
        // Build receipt from confirmed booking
        setReceipt({
          hotel_name: 'Aura Grand Luxury Hotel & Suites',
          hotel_address: '742 Evergreen Promenade, Bandra Kurla Complex, Mumbai, Maharashtra 400051',
          hotel_gstin: '27AAACH7429K1ZX',
          hotel_contact_phone: '+91 22 4988 7000',
          hotel_contact_email: 'reservations@aurahotels.com',
          receipt_number: `REC-${confirmedBooking.id}`,
          booking_reference: confirmedBooking.id,
          payment_id: 1,
          guest_name: confirmedBooking.guestName,
          guest_email: confirmedBooking.guestEmail,
          guest_phone: confirmedBooking.guestPhone,
          room_number: confirmedBooking.roomName,
          room_type: confirmedBooking.roomType,
          check_in_date: confirmedBooking.checkIn,
          check_out_date: confirmedBooking.checkOut,
          total_nights: confirmedBooking.nights,
          num_guests: confirmedBooking.guests,
          price_per_night: selectedRoomForBooking.price,
          room_charges: confirmedBooking.baseAmount,
          taxes: confirmedBooking.taxAmount,
          discount_amount: confirmedBooking.discountAmount,
          total_amount: confirmedBooking.totalAmount,
          currency: 'INR',
          payment_method: 'RAZORPAY',
          payment_status: 'SUCCESS',
          payment_date: new Date().toISOString(),
        });
        setIsReceiptOpen(true);
      }
    } catch (err) {
      console.error('Failed to load receipt:', err);
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBooking(true);
    setBookingError(null);

    try {
      // 1. Create live Razorpay order on backend
      const order = await PaymentService.createOrder({
        room_id: selectedRoomForBooking.id,
        check_in_date: bookingCheckIn,
        check_out_date: bookingCheckOut,
        num_guests: parseInt(bookingGuests, 10),
        guest_name: guestName || (currentUser ? currentUser.full_name : 'Guest Traveler'),
        guest_email: guestEmail || (currentUser ? currentUser.email : 'guest@aurahotels.com'),
        guest_phone: guestPhone || '+91 98765 11111',
        special_requests: roomPreference,
        coupon_code: appliedPromo ? promoCode.trim().toUpperCase() : undefined,
      });

      // 2. Ensure Razorpay Checkout script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setIsSubmittingBooking(false);
        setBookingError('Razorpay Checkout SDK failed to load. Please check your internet connection.');
        return;
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: order.key_id,
        amount: order.amount_paise,
        currency: order.currency || 'INR',
        name: order.hotel_name || 'Aura Grand Luxury Hotel',
        description: `Booking for ${order.room_name} (${order.num_nights} nights)`,
        order_id: order.order_id,
        prefill: {
          name: order.guest_name,
          email: order.guest_email,
          contact: order.guest_phone || '+91 98765 11111',
        },
        notes: {
          booking_reference: order.booking_reference,
          room_type: order.room_type,
        },
        theme: {
          color: '#d4af37',
          backdrop_color: 'rgba(7, 11, 20, 0.85)',
        },
        handler: async function (response: any) {
          try {
            // 4. Verify payment signature on backend
            const verifyRes = await PaymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            const newBooking: BookingRecord = {
              id: verifyRes.booking_reference,
              roomId: selectedRoomForBooking.id,
              roomName: order.room_name,
              roomType: order.room_type,
              roomImage: selectedRoomForBooking.image,
              checkIn: order.check_in_date,
              checkOut: order.check_out_date,
              nights: order.num_nights,
              guests: order.num_guests,
              guestName: order.guest_name,
              guestEmail: order.guest_email,
              guestPhone: order.guest_phone || '+91 98765 11111',
              roomPreference,
              baseAmount: order.room_charges,
              taxAmount: order.taxes,
              discountAmount: order.discount_amount,
              totalAmount: order.amount,
              status: 'CONFIRMED',
              createdAt: new Date().toISOString(),
            };

            const updated = [newBooking, ...userBookings];
            saveBookings(updated);
            await saveBookingToFirestore({
              booking_reference: String(newBooking.id),
              guest_name: newBooking.guestName,
              guest_email: newBooking.guestEmail,
              room_id: newBooking.roomId,
              check_in_date: newBooking.checkIn,
              check_out_date: newBooking.checkOut,
              total_amount: newBooking.totalAmount,
              status: newBooking.status,
            });
            setConfirmedBooking(newBooking);
            setLastPaymentId(verifyRes.payment_id);
            refreshRooms();
          } catch (err: any) {
            console.error('Payment verification failed:', err);
            setBookingError(err.response?.data?.detail || 'Payment verification failed on backend.');
          } finally {
            setIsSubmittingBooking(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmittingBooking(false);
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', function (resp: any) {
        setIsSubmittingBooking(false);
        const reason = resp.error?.description || 'Payment was declined or cancelled.';
        setBookingError(`Payment failed: ${reason}`);
      });
      razorpayInstance.open();
    } catch (err: any) {
      console.error('Reservation error:', err);
      setIsSubmittingBooking(false);
      const detail = err.response?.data?.detail;
      if (err.response?.status === 409) {
        setBookingError(`⚠️ DOUBLE-BOOKING PREVENTED: ${detail || 'This room is already reserved for the selected dates.'}`);
      } else {
        setBookingError(detail || 'Could not complete reservation with backend server.');
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
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
        maxHeight: '92vh',
        overflowY: 'auto',
        background: '#FFFFFF',
        borderColor: '#BAE6FD',
        boxShadow: '0 20px 60px rgba(14, 165, 233, 0.2)',
        padding: '2rem',
        position: 'relative',
      }}>
        {/* Close Button */}
        <button 
          onClick={closeBookingModal}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
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
          aria-label="Close Modal"
        >
          <X size={18} />
        </button>

        {confirmedBooking ? (
          /* Confirmation Success View */
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(22, 163, 74, 0.15)',
              border: '2px solid #16A34A',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <CheckCircle2 size={34} />
            </div>

            <div className="badge badge-success" style={{ marginBottom: '0.75rem' }}>
              RESERVATION CONFIRMED
            </div>

            <h2 style={{ fontSize: '1.7rem', color: '#0F172A', marginBottom: '0.5rem' }}>
              Your Room is Booked!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Thank you, <strong style={{ color: '#0284C7' }}>{confirmedBooking.guestName}</strong>. Your room is locked with zero risk of overbooking.
            </p>

            {/* Booking Voucher Card */}
            <div style={{
              background: '#E0F2FE',
              border: '1px solid #BAE6FD',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              textAlign: 'left',
              marginBottom: '1.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Booking Voucher Code</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--gold-light)', fontFamily: 'monospace' }}>
                    {confirmedBooking.id}
                  </div>
                </div>
                <button 
                  onClick={() => handleCopyCode(confirmedBooking.id)}
                  className="btn-outline-gold"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Reserved Room</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{confirmedBooking.roomName}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Dates &amp; Duration</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{confirmedBooking.checkIn} to {confirmedBooking.checkOut} ({confirmedBooking.nights}n)</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Guests</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{confirmedBooking.guests} Guests</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Total Amount</div>
                  <div style={{ fontWeight: 700, color: '#34d399' }}>₹{confirmedBooking.totalAmount.toLocaleString('en-IN')} (Confirmed)</div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(212, 175, 55, 0.08)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                🔑 <strong>Check-in Info:</strong> Check-in starts at 12:00 PM. Present your Booking Code <strong>{confirmedBooking.id}</strong> at the front desk.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={handleDownloadReceipt}
                disabled={isLoadingReceipt}
                className="btn-primary"
                style={{ padding: '0.75rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Download size={16} />
                <span>{isLoadingReceipt ? 'Generating Receipt...' : 'Download Receipt (PDF)'}</span>
              </button>
              <button 
                onClick={() => {
                  closeBookingModal();
                  openMyBookings();
                }}
                className="btn-secondary"
                style={{ padding: '0.75rem 1.25rem' }}
              >
                View in My Bookings
              </button>
              <button 
                onClick={closeBookingModal}
                className="btn-secondary"
                style={{ padding: '0.75rem 1.25rem' }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Booking Input Form */
          <div>
            <span className="gold-subheading">EASY ROOM RESERVATION</span>
            <h2 style={{ fontSize: '1.45rem', marginBottom: '1.25rem' }}>
              Reserve <span className="text-gold">{selectedRoomForBooking.name}</span>
            </h2>

            {/* Selected Room Header Preview */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              background: 'var(--bg-tertiary)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.25rem'
            }}>
              <img 
                src={selectedRoomForBooking.image} 
                alt={selectedRoomForBooking.name} 
                style={{ width: '75px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1rem', margin: 0 }}>{selectedRoomForBooking.name}</h4>
                  <span style={{ fontWeight: 700, color: 'var(--gold-light)', fontSize: '1.1rem' }}>
                    ₹{selectedRoomForBooking.price.toLocaleString('en-IN')}<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/night</span>
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {selectedRoomForBooking.capacity} • {selectedRoomForBooking.bed} • {selectedRoomForBooking.floor}
                </div>
              </div>
            </div>

            {bookingError && (
              <div style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                marginBottom: '1.25rem'
              }}>
                {bookingError}
              </div>
            )}

            <form onSubmit={handleConfirmReservation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    Check-in Date
                  </label>
                  <input 
                    type="date" 
                    value={bookingCheckIn}
                    onChange={(e) => setBookingCheckIn(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    Check-out Date
                  </label>
                  <input 
                    type="date" 
                    value={bookingCheckOut}
                    onChange={(e) => setBookingCheckOut(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    Guests
                  </label>
                  <select 
                    value={bookingGuests}
                    onChange={(e) => setBookingGuests(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      outline: 'none'
                    }}
                  >
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4 Guests</option>
                  </select>
                </div>
              </div>

              {/* Guest Personal Information */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    Email (for confirmation)
                  </label>
                  <input 
                    type="email" 
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="e.g. ramesh@gmail.com"
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    Phone Number
                  </label>
                  <input 
                    type="tel" 
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+91 98765 11111"
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Coupon Code Section */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Coupon code (e.g. AURA10 or WELCOME20)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.55rem 0.75rem',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)',
                      outline: 'none',
                      textTransform: 'uppercase'
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={handleApplyPromo}
                    className="btn-secondary"
                    style={{ padding: '0.55rem 1rem', fontSize: '0.8rem' }}
                  >
                    Apply
                  </button>
                </div>
                {appliedPromo && (
                  <div style={{ color: '#34d399', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: 600 }}>
                    ✓ {appliedPromo}
                  </div>
                )}
                {promoError && (
                  <div style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                    ✕ {promoError}
                  </div>
                )}
              </div>

              {/* Price Calculation Summary */}
              <div style={{
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  <span>₹{selectedRoomForBooking.price} × {calculatedNights} night{calculatedNights > 1 ? 's' : ''}</span>
                  <span>₹{baseTotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  <span>Hotel Taxes &amp; GST (12%)</span>
                  <span>₹{taxes.toLocaleString('en-IN')}</span>
                </div>
                {promoFlatDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#34d399' }}>
                    <span>Coupon Discount</span>
                    <span>-₹{promoFlatDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.6rem', borderTop: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: '1.05rem' }}>
                  <span>Total Payable:</span>
                  <span style={{ color: 'var(--gold-light)' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmittingBooking}
                className="btn-primary" 
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isSubmittingBooking ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Connecting to Razorpay...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    <span>Proceed to Payment (Razorpay)</span>
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={13} style={{ color: '#10b981' }} />
                <span>100% Secure Checkout via Razorpay • Instant Confirmation</span>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Official Tax Receipt Modal */}
      <PaymentReceiptModal
        receipt={receipt}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
};
