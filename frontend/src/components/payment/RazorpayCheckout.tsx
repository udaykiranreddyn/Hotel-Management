import React, { useState } from 'react';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { loadRazorpayScript, PaymentService } from '../../services/paymentService';
import type { CreateOrderResponse, VerifyPaymentResponse } from '../../services/paymentService';

interface RazorpayCheckoutProps {
  orderData: CreateOrderResponse;
  onSuccess: (verifyResult: VerifyPaymentResponse) => void;
  onFailure: (errorReason: string) => void;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

export const RazorpayCheckoutButton: React.FC<RazorpayCheckoutProps> = ({
  orderData,
  onSuccess,
  onFailure,
  buttonText = 'Pay Securely with Razorpay',
  className = 'btn-primary',
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleLaunchCheckout = async () => {
    setIsProcessing(true);
    setCheckoutError(null);

    // 1. Ensure Razorpay SDK is loaded
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      setIsProcessing(false);
      const msg = 'Razorpay SDK failed to load. Please verify your internet connection.';
      setCheckoutError(msg);
      onFailure(msg);
      return;
    }

    try {
      // 2. Configure Razorpay Checkout Options
      const options = {
        key: orderData.key_id,
        amount: orderData.amount_paise,
        currency: orderData.currency || 'INR',
        name: orderData.hotel_name || 'Aura Grand Luxury Hotel',
        description: `Booking for ${orderData.room_name} (${orderData.num_nights} nights)`,
        image: 'https://checkout.razorpay.com/v1/checkout.js', // Or hotel logo
        order_id: orderData.order_id,
        prefill: {
          name: orderData.guest_name,
          email: orderData.guest_email,
          contact: orderData.guest_phone || '+91 98765 11111',
        },
        notes: {
          booking_reference: orderData.booking_reference,
          room_type: orderData.room_type,
        },
        theme: {
          color: '#d4af37', // Aura gold branding
          backdrop_color: 'rgba(7, 11, 20, 0.85)',
        },
        handler: async function (response: any) {
          // Razorpay returns razorpay_payment_id, razorpay_order_id, razorpay_signature
          try {
            const verificationPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const verifiedResult = await PaymentService.verifyPayment(verificationPayload);
            setIsProcessing(false);
            onSuccess(verifiedResult);
          } catch (err: any) {
            setIsProcessing(false);
            const detail = err.response?.data?.detail || 'Payment verification failed on the backend server.';
            setCheckoutError(detail);
            onFailure(detail);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            console.log('Razorpay checkout window was dismissed by guest.');
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);

      razorpayInstance.on('payment.failed', function (resp: any) {
        setIsProcessing(false);
        const reason = resp.error?.description || resp.error?.reason || 'Payment failed or declined by banking provider.';
        setCheckoutError(reason);
        onFailure(reason);
      });

      razorpayInstance.open();
    } catch (err: any) {
      setIsProcessing(false);
      const msg = err.message || 'Could not open Razorpay Checkout window.';
      setCheckoutError(msg);
      onFailure(msg);
    }
  };

  return (
    <div>
      <button
        onClick={handleLaunchCheckout}
        disabled={disabled || isProcessing}
        className={className}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
          opacity: disabled || isProcessing ? 0.7 : 1,
        }}
      >
        {isProcessing ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Processing with Razorpay...</span>
          </>
        ) : (
          <>
            <CreditCard size={18} />
            <span>{buttonText}</span>
          </>
        )}
      </button>

      {checkoutError && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.6rem 0.8rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <AlertCircle size={15} />
          <span>{checkoutError}</span>
        </div>
      )}
    </div>
  );
};
