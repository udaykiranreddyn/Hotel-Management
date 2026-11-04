import axios from 'axios';

// Base Axios instance. In development with Vite proxy, '/api' routes directly to backend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token when authenticated
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aura_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Authentication token expired or unauthorized.');
      localStorage.removeItem('aura_auth_token');
      localStorage.removeItem('aura_user');
    }
    return Promise.reject(error);
  }
);

// ==========================================
// Types
// ==========================================

export interface DatabaseHealth {
  status: string;
  dialect: string;
  latency_ms: number;
  error?: string;
  total_tables?: number;
}

export interface SystemHealthData {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  timestamp: string;
  database: DatabaseHealth;
  active_modules: string[];
  phase: string;
}

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  phone?: string | null;
  role: 'GUEST' | 'RECEPTIONIST' | 'HOUSEKEEPING' | 'MAINTENANCE' | 'RESTAURANT_LAUNDRY' | 'ADMIN';
  is_active: boolean;
  preferences?: string | null;
  loyalty_points: number;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in_seconds: number;
  user: UserProfile;
}

export interface DemoAccount {
  role: string;
  email: string;
  password: string;
  description: string;
}

export interface Amenity {
  id: number;
  name: string;
  icon?: string;
  description?: string;
}

export interface RoomType {
  id: number;
  name: string;
  category: string;
  base_price: number;
  capacity: number;
  bed_type: string;
  image_url?: string;
  description?: string;
}

export interface RoomItem {
  id: number;
  room_number: string;
  room_type: RoomType;
  floor: number;
  current_status: 'AVAILABLE' | 'BOOKED' | 'OCCUPIED' | 'CLEANING' | 'INSPECTION' | 'MAINTENANCE';
  price_per_night: number;
  view_type: string;
  is_active: boolean;
  amenities: Amenity[];
  is_available: boolean;
}

export interface RoomFilterParams {
  check_in?: string;
  check_out?: string;
  category?: string;
  max_price?: number;
  guests?: number;
  available_only?: boolean;
}

export interface BookingPayload {
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  room_preference?: string;
  special_requests?: string;
  coupon_code?: string;
  payment_method?: 'CARD' | 'UPI' | 'CASH';
}

export interface BookingRecord {
  id: number;
  booking_reference: string;
  room_id: number;
  room_number: string;
  room_type_name: string;
  room_image?: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  num_nights: number;
  price_per_night: number;
  room_charges: number;
  taxes: number;
  discount_amount: number;
  total_amount: number;
  booking_status: string;
  special_requests?: string;
  created_at: string;
  guest_name?: string;
  guest_email?: string;
}

export interface CouponValidation {
  is_valid: boolean;
  code: string;
  discount_type?: string;
  discount_value?: number;
  discount_amount: number;
  final_amount: number;
  message: string;
}

export interface FrontDeskRoom {
  room_id: number;
  room_number: string;
  floor: number;
  room_type_name: string;
  price_per_night: number;
  status: string;
  current_guest_name?: string;
  current_guest_phone?: string;
  current_booking_ref?: string;
  check_in_date?: string;
  check_out_date?: string;
}

export interface HousekeepingTask {
  task_id: number;
  room_id: number;
  room_number: string;
  status: string;
  assigned_staff_name?: string;
  inspection_notes?: string;
  created_at: string;
}

export interface MaintenanceTicket {
  ticket_id: number;
  room_id: number;
  room_number: string;
  issue_title: string;
  description: string;
  priority: string;
  status: string;
  reported_by_name?: string;
  assigned_tech_name?: string;
  resolution_notes?: string;
  created_at: string;
}

export interface AdminMetrics {
  total_rooms: number;
  available_rooms: number;
  occupied_rooms: number;
  cleaning_rooms: number;
  maintenance_rooms: number;
  occupancy_percentage: number;
  total_revenue: number;
  total_bookings: number;
  active_reservations: number;
}

export interface DynamicPricingData {
  room_type_name: string;
  base_price: number;
  recommended_price: number;
  price_adjustment_pct: number;
  demand_level: 'LOW' | 'NORMAL' | 'HIGH' | 'SURGE';
  occupancy_factor: number;
  day_of_week_factor: number;
  explanation: string;
  confidence: number;
}

export interface OccupancyForecastItem {
  date: string;
  day_name: string;
  predicted_occupancy_pct: number;
  predicted_rooms_occupied: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
  demand_flag: 'LOW' | 'OPTIMAL' | 'PEAK';
}

