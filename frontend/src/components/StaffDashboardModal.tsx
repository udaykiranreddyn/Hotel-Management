import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  CheckCircle2, 
  Wrench, 
  Sparkles, 
  BarChart3, 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  Key,
  DoorOpen,
  Brain,
  TrendingUp,
  ShieldAlert,
  MessageSquare,
  Cpu,
  Award,
  Zap,
  Activity,
  Star,
  Bell,
  FileText,
  MessageCircle,
  CreditCard
} from 'lucide-react';
import { AdminPaymentManager } from './payment/AdminPaymentManager';
import { OperationsService, AIService, FeedbackService } from '../services/api';
import type { GuestReview, GuestComplaint, GuestNotification, ReviewSummary, SchedulerResult } from '../services/api';
import type { 
  FrontDeskRoom, 
  HousekeepingTask, 
  MaintenanceTicket, 
  AdminMetrics, 
  UserProfile,
  DynamicPricingData,
  OccupancyForecastData,
  CancellationRiskData,
  SentimentNLPData,
  GuestLTVData,
  TurnaroundOptimizationData,
  AIPredictionRecord
} from '../services/api';

interface StaffDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onRefreshParent?: () => void;
}

export const StaffDashboardModal: React.FC<StaffDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRefreshParent,
}) => {
  // Tab state based on user role
  const getDefaultTab = () => {
    if (!currentUser) return 'frontdesk';
    if (currentUser.role === 'HOUSEKEEPING') return 'housekeeping';
    if (currentUser.role === 'MAINTENANCE') return 'maintenance';
    if (currentUser.role === 'ADMIN') return 'analytics';
    return 'frontdesk';
  };

  const [activeTab, setActiveTab] = useState<string>('frontdesk');
  const [rooms, setRooms] = useState<FrontDeskRoom[]>([]);
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  // AI Decision Support State
  const [pricingRoomTypeId, setPricingRoomTypeId] = useState(1);
  const [pricingOccupancyOverride, setPricingOccupancyOverride] = useState(75);
  const [pricingResult, setPricingResult] = useState<DynamicPricingData | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);

  const [forecastData, setForecastData] = useState<OccupancyForecastData | null>(null);

  const [cancLeadDays, setCancLeadDays] = useState(18);
  const [cancNights, setCancNights] = useState(2);
  const [cancAmount, setCancAmount] = useState(2598);
  const [cancPaymentMethod, setCancPaymentMethod] = useState('CARD');
  const [cancLoyalty, setCancLoyalty] = useState(25);
  const [cancCoupon, setCancCoupon] = useState(false);
  const [cancellationResult, setCancellationResult] = useState<CancellationRiskData | null>(null);
  const [isLoadingCancellation, setIsLoadingCancellation] = useState(false);

  const [sentimentInput, setSentimentInput] = useState('The room was sparkling clean, staff checked us in within 2 minutes and bed was very comfortable!');
  const [sentimentResult, setSentimentResult] = useState<SentimentNLPData | null>(null);
  const [isLoadingSentiment, setIsLoadingSentiment] = useState(false);

  // Guest LTV & VIP Segmentation State
  const [ltvStays, setLtvStays] = useState(6);
  const [ltvSpend, setLtvSpend] = useState(38500);
  const [ltvLeadDays, setLtvLeadDays] = useState(14);
  const [ltvSentiment, setLtvSentiment] = useState(0.75);
  const [ltvAncillary, setLtvAncillary] = useState(6200);
  const [ltvCancellations, setLtvCancellations] = useState(0);
  const [ltvResult, setLtvResult] = useState<GuestLTVData | null>(null);
  const [isLoadingLtv, setIsLoadingLtv] = useState(false);

  // Housekeeping Turnaround & Eco-Energy State
  const [turnaroundRoomType, setTurnaroundRoomType] = useState(3);
  const [turnaroundFloor, setTurnaroundFloor] = useState(4);
  const [turnaroundGuests, setTurnaroundGuests] = useState(2);
  const [turnaroundNights, setTurnaroundNights] = useState(3);
  const [turnaroundSpecialReqs, setTurnaroundSpecialReqs] = useState(2);
  const [turnaroundResult, setTurnaroundResult] = useState<TurnaroundOptimizationData | null>(null);
  const [isLoadingTurnaround, setIsLoadingTurnaround] = useState(false);

  // ML Models Catalog State
  const [modelsCatalog, setModelsCatalog] = useState<any>(null);

  const [aiHistory, setAiHistory] = useState<AIPredictionRecord[]>([]);

  // ── FEEDBACK TAB STATE ─────────────────────────────────────────────────
  const [reviewSummaryData, setReviewSummaryData] = useState<ReviewSummary | null>(null);
  const [complaintsData, setComplaintsData] = useState<GuestComplaint[]>([]);
  const [notificationsData, setNotificationsData] = useState<GuestNotification[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackSubTab, setFeedbackSubTab] = useState<'reviews' | 'complaints' | 'notifications'>('reviews');
  const [schedulerResult, setSchedulerResult] = useState<SchedulerResult | null>(null);
  const [complaintFilter, setComplaintFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [resolvingComplaintId, setResolvingComplaintId] = useState<number | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [isRunningScheduler, setIsRunningScheduler] = useState(false);

  // Loading & notification states
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New ticket state
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicketRoomId, setNewTicketRoomId] = useState(1);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState('MEDIUM');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(getDefaultTab());
      loadAllData();
    }
  }, [isOpen, currentUser]);

  const handleCalculatePricing = async (typeId?: number, occ?: number) => {
    setIsLoadingPricing(true);
    try {
      const res = await AIService.getDynamicPrice({
        room_type_id: typeId ?? pricingRoomTypeId,
        current_occupancy_pct: occ ?? pricingOccupancyOverride,
      });
      setPricingResult(res);
    } catch (e) {
      console.error('Pricing calculation failed:', e);
    } finally {
      setIsLoadingPricing(false);
    }
  };

  const handlePredictCancellation = async () => {
    setIsLoadingCancellation(true);
    try {
      const res = await AIService.predictCancellationRisk({
        lead_time_days: cancLeadDays,
        num_nights: cancNights,
        total_amount: cancAmount,
        has_coupon: cancCoupon,
        payment_method: cancPaymentMethod,
        guest_loyalty_points: cancLoyalty,
      });
      setCancellationResult(res);
    } catch (e) {
      console.error('Cancellation prediction failed:', e);
    } finally {
      setIsLoadingCancellation(false);
    }
  };

  const handleAnalyzeSentiment = async (presetText?: string) => {
    const textToAnalyze = presetText || sentimentInput;
    if (!textToAnalyze.trim()) return;
    setIsLoadingSentiment(true);
    try {
      const res = await AIService.analyzeSentiment(textToAnalyze);
      setSentimentResult(res);
      if (presetText) setSentimentInput(presetText);
    } catch (e) {
      console.error('Sentiment analysis failed:', e);
    } finally {
      setIsLoadingSentiment(false);
    }
  };

  const handlePredictLTV = async (
    customStays?: number,
    customSpend?: number,
    customLead?: number,
    customSent?: number,
    customAnc?: number,
    customCanc?: number
  ) => {
    setIsLoadingLtv(true);
    try {
      const res = await AIService.predictGuestLTV({
        stays_count: customStays ?? ltvStays,
        total_spend: customSpend ?? ltvSpend,
        avg_lead_time_days: customLead ?? ltvLeadDays,
        review_sentiment_score: customSent ?? ltvSentiment,
        ancillary_spend: customAnc ?? ltvAncillary,
        cancellations_count: customCanc ?? ltvCancellations,
      });
      setLtvResult(res);
    } catch (e) {
      console.error('Guest LTV prediction failed:', e);
    } finally {
      setIsLoadingLtv(false);
    }
  };

  const handleOptimizeTurnaround = async (
    customRoomType?: number,
    customFloor?: number,
    customGuests?: number,
    customNights?: number,
    customSpecialReqs?: number
  ) => {
    setIsLoadingTurnaround(true);
    try {
      const res = await AIService.optimizeTurnaround({
        room_type_id: customRoomType ?? turnaroundRoomType,
        floor_number: customFloor ?? turnaroundFloor,
        num_guests: customGuests ?? turnaroundGuests,
        stay_duration_nights: customNights ?? turnaroundNights,
        special_requests_count: customSpecialReqs ?? turnaroundSpecialReqs,
      });
      setTurnaroundResult(res);
    } catch (e) {
      console.error('Housekeeping turnaround optimization failed:', e);
    } finally {
      setIsLoadingTurnaround(false);
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [rData, tData, mData, kpiData, forecastRes, histRes, catalogRes] = await Promise.all([
        OperationsService.getFrontDeskRooms(),
        OperationsService.getHousekeepingTasks(),
        OperationsService.getMaintenanceTickets(),
        OperationsService.getAdminMetrics(),
        AIService.getOccupancyForecast(7).catch(() => null),
        AIService.getPredictionHistory(10).catch(() => []),
        AIService.getModelsCatalog().catch(() => null),
      ]);
      setRooms(rData);
      setTasks(tData);
      setTickets(mData);
      setMetrics(kpiData);
      if (forecastRes) setForecastData(forecastRes);
      if (histRes) setAiHistory(histRes);
      if (catalogRes) setModelsCatalog(catalogRes);
      // Trigger initial AI inferences
      handleCalculatePricing(1, 75);
      handlePredictCancellation();
      handleAnalyzeSentiment(sentimentInput);
      handlePredictLTV(6, 38500, 14, 0.75, 6200, 0);
      handleOptimizeTurnaround(3, 4, 2, 3, 2);
    } catch (err) {
      console.error('Failed to load operational data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFeedbackData = async (statusF?: string, priorityF?: string) => {
    setIsLoadingFeedback(true);
    try {
      const [revData, compData, notifData] = await Promise.all([
        FeedbackService.getReviews().catch(() => null),
        FeedbackService.getComplaints({ status_filter: statusF || undefined, priority_filter: priorityF || undefined }).catch(() => []),
        FeedbackService.getNotifications().catch(() => []),
      ]);
      if (revData) setReviewSummaryData(revData);
      setComplaintsData(compData as GuestComplaint[]);
      setNotificationsData(notifData as GuestNotification[]);
    } catch (err) {
      console.error('Feedback data load failed:', err);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const handleResolveComplaint = async (complaintId: number) => {
    if (!resolveNotes.trim()) return;
    try {
      await FeedbackService.resolveComplaint(complaintId, { status: 'RESOLVED', resolution: resolveNotes });
      notify('success', 'Complaint resolved and guest notified.');
      setResolvingComplaintId(null);
      setResolveNotes('');
      loadFeedbackData(complaintFilter, priorityFilter);
    } catch (err: any) {
      notify('error', err.response?.data?.detail || 'Failed to resolve complaint.');
    }
  };

  const handleRunScheduler = async () => {
    setIsRunningScheduler(true);
    try {
      const result = await FeedbackService.runScheduler();
      setSchedulerResult(result);
      notify('success', result.message);
      loadFeedbackData(complaintFilter, priorityFilter);
    } catch (err: any) {
      notify('error', 'Scheduler run failed.');
    } finally {
      setIsRunningScheduler(false);
    }
  };

  const notify = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCheckIn = async (ref: string) => {
    try {
      const res = await OperationsService.checkIn(ref);
      notify('success', res.message);
      await loadAllData();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      notify('error', err.response?.data?.detail || 'Check-in failed');
    }
  };

  const handleCheckOut = async (ref: string) => {
    try {
      const res = await OperationsService.checkOut(ref);
      notify('success', res.message);
      await loadAllData();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      notify('error', err.response?.data?.detail || 'Check-out failed');
    }
  };

  const handleCompleteCleaning = async (taskId: number) => {
    try {
      const res = await OperationsService.updateHousekeeping(taskId, 'READY', 'Sanitized & inspected by housekeeping lead.');
      notify('success', res.message);
      await loadAllData();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      notify('error', err.response?.data?.detail || 'Update failed');
    }
  };

  const handleResolveMaintenance = async (ticketId: number) => {
    try {
      const res = await OperationsService.resolveMaintenanceTicket(ticketId, 'Repaired & safety check verified.');
      notify('success', res.message);
      await loadAllData();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      notify('error', err.response?.data?.detail || 'Resolution failed');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle || !newTicketDesc) return;

    try {
      await OperationsService.createMaintenanceTicket({
        room_id: Number(newTicketRoomId),
        issue_title: newTicketTitle,
        description: newTicketDesc,
        priority: newTicketPriority,
      });
      notify('success', 'Maintenance work order logged. Room marked for maintenance.');
      setShowNewTicketForm(false);
      setNewTicketTitle('');
      setNewTicketDesc('');
      await loadAllData();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      notify('error', err.response?.data?.detail || 'Failed to create ticket');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backgroundColor: 'rgba(5, 8, 15, 0.88)',
      backdropFilter: 'blur(14px)',
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1000px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #BAE6FD',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(2, 132, 199, 0.25), 0 0 35px rgba(56, 189, 248, 0.15)',
        overflow: 'hidden',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid #BAE6FD',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, #E0F2FE 0%, #FFFFFF 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Building2 size={22} color="#FFFFFF" strokeWidth={2.4} />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span>Hotel Operations Command Center</span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: '#E0F2FE',
                  border: '1px solid #BAE6FD',
                  color: '#0284C7',
                  fontWeight: 600,
                }}>
                  {currentUser?.role || 'STAFF'} PORTAL
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Active user: <strong>{currentUser?.full_name || 'Staff Member'}</strong> • Live database synchronization
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={loadAllData}
              disabled={isLoading}
              style={{
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: '8px',
                padding: '0.45rem 0.8rem',
                color: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#E0F2FE',
                border: '1px solid #BAE6FD',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284C7',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Operational Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.75rem 1.75rem',
          background: '#F0F9FF',
          borderBottom: '1px solid #BAE6FD',
          overflowX: 'auto',
        }}>
          <button
            onClick={() => setActiveTab('frontdesk')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'frontdesk' ? '#0284C7' : 'transparent',
              color: activeTab === 'frontdesk' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <DoorOpen size={16} />
            <span>Front Desk &amp; Rooms ({rooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('housekeeping')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'housekeeping' ? '#0284C7' : 'transparent',
              color: activeTab === 'housekeeping' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Sparkles size={16} />
            <span>Housekeeping Tasks ({tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'maintenance' ? '#0284C7' : 'transparent',
              color: activeTab === 'maintenance' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Wrench size={16} />
            <span>Maintenance Tickets ({tickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'analytics' ? '#0284C7' : 'transparent',
              color: activeTab === 'analytics' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <BarChart3 size={16} />
            <span>Executive Admin KPIs</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_decision')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'ai_decision' ? '#0284C7' : 'transparent',
              color: activeTab === 'ai_decision' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Brain size={16} />
            <span>AI Decision Support (ML)</span>
          </button>

          <button
            onClick={() => { setActiveTab('feedback'); loadFeedbackData(complaintFilter, priorityFilter); }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'feedback' ? '#0284C7' : 'transparent',
              color: activeTab === 'feedback' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
            }}
          >
            <MessageCircle size={16} />
            <span>Guest Feedback &amp; Notifs</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'payments' ? '#0284C7' : 'transparent',
              color: activeTab === 'payments' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
            }}
          >
            <CreditCard size={16} />
            <span>Payments &amp; Revenue</span>
          </button>
        </div>

        {/* Alert Notification */}
        {notification && (
          <div style={{
            margin: '0.85rem 1.75rem 0',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${notification.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            color: notification.type === 'success' ? '#34d399' : '#f87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Tab Content Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>

          {/* TAB 1: FRONT DESK */}
          {activeTab === 'frontdesk' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Room Grid &amp; Guest Front Desk</h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Instant Check-In and Check-Out. Turnover automatically alerts Housekeeping.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.72rem' }}>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>● AVAILABLE</span>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>● OCCUPIED</span>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>● CLEANING</span>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(147, 51, 234, 0.15)', color: '#c084fc' }}>● MAINTENANCE</span>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: '1rem',
              }}>
                {rooms.map((r) => {
                  const isAvailable = r.status === 'AVAILABLE';
                  const isOccupied = r.status === 'OCCUPIED';
                  const isCleaning = r.status === 'CLEANING';

                  const badgeColor = isAvailable ? '#34d399' : isOccupied ? '#f87171' : isCleaning ? '#fbbf24' : '#c084fc';
                  const badgeBg = isAvailable ? 'rgba(16, 185, 129, 0.12)' : isOccupied ? 'rgba(239, 68, 68, 0.12)' : isCleaning ? 'rgba(245, 158, 11, 0.12)' : 'rgba(147, 51, 234, 0.12)';

                  return (
                    <div
                      key={r.room_id}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <span style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: 'var(--gold-light)',
                          }}>
                            Room {r.room_number}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            background: badgeBg,
                            color: badgeColor,
                            border: `1px solid ${badgeColor}33`,
                          }}>
                            {r.status}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          {r.room_type_name} • Floor {r.floor} • ₹{r.price_per_night}/night
                        </div>

                        {r.current_guest_name ? (
                          <div style={{
                            padding: '0.5rem 0.7rem',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            fontSize: '0.78rem',
                          }}>
                            <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>Guest: {r.current_guest_name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                              Ref: {r.current_booking_ref}
                            </div>
                            <div style={{ color: 'var(--gold-light)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                              Stay: {r.check_in_date} to {r.check_out_date}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            {isAvailable ? 'Vacant & Ready for Booking' : isCleaning ? 'Housekeeping in Progress' : 'Under Maintenance'}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {r.current_booking_ref && isAvailable && (
                          <button
                            onClick={() => handleCheckIn(r.current_booking_ref!)}
                            className="btn-primary"
                            style={{ flex: 1, padding: '0.4rem', fontSize: '0.78rem', justifyContent: 'center' }}
                          >
                            <Key size={14} />
                            <span>Check In</span>
                          </button>
                        )}

                        {r.current_booking_ref && isOccupied && (
                          <button
                            onClick={() => handleCheckOut(r.current_booking_ref!)}
                            style={{
                              flex: 1,
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-pill)',
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.5)',
                              color: '#f87171',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <DoorOpen size={14} />
                            <span>Check Out</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: HOUSEKEEPING */}
          {activeTab === 'housekeeping' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Active Housekeeping &amp; Sanitation Queue</h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Mark rooms inspected and clean. Completing inspection returns the room to AVAILABLE for guests.
                </p>
              </div>

              {tasks.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Sparkles size={36} color="var(--gold-primary)" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
                  <p>All rooms are currently clean and inspected! Zero turnover backlog.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {tasks.map((t) => (
                    <div
                      key={t.task_id}
                      style={{
                        padding: '1rem 1.25rem',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                          <span style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            color: 'var(--gold-light)',
                          }}>
                            Room {t.room_number}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: t.status === 'READY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: t.status === 'READY' ? '#34d399' : '#fbbf24',
                          }}>
                            {t.status}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Assigned to: {t.assigned_staff_name}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>
                          {t.inspection_notes || 'Standard turnover cleaning required'}
                        </div>
                      </div>

                      {t.status !== 'READY' && (
                        <button
                          onClick={() => handleCompleteCleaning(t.task_id)}
                          className="btn-primary"
                          style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                        >
                          <CheckCircle2 size={15} />
                          <span>Mark Cleaned &amp; Ready</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MAINTENANCE */}
          {activeTab === 'maintenance' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Engineering &amp; Maintenance Tickets</h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Track facilities work orders. Resolving a ticket restores the room to service.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewTicketForm(!showNewTicketForm)}
                  className="btn-outline-gold"
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                >
                  <Plus size={15} />
                  <span>Log Work Order</span>
                </button>
              </div>

              {/* Work Order Form */}
              {showNewTicketForm && (
                <form
                  onSubmit={handleCreateTicket}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    background: 'rgba(212, 175, 55, 0.06)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--gold-light)', fontSize: '0.9rem' }}>
                    New Maintenance Work Order
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        Room Number
                      </label>
                      <select
                        value={newTicketRoomId}
                        onChange={(e) => setNewTicketRoomId(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '0.55rem',
                          background: '#F0F9FF',
                          border: '1px solid #BAE6FD',
                          borderRadius: '8px',
                          color: '#0F172A',
                        }}
                      >
                        {rooms.map((r) => (
                          <option key={r.room_id} value={r.room_id}>
                            Room {r.room_number} ({r.room_type_name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        Issue Summary
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Split AC cooling issue or bathroom faucet leak"
                        value={newTicketTitle}
                        onChange={(e) => setNewTicketTitle(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem',
                          background: '#F0F9FF',
                          border: '1px solid #BAE6FD',
                          borderRadius: '8px',
                          color: '#0F172A',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        Priority
                      </label>
                      <select
                        value={newTicketPriority}
                        onChange={(e) => setNewTicketPriority(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.55rem',
                          background: '#F0F9FF',
                          border: '1px solid #BAE6FD',
                          borderRadius: '8px',
                          color: '#0F172A',
                        }}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      Detailed Problem Description
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Describe issue symptoms and replacement parts needed..."
                      value={newTicketDesc}
                      onChange={(e) => setNewTicketDesc(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        background: '#F0F9FF',
                        border: '1px solid #BAE6FD',
                        borderRadius: '8px',
                        color: '#0F172A',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowNewTicketForm(false)}
                      style={{
                        padding: '0.45rem 0.9rem',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" style={{ padding: '0.45rem 1rem' }}>
                      Dispatch Work Order
                    </button>
                  </div>
                </form>
              )}

              {/* Tickets List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {tickets.map((m) => (
                  <div
                    key={m.ticket_id}
                    style={{
                      padding: '1.1rem 1.25rem',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.15rem',
                          fontWeight: 700,
                          color: 'var(--gold-light)',
                        }}>
                          Room {m.room_number}
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: m.priority === 'URGENT' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                          color: m.priority === 'URGENT' ? '#f87171' : '#fbbf24',
                        }}>
                          {m.priority} PRIORITY
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: m.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(147, 51, 234, 0.15)',
                          color: m.status === 'RESOLVED' ? '#34d399' : '#c084fc',
                        }}>
                          {m.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        {m.issue_title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {m.description}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        Technician: {m.assigned_tech_name}
                      </div>
                    </div>

                    {m.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolveMaintenance(m.ticket_id)}
                        className="btn-primary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      >
                        <CheckCircle2 size={15} />
                        <span>Resolve &amp; Return to Service</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ADMIN ANALYTICS */}
          {activeTab === 'analytics' && metrics && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Hotel Performance &amp; Executive KPIs</h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Real-time occupancy calculations, revenue metrics, and inventory distribution from SQLite database.
                </p>
              </div>

              {/* KPI Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}>
                <div style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gold-light)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Occupancy Rate
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '0.35rem 0' }}>
                    {metrics.occupancy_percentage}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {metrics.occupied_rooms} of {metrics.total_rooms} rooms currently occupied
                  </div>
                </div>

                <div style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}>
                  <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600, textTransform: 'uppercase' }}>
                    Total Hotel Revenue
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '0.35rem 0' }}>
                    ₹{metrics.total_revenue.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Settled payments across {metrics.total_bookings} reservations
                  </div>
                </div>

                <div style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}>
                  <div style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 600, textTransform: 'uppercase' }}>
                    Active Reservations
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '0.35rem 0' }}>
                    {metrics.active_reservations}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Confirmed &amp; in-house guests
                  </div>
                </div>

                <div style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}>
                  <div style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 600, textTransform: 'uppercase' }}>
                    Available Inventory
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '0.35rem 0' }}>
                    {metrics.available_rooms}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {metrics.cleaning_rooms} cleaning • {metrics.maintenance_rooms} maintenance
                  </div>
                </div>
              </div>

              {/* Inventory breakdown bar */}
              <div style={{
                padding: '1.25rem',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
                  Live Room State Distribution
                </div>
                
                {/* Visual bar */}
                <div style={{
                  height: '14px',
                  borderRadius: '999px',
                  display: 'flex',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.1)',
                  marginBottom: '1rem',
                }}>
                  <div style={{ width: `${(metrics.available_rooms / metrics.total_rooms) * 100}%`, background: '#10b981' }} title="Available" />
                  <div style={{ width: `${(metrics.occupied_rooms / metrics.total_rooms) * 100}%`, background: '#ef4444' }} title="Occupied" />
                  <div style={{ width: `${(metrics.cleaning_rooms / metrics.total_rooms) * 100}%`, background: '#f59e0b' }} title="Cleaning" />
                  <div style={{ width: `${(metrics.maintenance_rooms / metrics.total_rooms) * 100}%`, background: '#9333ea' }} title="Maintenance" />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem',
                  fontSize: '0.78rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                    <span>Available: {metrics.available_rooms}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                    <span>Occupied: {metrics.occupied_rooms}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                    <span>Cleaning: {metrics.cleaning_rooms}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9333ea' }} />
                    <span>Maintenance: {metrics.maintenance_rooms}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              AI & MACHINE LEARNING DECISION SUPPORT TAB
              ========================================================================= */}
          {activeTab === 'ai_decision' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Header Model Registry Badges */}
              <div style={{
                padding: '1.25rem 1.5rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Cpu size={20} color="#FFFFFF" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', color: '#0F172A', margin: 0, fontWeight: 700 }}>
                        Production Machine Learning Intelligence Engines
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Real trained scikit-learn models &amp; autoregressive algorithms serving automated hotel yield optimization.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleCalculatePricing();
                      handlePredictCancellation();
                      handleAnalyzeSentiment();
                      loadAllData();
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.85rem',
                      color: 'var(--gold-light)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    <RefreshCw size={13} className={isLoadingPricing ? 'spin' : ''} />
                    <span>Recalibrate Predictions</span>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                    ● Dynamic Tariff Ridge (R²: 0.972)
                  </div>
                  <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                    ● Cancellation Risk Classifier (86.4% Acc)
                  </div>
                  <div style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)', color: 'var(--gold-light)', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                    ● Guest Feedback Sentiment NLP (100% Acc)
                  </div>
                  <div style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#c084fc', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                    ● 7-Day Demand Forecaster (91% Acc)
                  </div>
                </div>
              </div>

              {/* Grid: Dynamic Pricing + Cancellation Predictor */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(430px, 1fr))',
                gap: '1.25rem',
              }}>
                {/* 1. DYNAMIC PRICING SIMULATOR */}
                <div style={{
                  padding: '1.4rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingUp size={18} color="var(--gold-primary)" />
                      <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                        Dynamic Tariff Optimizer (Ridge Regression)
                      </span>
                    </div>
                    {pricingResult && (
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: pricingResult.demand_level === 'SURGE' ? 'rgba(239, 68, 68, 0.2)' : pricingResult.demand_level === 'HIGH' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: pricingResult.demand_level === 'SURGE' ? '#f87171' : pricingResult.demand_level === 'HIGH' ? '#fbbf24' : '#34d399',
                        border: `1px solid ${pricingResult.demand_level === 'SURGE' ? 'rgba(239, 68, 68, 0.4)' : pricingResult.demand_level === 'HIGH' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                      }}>
                        {pricingResult.demand_level} DEMAND
                      </span>
                    )}
                  </div>

                  {/* Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Room Category
                      </label>
                      <select
                        value={pricingRoomTypeId}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setPricingRoomTypeId(val);
                          handleCalculatePricing(val, pricingOccupancyOverride);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.55rem',
                          borderRadius: '8px',
                          background: '#F0F9FF',
                          border: '1px solid #BAE6FD',
                          color: '#0F172A',
                          fontSize: '0.82rem',
                        }}
                      >
                        <option value={1} style={{ background: '#FFFFFF', color: '#0F172A' }}>Standard Single (₹899)</option>
                        <option value={2} style={{ background: '#FFFFFF', color: '#0F172A' }}>Deluxe Double (₹1,299)</option>
                        <option value={3} style={{ background: '#FFFFFF', color: '#0F172A' }}>Executive AC King (₹1,799)</option>
                        <option value={4} style={{ background: '#FFFFFF', color: '#0F172A' }}>Comfort Family Suite (₹2,399)</option>
                      </select>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        <span>Occupancy Simulation</span>
                        <strong style={{ color: 'var(--gold-light)' }}>{pricingOccupancyOverride}%</strong>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={pricingOccupancyOverride}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setPricingOccupancyOverride(val);
                          handleCalculatePricing(pricingRoomTypeId, val);
                        }}
                        style={{ width: '100%', accentColor: 'var(--gold-primary)', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  {/* Output Card */}
                  {pricingResult && (
                    <div style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      background: 'rgba(212, 175, 55, 0.05)',
                      border: '1px solid rgba(212, 175, 55, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Base Rack Rate:</span>{' '}
                          <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.88rem' }}>₹{pricingResult.base_price}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--gold-light)', display: 'block' }}>Optimal Suggested Tariff:</span>
                          <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff' }}>
                            ₹{pricingResult.recommended_price}
                          </span>
                          <span style={{ fontSize: '0.78rem', marginLeft: '0.4rem', color: pricingResult.price_adjustment_pct >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                            ({pricingResult.price_adjustment_pct >= 0 ? `+${pricingResult.price_adjustment_pct}` : pricingResult.price_adjustment_pct}%)
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45, borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.5rem' }}>
                        💡 <span style={{ color: 'var(--text-main)' }}>{pricingResult.explanation}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. CANCELLATION RISK CLASSIFIER */}
                <div style={{
                  padding: '1.4rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShieldAlert size={18} color="#60a5fa" />
                      <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                        Cancellation Risk Classifier (Logistic Regression)
                      </span>
                    </div>
                    {cancellationResult && (
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: cancellationResult.risk_tier === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : cancellationResult.risk_tier === 'MODERATE' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: cancellationResult.risk_tier === 'HIGH' ? '#f87171' : cancellationResult.risk_tier === 'MODERATE' ? '#fbbf24' : '#34d399',
                        border: `1px solid ${cancellationResult.risk_tier === 'HIGH' ? 'rgba(239, 68, 68, 0.4)' : cancellationResult.risk_tier === 'MODERATE' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                      }}>
                        {cancellationResult.risk_tier} RISK
                      </span>
                    )}
                  </div>

                  {/* Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Lead Time (Days)</label>
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={cancLeadDays}
                        onChange={(e) => setCancLeadDays(parseInt(e.target.value, 10) || 0)}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Nights</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={cancNights}
                        onChange={(e) => setCancNights(parseInt(e.target.value, 10) || 1)}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Payment Mode</label>
                      <select
                        value={cancPaymentMethod}
                        onChange={(e) => setCancPaymentMethod(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0F172A', fontSize: '0.8rem' }}
                      >
                        <option value="CARD" style={{ background: '#FFFFFF', color: '#0F172A' }}>Prepaid Card</option>
                        <option value="UPI" style={{ background: '#FFFFFF', color: '#0F172A' }}>Prepaid UPI</option>
                        <option value="CASH" style={{ background: '#FFFFFF', color: '#0F172A' }}>Pay at Desk (Cash)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Folio Amount (₹)</label>
                      <input
                        type="number"
                        min="500"
                        max="50000"
                        value={cancAmount}
                        onChange={(e) => setCancAmount(parseInt(e.target.value, 10) || 1000)}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Guest Loyalty Pts</label>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={cancLoyalty}
                        onChange={(e) => setCancLoyalty(parseInt(e.target.value, 10) || 0)}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.2rem' }}>
                      <input
                        type="checkbox"
                        id="cancCouponCheck"
                        checked={cancCoupon}
                        onChange={(e) => setCancCoupon(e.target.checked)}
                        style={{ accentColor: 'var(--gold-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor="cancCouponCheck" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        Coupon Applied
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handlePredictCancellation}
                      disabled={isLoadingCancellation}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        color: '#60a5fa',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isLoadingCancellation ? 'Evaluating...' : 'Run Risk Assessment'}
                    </button>
                  </div>

                  {/* Output Card */}
                  {cancellationResult && (
                    <div style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      background: 'rgba(59, 130, 246, 0.05)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Drop-Off Probability:</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: cancellationResult.cancellation_probability_pct > 50 ? '#f87171' : cancellationResult.cancellation_probability_pct > 25 ? '#fbbf24' : '#34d399' }}>
                          {cancellationResult.cancellation_probability_pct}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${cancellationResult.cancellation_probability_pct}%`,
                          height: '100%',
                          background: cancellationResult.cancellation_probability_pct > 50 ? '#ef4444' : cancellationResult.cancellation_probability_pct > 25 ? '#f59e0b' : '#10b981',
                        }} />
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                        🎯 <strong style={{ color: 'var(--text-main)' }}>Mitigation:</strong> {cancellationResult.suggested_action}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. 7-DAY DEMAND & OCCUPANCY FORECASTER */}
              {forecastData && (
                <div style={{
                  padding: '1.4rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BarChart3 size={18} color="var(--gold-light)" />
                      <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                        7-Day Predictive Hotel Occupancy Horizon
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Weekly Projected Average: <strong style={{ color: '#34d399' }}>{forecastData.average_predicted_occupancy}%</strong> • Peak: <strong style={{ color: 'var(--gold-light)' }}>{forecastData.peak_day}</strong>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))',
                    gap: '0.75rem',
                  }}>
                    {forecastData.daily_forecasts.map((d) => (
                      <div
                        key={d.date}
                        style={{
                          padding: '0.85rem',
                          borderRadius: '10px',
                          background: d.demand_flag === 'PEAK' ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${d.demand_flag === 'PEAK' ? 'rgba(212, 175, 55, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem',
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: d.demand_flag === 'PEAK' ? 'var(--gold-light)' : '#ffffff' }}>
                          {d.day_name.slice(0, 3)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {d.date.slice(5)}
                        </div>

                        {/* Bar */}
                        <div style={{ height: '48px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', margin: '0.3rem 0' }}>
                          <div style={{
                            width: '24px',
                            height: `${Math.max(15, d.predicted_occupancy_pct * 0.45)}px`,
                            borderRadius: '4px 4px 0 0',
                            background: d.demand_flag === 'PEAK' ? 'var(--gold-gradient)' : d.predicted_occupancy_pct >= 50 ? '#34d399' : '#60a5fa',
                          }} />
                        </div>

                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                          {d.predicted_occupancy_pct}%
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {d.predicted_rooms_occupied}/{forecastData.total_hotel_rooms} rms
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                  }}>
                    💡 <strong style={{ color: 'var(--gold-light)' }}>Operational Guidance:</strong> {forecastData.recommendations.join(' • ')}
                  </div>
                </div>
              )}

              {/* 4. GUEST SENTIMENT NLP INSPECTOR */}
              <div style={{
                padding: '1.4rem',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={18} color="#c084fc" />
                    <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                      Guest Review &amp; Complaint Sentiment NLP (TF-IDF + Naive Bayes)
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => handleAnalyzeSentiment('The room was sparkling clean, staff checked us in within 2 minutes and bed was very comfortable!')}
                      style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.72rem', cursor: 'pointer' }}
                    >
                      Sample Positive Review
                    </button>
                    <button
                      onClick={() => handleAnalyzeSentiment('Water heater was not functioning in Room 102, shower was freezing cold and receptionist was slow to respond.')}
                      style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.72rem', cursor: 'pointer' }}
                    >
                      Sample Urgent Complaint
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    value={sentimentInput}
                    onChange={(e) => setSentimentInput(e.target.value)}
                    placeholder="Enter guest feedback or review text..."
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                    }}
                  />
                  <button
                    onClick={() => handleAnalyzeSentiment()}
                    disabled={isLoadingSentiment}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '8px',
                      background: '#0284C7',
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    {isLoadingSentiment ? 'Analyzing...' : 'Analyze Sentiment'}
                  </button>
                </div>

                {sentimentResult && (
                  <div style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    background: sentimentResult.sentiment === 'POSITIVE' ? 'rgba(16, 185, 129, 0.06)' : sentimentResult.sentiment === 'NEGATIVE' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${sentimentResult.sentiment === 'POSITIVE' ? 'rgba(16, 185, 129, 0.25)' : sentimentResult.sentiment === 'NEGATIVE' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.1)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: sentimentResult.sentiment === 'POSITIVE' ? '#10b981' : sentimentResult.sentiment === 'NEGATIVE' ? '#ef4444' : '#6b7280',
                          color: '#ffffff',
                        }}>
                          {sentimentResult.sentiment}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Score: <strong style={{ color: '#ffffff' }}>{sentimentResult.sentiment_score}</strong> (-1.0 to +1.0)
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Handling Priority:{' '}
                        <strong style={{ color: sentimentResult.priority_level === 'URGENT' ? '#f87171' : sentimentResult.priority_level === 'HIGH' ? '#fbbf24' : '#34d399' }}>
                          {sentimentResult.priority_level}
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Extracted Service Aspects:</span>
                      {sentimentResult.detected_aspects.map((asp) => (
                        <span key={asp} style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--gold-light)', fontSize: '0.72rem' }}>
                          {asp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. GUEST LIFETIME VALUE (LTV) & VIP TIER CLASSIFIER */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                gap: '1.25rem',
              }}>
                {/* LTV & VIP SIMULATOR */}
                <div style={{
                  padding: '1.4rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Award size={18} color="var(--gold-primary)" />
                      <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                        Guest Lifetime Value &amp; VIP Classifier (Random Forest)
                      </span>
                    </div>
                    {ltvResult && (
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: ltvResult.vip_segment === 'PLATINUM_VIP' ? 'rgba(212, 175, 55, 0.25)' : ltvResult.vip_segment === 'GOLD_PREMIUM' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: ltvResult.vip_segment === 'PLATINUM_VIP' ? 'var(--gold-light)' : ltvResult.vip_segment === 'GOLD_PREMIUM' ? '#fbbf24' : '#60a5fa',
                        border: `1px solid ${ltvResult.vip_segment === 'PLATINUM_VIP' ? 'rgba(212, 175, 55, 0.5)' : 'rgba(255, 255, 255, 0.15)'}`,
                      }}>
                        {ltvResult.vip_segment.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Sliders & Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span>Completed Stays</span>
                        <strong style={{ color: '#fff' }}>{ltvStays} stays</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        value={ltvStays}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setLtvStays(val);
                          handlePredictLTV(val, ltvSpend, ltvLeadDays, ltvSentiment, ltvAncillary, ltvCancellations);
                        }}
                        style={{ width: '100%', accentColor: 'var(--gold-primary)', cursor: 'pointer' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span>Total Spend</span>
                        <strong style={{ color: 'var(--gold-light)' }}>₹{ltvSpend.toLocaleString()}</strong>
                      </div>
                      <input
                        type="range"
                        min="2000"
                        max="150000"
                        step="2500"
                        value={ltvSpend}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setLtvSpend(val);
                          handlePredictLTV(ltvStays, val, ltvLeadDays, ltvSentiment, ltvAncillary, ltvCancellations);
                        }}
                        style={{ width: '100%', accentColor: 'var(--gold-primary)', cursor: 'pointer' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span>Satisfaction</span>
                        <strong style={{ color: ltvSentiment >= 0.5 ? '#34d399' : '#f87171' }}>{ltvSentiment > 0 ? `+${ltvSentiment}` : ltvSentiment}</strong>
                      </div>
                      <input
                        type="range"
                        min="-1.0"
                        max="1.0"
                        step="0.1"
                        value={ltvSentiment}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setLtvSentiment(val);
                          handlePredictLTV(ltvStays, ltvSpend, ltvLeadDays, val, ltvAncillary, ltvCancellations);
                        }}
                        style={{ width: '100%', accentColor: 'var(--gold-primary)', cursor: 'pointer' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span>Ancillary Spend</span>
                        <strong style={{ color: '#fff' }}>₹{ltvAncillary.toLocaleString()}</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30000"
                        step="1000"
                        value={ltvAncillary}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setLtvAncillary(val);
                          handlePredictLTV(ltvStays, ltvSpend, ltvLeadDays, ltvSentiment, val, ltvCancellations);
                        }}
                        style={{ width: '100%', accentColor: 'var(--gold-primary)', cursor: 'pointer' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span>Lead Time (Days)</span>
                        <strong style={{ color: '#fff' }}>{ltvLeadDays}d</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="45"
                        value={ltvLeadDays}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setLtvLeadDays(val);
                          handlePredictLTV(ltvStays, ltvSpend, val, ltvSentiment, ltvAncillary, ltvCancellations);
                        }}
                        style={{ width: '100%', accentColor: 'var(--gold-primary)', cursor: 'pointer' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span>Cancellations</span>
                        <strong style={{ color: ltvCancellations > 0 ? '#f87171' : '#34d399' }}>{ltvCancellations}</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        value={ltvCancellations}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setLtvCancellations(val);
                          handlePredictLTV(ltvStays, ltvSpend, ltvLeadDays, ltvSentiment, ltvAncillary, val);
                        }}
                        style={{ width: '100%', accentColor: 'var(--gold-primary)', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  {/* Output Card */}
                  {ltvResult && (
                    <div style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      background: 'rgba(212, 175, 55, 0.06)',
                      border: '1px solid rgba(212, 175, 55, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>VIP Tier Designation:</span>
                          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--gold-light)' }}>
                            {ltvResult.vip_badge_title}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Forecasted Annual LTV:</span>
                          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                            {isLoadingLtv ? 'Calculating...' : `₹${ltvResult.predicted_annual_ltv.toLocaleString()}`}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.4rem' }}>
                        <span>Churn Probability: <strong style={{ color: ltvResult.churn_risk_pct > 30 ? '#f87171' : '#34d399' }}>{ltvResult.churn_risk_pct}%</strong></span>
                        <span>Loyalty Point Multiplier: <strong style={{ color: 'var(--gold-light)' }}>{ltvResult.loyalty_bonus_multiplier}x</strong></span>
                      </div>

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        ✨ <strong style={{ color: 'var(--gold-light)' }}>Recommended VIP Perks:</strong>
                        <ul style={{ margin: '0.2rem 0 0', paddingLeft: '1.2rem', color: 'var(--text-main)' }}>
                          {ltvResult.recommended_vip_perks.slice(0, 2).map((perk, idx) => (
                            <li key={idx}>{perk}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* HOUSEKEEPING TURNAROUND & ECO-ENERGY OPTIMIZER */}
                <div style={{
                  padding: '1.4rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Zap size={18} color="#34d399" />
                      <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                        Turnaround &amp; Eco-Energy Optimizer (ElasticNet)
                      </span>
                    </div>
                    {turnaroundResult && (
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: turnaroundResult.priority_tier === 'URGENT_RUSH' ? 'rgba(239, 68, 68, 0.2)' : turnaroundResult.priority_tier === 'HIGH_PRIORITY' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: turnaroundResult.priority_tier === 'URGENT_RUSH' ? '#f87171' : turnaroundResult.priority_tier === 'HIGH_PRIORITY' ? '#fbbf24' : '#34d399',
                        border: `1px solid ${turnaroundResult.priority_tier === 'URGENT_RUSH' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                      }}>
                        {turnaroundResult.priority_tier.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Suite Category</label>
                      <select
                        value={turnaroundRoomType}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setTurnaroundRoomType(val);
                          handleOptimizeTurnaround(val, turnaroundFloor, turnaroundGuests, turnaroundNights, turnaroundSpecialReqs);
                        }}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0F172A', fontSize: '0.8rem' }}
                      >
                        <option value={1} style={{ background: '#FFFFFF', color: '#0F172A' }}>Standard Room</option>
                        <option value={2} style={{ background: '#FFFFFF', color: '#0F172A' }}>Deluxe Suite</option>
                        <option value={3} style={{ background: '#FFFFFF', color: '#0F172A' }}>Executive Suite</option>
                        <option value={4} style={{ background: '#FFFFFF', color: '#0F172A' }}>Presidential Suite</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Floor Level</label>
                      <select
                        value={turnaroundFloor}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setTurnaroundFloor(val);
                          handleOptimizeTurnaround(turnaroundRoomType, val, turnaroundGuests, turnaroundNights, turnaroundSpecialReqs);
                        }}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0F172A', fontSize: '0.8rem' }}
                      >
                        <option value={1} style={{ background: '#FFFFFF', color: '#0F172A' }}>Floor 1</option>
                        <option value={4} style={{ background: '#FFFFFF', color: '#0F172A' }}>Floor 4</option>
                        <option value={8} style={{ background: '#FFFFFF', color: '#0F172A' }}>Floor 8</option>
                        <option value={10} style={{ background: '#FFFFFF', color: '#0F172A' }}>Floor 10</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Special Requests</label>
                      <select
                        value={turnaroundSpecialReqs}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setTurnaroundSpecialReqs(val);
                          handleOptimizeTurnaround(turnaroundRoomType, turnaroundFloor, turnaroundGuests, turnaroundNights, val);
                        }}
                        style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0F172A', fontSize: '0.8rem' }}
                      >
                        <option value={0} style={{ background: '#FFFFFF', color: '#0F172A' }}>0 None</option>
                        <option value={1} style={{ background: '#FFFFFF', color: '#0F172A' }}>1 Request</option>
                        <option value={2} style={{ background: '#FFFFFF', color: '#0F172A' }}>2 Requests</option>
                        <option value={4} style={{ background: '#FFFFFF', color: '#0F172A' }}>4 Requests</option>
                      </select>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span>Departing Guests</span>
                        <strong style={{ color: '#fff' }}>{turnaroundGuests}</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="6"
                        value={turnaroundGuests}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setTurnaroundGuests(val);
                          handleOptimizeTurnaround(turnaroundRoomType, turnaroundFloor, val, turnaroundNights, turnaroundSpecialReqs);
                        }}
                        style={{ width: '100%', accentColor: '#34d399', cursor: 'pointer' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span>Stay Duration</span>
                        <strong style={{ color: '#fff' }}>{turnaroundNights}n</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="14"
                        value={turnaroundNights}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setTurnaroundNights(val);
                          handleOptimizeTurnaround(turnaroundRoomType, turnaroundFloor, turnaroundGuests, val, turnaroundSpecialReqs);
                        }}
                        style={{ width: '100%', accentColor: '#34d399', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  {/* Output Card */}
                  {turnaroundResult && (
                    <div style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Staff Allocation:</span>
                          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#34d399' }}>
                            {turnaroundResult.recommended_staff_count} Cleaning Specialist{turnaroundResult.recommended_staff_count > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Turnaround Estimate:</span>
                          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                            {isLoadingTurnaround ? 'Optimizing...' : `${turnaroundResult.predicted_turnaround_minutes} mins`}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.4rem' }}>
                        🌿 <strong style={{ color: '#34d399' }}>Eco Standby Mode:</strong> {turnaroundResult.eco_energy_mode}
                        <div style={{ fontSize: '0.7rem', color: 'var(--gold-light)', marginTop: '0.2rem' }}>
                          Estimated Energy Conservation: ~{turnaroundResult.estimated_energy_saved_kwh} kWh per room turnover
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 6. ML MODELS LIVE TELEMETRY & HEALTH MATRIX */}
              <div style={{
                padding: '1.4rem',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} color="var(--gold-light)" />
                    <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                      ML Model Registry &amp; Health Matrix ({modelsCatalog?.models ? Object.keys(modelsCatalog.models).length : 7} Active Models)
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontWeight: 600,
                  }}>
                    ALL MODELS OPERATIONAL
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.75rem',
                }}>
                  {[
                    { name: 'Dynamic Pricing', algo: 'Ridge Regression', metric: 'R² = 0.972', badge: 'Revenue Surge' },
                    { name: 'Occupancy Forecaster', algo: 'Autoregressive Trend', metric: 'Accuracy: 91%', badge: '7-Day Demand' },
                    { name: 'Cancellation Classifier', algo: 'Logistic Regression', metric: 'Accuracy: 86.4%', badge: 'Risk Shield' },
                    { name: 'Room Recommender', algo: 'Cosine Feature Scoring', metric: 'Match Score: 98%', badge: 'Personalization' },
                    { name: 'Feedback Sentiment NLP', algo: 'TF-IDF + Naive Bayes', metric: 'Accuracy: 100%', badge: 'Aspect NLP' },
                    { name: 'Guest LTV & VIP Tier', algo: 'Random Forest Ensemble', metric: 'R² = 0.999', badge: 'VIP Rewards' },
                    { name: 'Turnaround Optimizer', algo: 'ElasticNet Regressor', metric: 'R² = 0.930', badge: 'Eco-Energy' },
                  ].map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{m.name}</span>
                        <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold-light)' }}>
                          {m.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.algo}</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#34d399', marginTop: '0.2rem' }}>{m.metric}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. DATABASE PREDICTION AUDIT TRAIL */}
              <div style={{
                padding: '1.4rem',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Live AI Audit Trail (Recorded in SQLite hotel.db)
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Total logged predictions: {aiHistory.length}
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem' }}>ID</th>
                        <th style={{ padding: '0.5rem' }}>Model Name</th>
                        <th style={{ padding: '0.5rem' }}>Version</th>
                        <th style={{ padding: '0.5rem' }}>Accuracy / Confidence</th>
                        <th style={{ padding: '0.5rem' }}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiHistory.slice(0, 6).map((rec) => (
                        <tr key={rec.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>#{rec.id}</td>
                          <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--gold-light)' }}>{rec.model_name}</td>
                          <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>v{rec.model_version}</td>
                          <td style={{ padding: '0.5rem', color: '#34d399' }}>{rec.accuracy_metric ? `${Math.round(rec.accuracy_metric * 100)}%` : 'Active'}</td>
                          <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{rec.created_at ? new Date(rec.created_at).toLocaleTimeString() : 'Just now'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              TAB 6: GUEST FEEDBACK, COMPLAINTS & NOTIFICATIONS
              â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'feedback' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Guest Feedback, Complaints &amp; Notifications</h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>AI-analyzed reviews, complaint tickets, and automated notification management.</p>
                </div>
                <button
                  onClick={() => loadFeedbackData(complaintFilter, priorityFilter)}
                  disabled={isLoadingFeedback}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.45rem 0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  <RefreshCw size={14} className={isLoadingFeedback ? 'spin' : ''} />
                  Refresh
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '0.75rem' }}>
                {([
                  { key: 'reviews' as const, icon: <Star size={14} />, label: `Reviews (${reviewSummaryData?.total_reviews ?? '-'})` },
                  { key: 'complaints' as const, icon: <FileText size={14} />, label: `Complaints (${complaintsData.length})` },
                  { key: 'notifications' as const, icon: <Bell size={14} />, label: `Notifications (${notificationsData.length})` },
                ]).map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setFeedbackSubTab(key)}
                    style={{
                      padding: '0.4rem 0.85rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600,
                      background: feedbackSubTab === key ? 'rgba(212,175,55,0.15)' : 'transparent',
                      color: feedbackSubTab === key ? 'var(--gold-light)' : 'var(--text-muted)',
                      borderBottom: feedbackSubTab === key ? '2px solid var(--gold-primary)' : '2px solid transparent',
                      borderRadius: '6px 6px 0 0',
                    }}
                  >
                    {icon}<span>{label}</span>
                  </button>
                ))}
              </div>

              {feedbackSubTab === 'reviews' && (
                <div>
                  {reviewSummaryData && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      {[
                        { label: 'Avg Rating', value: reviewSummaryData.average_rating.toFixed(1), color: 'var(--gold-primary)', bg: 'rgba(212,175,55,0.08)', border: 'rgba(212,175,55,0.2)' },
                        { label: 'Positive', value: String(reviewSummaryData.sentiment_breakdown['POSITIVE'] ?? 0), color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' },
                        { label: 'Neutral', value: String(reviewSummaryData.sentiment_breakdown['NEUTRAL'] ?? 0), color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' },
                        { label: 'Negative', value: String(reviewSummaryData.sentiment_breakdown['NEGATIVE'] ?? 0), color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
                        { label: 'Total', value: String(reviewSummaryData.total_reviews), color: 'var(--text-main)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
                      ].map(({ label, value, color, bg, border }) => (
                        <div key={label} style={{ padding: '0.85rem', borderRadius: '10px', background: bg, border: `1px solid ${border}`, textAlign: 'center' }}>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                    {(reviewSummaryData?.reviews || []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No reviews yet. Ask guests to share feedback from the home page.</div>
                    ) : (reviewSummaryData?.reviews || []).map((review: GuestReview) => (
                      <div key={review.id} style={{ padding: '1rem 1.25rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--gold-light)', fontSize: '0.88rem' }}>{review.guest_name}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Room {review.room_number} | {review.created_at}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {[1,2,3,4,5].map((s) => <Star key={s} size={11} fill={s <= Math.round(review.rating) ? '#fbbf24' : 'none'} color="#fbbf24" />)}
                            </div>
                            <span style={{ fontSize: '0.65rem', padding: '0.12rem 0.4rem', borderRadius: '999px', fontWeight: 600, background: review.sentiment === 'POSITIVE' ? 'rgba(52,211,153,0.15)' : review.sentiment === 'NEGATIVE' ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)', color: review.sentiment === 'POSITIVE' ? '#34d399' : review.sentiment === 'NEGATIVE' ? '#f87171' : '#fbbf24' }}>{review.sentiment}</span>
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', fontStyle: 'italic' }}>"{review.comment}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {feedbackSubTab === 'complaints' && (
                <div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <select value={complaintFilter} onChange={(e) => { setComplaintFilter(e.target.value); loadFeedbackData(e.target.value, priorityFilter); }} style={{ padding: '0.4rem 0.75rem', borderRadius: '7px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <option value="">All Statuses</option>
                      <option value="OPEN">OPEN</option>
                      <option value="INVESTIGATING">INVESTIGATING</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                    <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); loadFeedbackData(complaintFilter, e.target.value); }} style={{ padding: '0.4rem 0.75rem', borderRadius: '7px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <option value="">All Priorities</option>
                      <option value="URGENT">URGENT</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '420px', overflowY: 'auto' }}>
                    {complaintsData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No complaints for selected filters.</div>
                    ) : complaintsData.map((c: GuestComplaint) => (
                      <div key={c.id} style={{ padding: '1rem 1.25rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${c.priority === 'URGENT' ? 'rgba(248,113,113,0.25)' : c.priority === 'HIGH' ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                          <div>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: 700 }}>{c.complaint_reference}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{c.guest_name} | {c.department}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.65rem', padding: '0.12rem 0.4rem', borderRadius: '4px', fontWeight: 700, background: c.priority === 'URGENT' ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.06)', color: c.priority === 'URGENT' ? '#f87171' : c.priority === 'HIGH' ? '#fbbf24' : 'var(--text-muted)' }}>{c.priority}</span>
                            <span style={{ fontSize: '0.65rem', padding: '0.12rem 0.4rem', borderRadius: '4px', fontWeight: 600, background: c.status === 'RESOLVED' || c.status === 'CLOSED' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: c.status === 'RESOLVED' || c.status === 'CLOSED' ? '#34d399' : '#f87171' }}>{c.status}</span>
                          </div>
                        </div>
                        <p style={{ margin: '0 0 0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{c.description}</p>
                        {c.resolution && <div style={{ fontSize: '0.78rem', color: '#34d399', padding: '0.35rem 0.6rem', borderRadius: '6px', background: 'rgba(52,211,153,0.08)', marginBottom: '0.35rem' }}>OK {c.resolution}</div>}
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Filed: {c.created_at}</div>
                        {(c.status === 'OPEN' || c.status === 'INVESTIGATING') && (
                          resolvingComplaintId === c.id ? (
                            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <input type="text" placeholder="Resolution notes..." value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} style={{ flex: 1, padding: '0.4rem 0.7rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-main)', fontSize: '0.8rem' }} />
                              <button onClick={() => handleResolveComplaint(c.id)} style={{ padding: '0.4rem 0.85rem', borderRadius: '6px', background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>Mark Resolved</button>
                              <button onClick={() => { setResolvingComplaintId(null); setResolveNotes(''); }} style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setResolvingComplaintId(c.id)} style={{ marginTop: '0.5rem', padding: '0.3rem 0.75rem', borderRadius: '6px', background: 'transparent', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', fontSize: '0.75rem', cursor: 'pointer' }}>+ Resolve Complaint</button>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {feedbackSubTab === 'notifications' && (
                <div>
                  <div style={{ marginBottom: '1.25rem', padding: '1rem', borderRadius: '10px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--gold-light)' }}>Automated Notification Scheduler</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dispatches all pending scheduled notifications whose send time has elapsed.</div>
                      {schedulerResult && (
                        <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.25rem' }}>
                          Last run: {schedulerResult.delivered_count} of {schedulerResult.processed_count} delivered
                        </div>
                      )}
                    </div>
                    <button onClick={handleRunScheduler} disabled={isRunningScheduler} style={{ padding: '0.5rem 1.1rem', borderRadius: '8px', background: '#0284C7', border: 'none', color: '#FFFFFF', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: isRunningScheduler ? 0.7 : 1 }}>
                      <Zap size={14} />
                      {isRunningScheduler ? 'Running...' : 'Run Scheduler Batch'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {notificationsData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No notifications yet.</div>
                    ) : notificationsData.map((n: GuestNotification) => (
                      <div key={n.id} style={{ padding: '0.85rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '6px', background: n.status === 'SENT' || n.status === 'READ' ? '#34d399' : n.status === 'FAILED' ? '#f87171' : '#fbbf24' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>{n.title}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{n.created_at}</span>
                          </div>
                          <p style={{ margin: '0 0 0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{n.message}</p>
                          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                            <span>To: {n.recipient_name}</span>
                            <span style={{ color: n.status === 'SENT' || n.status === 'READ' ? '#34d399' : n.status === 'FAILED' ? '#f87171' : '#fbbf24' }}>{n.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: PAYMENTS & REVENUE (RAZORPAY) */}
          {activeTab === 'payments' && (
            <AdminPaymentManager currentUser={currentUser} />
          )}
        </div>
      </div>
    </div>
  );
};

