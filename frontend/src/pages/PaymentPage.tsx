import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, ShieldCheck, ArrowLeft, Loader2, AlertCircle, Building2 } from 'lucide-react';
import { PaymentSummary } from '../components/payment/PaymentSummary';
import { RazorpayCheckoutButton } from '../components/payment/RazorpayCheckout';
import { PaymentService } from '../services/paymentService';
import { BookingService } from '../services/api';
import type { CreateOrderResponse, VerifyPaymentResponse } from '../services/paymentService';

export const PaymentPage: React.FC = () => {
  const { bookingRef } = useParams<{ bookingRef: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState<CreateOrderResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function initOrder() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        // If bookingRef is provided in URL, retrieve booking and create Razorpay order for it
        if (bookingRef) {
          const booking = await BookingService.getBooking(bookingRef);
          if (booking.booking_status === 'CONFIRMED') {
            navigate('/payment-success', {
              state: {
                paymentData: {
                  booking_reference: booking.booking_reference,
                  amount: booking.total_amount,
                  booking_status: 'CONFIRMED',
                  payment_status: 'SUCCESS',
                },
              },
            });
            return;
          }

          const order = await PaymentService.createOrder({
            booking_id: booking.id,
          });
          setOrderData(order);
        } else if (location.state?.roomData) {
          // Initiated from room selection
          const { roomId, checkIn, checkOut, numGuests, guestName, guestEmail, guestPhone, promoCode } = location.state.roomData;
          const order = await PaymentService.createOrder({
            room_id: roomId,
            check_in_date: checkIn,
            check_out_date: checkOut,
            num_guests: numGuests || 1,
            guest_name: guestName,
            guest_email: guestEmail,
            guest_phone: guestPhone,
            coupon_code: promoCode,
          });
          setOrderData(order);
        } else {
          // Default fallback demo room order for testing
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 5);
          const dayAfter = new Date();
          dayAfter.setDate(dayAfter.getDate() + 7);

          const order = await PaymentService.createOrder({
            room_id: 1,
            check_in_date: tomorrow.toISOString().split('T')[0],
            check_out_date: dayAfter.toISOString().split('T')[0],
            num_guests: 2,
            guest_name: 'Guest Traveler',
            guest_email: 'guest@aurahotels.com',
          });
          setOrderData(order);
        }
      } catch (err: any) {
        console.error('Order creation error:', err);
        const detail = err.response?.data?.detail || err.message || 'Could not initialize payment order.';
        setErrorMessage(detail);
      } finally {
        setIsLoading(false);
      }
    }

    initOrder();
  }, [bookingRef, location.state, navigate]);

  const handlePaymentSuccess = (verifyResult: VerifyPaymentResponse) => {
    navigate('/payment-success', {
      state: {
        paymentData: verifyResult,
      },
    });
  };

  const handlePaymentFailure = (errorReason: string) => {
    navigate('/payment-failure', {
      state: {
        reason: errorReason,
        bookingReference: orderData?.booking_reference || 'PENDING',
        bookingId: orderData?.booking_id,
      },
    });
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '600px', margin: '5rem auto', textAlign: 'center', padding: '0 1rem' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--gold-main)', margin: '0 auto 1rem auto' }} />
        <h2 style={{ color: 'var(--text-main)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          Generating Secure Razorpay Order...
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Verifying live room availability and calculating official room folios.
        </p>
      </div>
    );
  }

  if (errorMessage || !orderData) {
    return (
      <div style={{ maxWidth: '580px', margin: '4rem auto', padding: '0 1rem' }}>
        <div
          className="glass-card"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '20px',
            padding: '2.5rem',
            textAlign: 'center',
          }}
        >
          <AlertCircle size={40} style={{ color: '#ef4444', margin: '0 auto 1rem auto' }} />
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.4rem', margin: '0 0 0.75rem 0' }}>
            Unable to Process Payment Order
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
            {errorMessage || 'Room may no longer be available for the selected dates.'}
          </p>
          <button onClick={() => navigate('/rooms')} className="btn-primary">
            Return to Room Selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          marginBottom: '1.25rem',
          fontSize: '0.9rem',
        }}
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Payment Summary Component */}
        <PaymentSummary
          data={{
            hotelName: orderData.hotel_name,
            roomName: orderData.room_name,
            roomType: orderData.room_type,
            checkInDate: orderData.check_in_date,
            checkOutDate: orderData.check_out_date,
            numNights: orderData.num_nights,
            numGuests: orderData.num_guests,
            pricePerNight: orderData.price_per_night,
            roomCharges: orderData.room_charges,
            taxes: orderData.taxes,
            discountAmount: orderData.discount_amount,
            totalAmount: orderData.amount,
            currency: orderData.currency,
          }}
        />

        {/* Guest Details & Checkout Trigger */}
        <div
          className="glass-card"
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-gold)',
            borderRadius: '16px',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-gold), var(--shadow-md)',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: '0 0 1rem 0' }}>
            Guest Information
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Guest Name</span>
              <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{orderData.guest_name}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Email Address</span>
              <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{orderData.guest_email}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Phone Number</span>
              <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{orderData.guest_phone || 'N/A'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Booking Ref</span>
              <div style={{ color: 'var(--gold-main)', fontWeight: 700 }}>{orderData.booking_reference}</div>
            </div>
          </div>

          {/* Razorpay Launch Checkout Button */}
          <RazorpayCheckoutButton
            orderData={orderData}
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
            buttonText={`Pay ₹${orderData.amount.toLocaleString('en-IN')} with Razorpay`}
          />

          <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            🔒 Test Mode Enabled. Use Razorpay test cards or test UPI for instant verification.
          </div>
        </div>
      </div>
    </div>
  );
};