export interface OccupancyForecastData {
  forecast_start_date: string;
  average_predicted_occupancy: number;
  peak_day: string;
  total_hotel_rooms: number;
  daily_forecasts: OccupancyForecastItem[];
  recommendations: string[];
}

export interface RoomRecommendationData {
  room_id: number;
  room_number: string;
  room_type_name: string;
  price_per_night: number;
  match_score_pct: number;
  confidence_score: number;
  recommendation_reason: string;
  predicted_satisfaction: number;
  amenities: string[];
}

export interface CancellationRiskData {
  cancellation_probability_pct: number;
  risk_tier: 'LOW' | 'MODERATE' | 'HIGH';
  key_risk_drivers: string[];
  suggested_action: string;
}

export interface SentimentNLPData {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  sentiment_score: number;
  detected_aspects: string[];
  priority_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  key_phrases: string[];
}

export interface GuestLTVData {
  predicted_annual_ltv: number;
  vip_segment: 'PLATINUM_VIP' | 'GOLD_PREMIUM' | 'SILVER_PREFERRED' | 'BRONZE_STANDARD';
  vip_badge_title: string;
  churn_risk_pct: number;
  loyalty_bonus_multiplier: number;
  recommended_vip_perks: string[];
  retention_strategy: string;
}

export interface TurnaroundOptimizationData {
  predicted_turnaround_minutes: number;
  recommended_staff_count: number;
  priority_tier: 'STANDARD' | 'HIGH_PRIORITY' | 'URGENT_RUSH';
  eco_energy_mode: string;
  estimated_energy_saved_kwh: number;
  cleaning_checklist: string[];
  turnaround_window_display: string;
}

export interface AIPredictionRecord {
  id: number;
  model_name: string;
  model_version: string;
  accuracy_metric?: number;
  created_at?: string;
}

// ==========================================
// Service Modules
// ==========================================

export const HealthService = {
  getHealth: async (): Promise<SystemHealthData> => {
    const response = await api.get<SystemHealthData>('/health/');
    return response.data;
  },
  ping: async (): Promise<{ status: string; message: string }> => {
    const response = await api.get('/health/ping');
    return response.data;
  },
};

