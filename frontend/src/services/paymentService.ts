import axios from 'axios';

const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('aura_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface CreateOrderPayload {
  room_id?: number;
  check_in_date?: string;
  check_out_date?: string;
  num_guests?: number;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  special_requests?: string;
  coupon_code?: string;
  booking_id?: number;
}

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  amount_paise: number;
  currency: string;
  key_id: string;
  booking_id: number;
  booking_reference: string;
  hotel_name: string;
  room_name: string;
  room_type: string;
  check_in_date: string;
  check_out_date: string;
  num_nights: number;
  num_guests: number;
  price_per_night: number;
  room_charges: number;
  taxes: number;
  discount_amount: number;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  booking_id: number;
  booking_reference: string;
  payment_id: number;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  payment_status: string;
  booking_status: string;
  payment_method?: string;
  paid_at: string;
}

export interface RefundItem {
  id: number;
  razorpay_refund_id?: string;
  refund_amount: number;
  currency: string;
  reason: string;
  status: string;
  processed_at: string;
}

export interface PaymentRecord {
  id: number;
  payment_reference: string;
  booking_id: number;
  booking_reference: string;
  user_id?: number;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  room_number: string;
  room_type: string;
  check_in_date: string;
  check_out_date: string;
  num_nights: number;
  num_guests: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  amount: number;
  currency: string;
  method?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | string;
  booking_status: string;
  created_at: string;
  updated_at?: string;
  notes?: string;
  refunds: RefundItem[];
}

export interface PaymentReceipt {
  hotel_name: string;
  hotel_address: string;
  hotel_gstin: string;
  hotel_contact_phone: string;
  hotel_contact_email: string;
  receipt_number: string;
  booking_reference: string;
  payment_id: number;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  room_number: string;
  room_type: string;
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  num_guests: number;
  price_per_night: number;
  room_charges: number;
  taxes: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  payment_date: string;
}

export interface PaymentStats {
  total_revenue: number;
  total_successful_payments: number;
  pending_payments: number;
  failed_payments: number;
  refunded_payments: number;
  total_refunded_amount: number;
  recent_transactions: PaymentRecord[];
}

export interface RefundPayload {
  amount?: number;
  reason: string;
}

export interface RefundResult {
  success: boolean;
  message: string;
  refund_id?: number;
  razorpay_refund_id?: string;
  amount: number;
  currency: string;
  status: string;
  payment_id: number;
  booking_reference: string;
}

/** Dynamically load Razorpay Checkout script if not already present */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export const PaymentService = {
  createOrder: async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
    const res = await axios.post(`${API_BASE}/payments/create-order`, payload, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  verifyPayment: async (payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> => {
    const res = await axios.post(`${API_BASE}/payments/verify`, payload, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  getMyPayments: async (): Promise<PaymentRecord[]> => {
    const res = await axios.get(`${API_BASE}/payments/my-payments`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  getPaymentDetails: async (paymentId: number): Promise<PaymentRecord> => {
    const res = await axios.get(`${API_BASE}/payments/${paymentId}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  getPaymentStatus: async (paymentId: number): Promise<any> => {
    const res = await axios.get(`${API_BASE}/payments/${paymentId}/status`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  getReceipt: async (paymentId: number): Promise<PaymentReceipt> => {
    const res = await axios.get(`${API_BASE}/payments/${paymentId}/receipt`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  refundPayment: async (paymentId: number, payload: RefundPayload): Promise<RefundResult> => {
    const res = await axios.post(`${API_BASE}/payments/${paymentId}/refund`, payload, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  getAdminOverview: async (params?: {
    search?: string;
    status_filter?: string;
    limit?: number;
  }): Promise<PaymentStats> => {
    const res = await axios.get(`${API_BASE}/payments/admin/overview`, {
      headers: getAuthHeader(),
      params,
    });
    return res.data;
  },
};