export const AuthService = {
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/login', { email, password });
    localStorage.setItem('aura_auth_token', response.data.access_token);
    localStorage.setItem('aura_user', JSON.stringify(response.data.user));
    return response.data;
  },
  register: async (payload: {
    full_name: string;
    email: string;
    phone?: string;
    password: string;
    confirm_password: string;
    role?: string;
    preferences?: string;
  }): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/register', payload);
    localStorage.setItem('aura_auth_token', response.data.access_token);
    localStorage.setItem('aura_user', JSON.stringify(response.data.user));
    return response.data;
  },
  getMe: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/auth/me');
    localStorage.setItem('aura_user', JSON.stringify(response.data));
    return response.data;
  },
  getDemoAccounts: async (): Promise<DemoAccount[]> => {
    const response = await api.get<DemoAccount[]>('/auth/demo-accounts');
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('aura_auth_token');
    localStorage.removeItem('aura_user');
  },
  getSavedUser: (): UserProfile | null => {
    try {
      const u = localStorage.getItem('aura_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
};

export const RoomService = {
  getRooms: async (params?: RoomFilterParams): Promise<RoomItem[]> => {
    const response = await api.get<RoomItem[]>('/rooms/', { params });
    return response.data;
  },
  getRoomTypes: async (): Promise<RoomType[]> => {
    const response = await api.get<RoomType[]>('/rooms/types/all');
    return response.data;
  },
  getAmenities: async (): Promise<Amenity[]> => {
    const response = await api.get<Amenity[]>('/rooms/amenities/all');
    return response.data;
  },
  getRoomById: async (id: number): Promise<RoomItem> => {
    const response = await api.get<RoomItem>(`/rooms/${id}`);
    return response.data;
  },
};

export const BookingService = {
  createBooking: async (payload: BookingPayload): Promise<BookingRecord> => {
    const response = await api.post<BookingRecord>('/bookings/', payload);
    return response.data;
  },
  getMyBookings: async (email?: string): Promise<BookingRecord[]> => {
    const response = await api.get<BookingRecord[]>('/bookings/my-bookings', {
      params: email ? { email } : undefined,
    });
    return response.data;
  },
  getBooking: async (idOrRef: string): Promise<BookingRecord> => {
    const response = await api.get<BookingRecord>(`/bookings/${idOrRef}`);
    return response.data;
  },
  cancelBooking: async (idOrRef: string, reason?: string): Promise<BookingRecord> => {
    const response = await api.post<BookingRecord>(`/bookings/${idOrRef}/cancel`, { reason });
    return response.data;
  },
  validateCoupon: async (code: string, base_amount: number): Promise<CouponValidation> => {
    const response = await api.post<CouponValidation>('/bookings/validate-coupon', {
      code,
      base_amount,
    });
    return response.data;
  },
};

export const OperationsService = {
  getFrontDeskRooms: async (): Promise<FrontDeskRoom[]> => {
    const response = await api.get<FrontDeskRoom[]>('/operations/frontdesk/rooms');
    return response.data;
  },
  checkIn: async (bookingReference: string, notes?: string) => {
    const response = await api.post('/operations/frontdesk/checkin', {
      booking_reference: bookingReference,
      notes,
    });
    return response.data;
  },
  checkOut: async (bookingReference: string, notes?: string) => {
    const response = await api.post('/operations/frontdesk/checkout', {
      booking_reference: bookingReference,
      notes,
    });
    return response.data;
  },
  getHousekeepingTasks: async (): Promise<HousekeepingTask[]> => {
    const response = await api.get<HousekeepingTask[]>('/operations/housekeeping/tasks');
    return response.data;
  },
  updateHousekeeping: async (taskId: number, status: string, notes?: string) => {
    const response = await api.post(`/operations/housekeeping/${taskId}/update`, {
      status,
      notes,
    });
    return response.data;
  },
  getMaintenanceTickets: async (): Promise<MaintenanceTicket[]> => {
    const response = await api.get<MaintenanceTicket[]>('/operations/maintenance/tickets');
    return response.data;
  },
  createMaintenanceTicket: async (payload: {
    room_id: number;
    issue_title: string;
    description: string;
    priority?: string;
  }) => {
    const response = await api.post('/operations/maintenance/create', payload);
    return response.data;
  },
  resolveMaintenanceTicket: async (ticketId: number, resolution_notes: string) => {
    const response = await api.post(`/operations/maintenance/${ticketId}/resolve`, {
      status: 'RESOLVED',
      resolution_notes,
    });
    return response.data;
  },
  getAdminMetrics: async (): Promise<AdminMetrics> => {
    const response = await api.get<AdminMetrics>('/operations/admin/metrics');
    return response.data;
  },
};

export const AIService = {
  getModelsCatalog: async () => {
    const res = await api.get('/ai/models');
    return res.data;
  },
  getDynamicPrice: async (payload: { room_type_id: number; target_date?: string; current_occupancy_pct?: number }): Promise<DynamicPricingData> => {
    const res = await api.post<DynamicPricingData>('/ai/price', payload);
    return res.data;
  },
  getOccupancyForecast: async (days: number = 7): Promise<OccupancyForecastData> => {
    const res = await api.get<OccupancyForecastData>('/ai/occupancy', { params: { days } });
    return res.data;
  },
  getRoomRecommendations: async (payload: { budget?: number; guests?: number; stay_purpose?: string; preferred_amenities?: string[]; nights?: number }): Promise<RoomRecommendationData[]> => {
    const res = await api.post<RoomRecommendationData[]>('/ai/recommend-room', payload);
    return res.data;
  },
  recommendRoom: async (payload: { guests?: number; budget?: number; preference?: string; purpose?: string }): Promise<any> => {
    const res = await api.post<RoomRecommendationData[]>('/ai/recommend-room', {
      guests: payload.guests,
      budget: payload.budget,
      stay_purpose: payload.purpose,
    });
    const first = res.data?.[0];
    return {
      recommended_room: first ? { id: first.room_id, room_number: first.room_number, room_type_name: first.room_type_name } : null,
      match_score: first ? (first.match_score_pct || 95) / 100 : 0.94,
    };
  },
  predictCancellationRisk: async (payload: { lead_time_days: number; num_nights: number; total_amount: number; has_coupon?: boolean; payment_method?: string; guest_loyalty_points?: number }): Promise<CancellationRiskData> => {
    const res = await api.post<CancellationRiskData>('/ai/cancellation', payload);
    return res.data;
  },
  analyzeSentiment: async (text: string): Promise<SentimentNLPData> => {
    const res = await api.post<SentimentNLPData>('/ai/sentiment', { text });
    return res.data;
  },
  predictGuestLTV: async (payload: {
    stays_count: number;
    total_spend: number;
    avg_lead_time_days?: number;
    review_sentiment_score?: number;
    ancillary_spend?: number;
    cancellations_count?: number;
  }): Promise<GuestLTVData> => {
    const res = await api.post<GuestLTVData>('/ai/ltv-vip', payload);
    return res.data;
  },
  optimizeTurnaround: async (payload: {
    room_type_id: number;
    floor_number?: number;
    num_guests?: number;
    stay_duration_nights?: number;
    special_requests_count?: number;
  }): Promise<TurnaroundOptimizationData> => {
    const res = await api.post<TurnaroundOptimizationData>('/ai/turnaround', payload);
    return res.data;
  },
  getPredictionHistory: async (limit: number = 10): Promise<AIPredictionRecord[]> => {
    const res = await api.get<AIPredictionRecord[]>('/ai/history', { params: { limit } });
    return res.data;
  },
};

// ==========================================
// Phase 13 & 14 Types & Service
// ==========================================

export interface GuestReview {
  id: number;
  booking_reference: string;
  guest_name: string;
  room_number: string;
  room_type_name: string;
  rating: number;
  comment: string;
  sentiment: string;
  aspect_ratings?: {
    cleanliness?: number;
    staff?: number;
    comfort?: number;
    ai_aspects?: string[];
  } | null;
  created_at: string;
}

export interface ReviewSummary {
  total_reviews: number;
  average_rating: number;
  rating_distribution: Record<string, number>;
  sentiment_breakdown: Record<string, number>;
  aspect_averages?: Record<string, number>;
  reviews: GuestReview[];
}

export interface GuestComplaint {
  id: number;
  complaint_reference: string;
  guest_name: string;
  guest_email: string;
  room_number: string | null;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  department: string;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface GuestNotification {
  id: number;
  recipient_name: string;
  recipient_email: string;
  title: string;
  message: string;
  channel: string;
  status: 'SCHEDULED' | 'SENT' | 'FAILED' | 'READ' | 'PENDING';
  scheduled_at: string;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface SchedulerResult {
  processed_count: number;
  delivered_count: number;
  timestamp: string;
  message: string;
}

export const FeedbackService = {
  getReviewSummary: async (params?: { min_rating?: number; sentiment?: string }): Promise<ReviewSummary> => {
    const res = await api.get<ReviewSummary>('/feedback/reviews', { params });
    return res.data;
  },
  getReviews: async (params?: { min_rating?: number; sentiment?: string }): Promise<ReviewSummary> => {
    const res = await api.get<ReviewSummary>('/feedback/reviews', { params });
    return res.data;
  },
  submitReview: async (payload: {
    booking_reference: string;
    guest_email: string;
    rating: number;
    comment: string;
    cleanliness_rating?: number;
    staff_rating?: number;
    comfort_rating?: number;
  }): Promise<GuestReview> => {
    const res = await api.post<GuestReview>('/feedback/reviews', payload);
    return res.data;
  },
  getComplaints: async (params?: { status_filter?: string; priority_filter?: string }): Promise<GuestComplaint[]> => {
    const res = await api.get<GuestComplaint[]>('/feedback/complaints', { params });
    return res.data;
  },
  submitComplaint: async (payload: {
    guest_email: string;
    booking_reference?: string;
    room_number?: string;
    category: string;
    description: string;
  }): Promise<GuestComplaint> => {
    const res = await api.post<GuestComplaint>('/feedback/complaints', payload);
    return res.data;
  },
  resolveComplaint: async (
    complaintId: number,
    payload: { status: string; resolution: string }
  ): Promise<GuestComplaint> => {
    const res = await api.patch<GuestComplaint>(`/feedback/complaints/${complaintId}/resolve`, payload);
    return res.data;
  },
  getNotifications: async (params?: { email?: string; unread_only?: boolean }): Promise<GuestNotification[]> => {
    const res = await api.get<GuestNotification[]>('/feedback/notifications', { params });
    return res.data;
  },
  createNotification: async (payload: {
    recipient_email: string;
    title: string;
    message: string;
    booking_reference?: string;
    scheduled_seconds_from_now?: number;
  }): Promise<GuestNotification> => {
    const res = await api.post<GuestNotification>('/feedback/notifications', payload);
    return res.data;
  },
  runScheduler: async (): Promise<SchedulerResult> => {
    const res = await api.post<SchedulerResult>('/feedback/notifications/run-scheduler');
    return res.data;
  },
  markNotificationRead: async (notificationId: number): Promise<{ status: string; message: string }> => {
    const res = await api.patch<{ status: string; message: string }>(`/feedback/notifications/${notificationId}/read`);
    return res.data;
  },
};

export default api;


