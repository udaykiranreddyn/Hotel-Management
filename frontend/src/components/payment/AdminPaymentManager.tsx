import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Download, 
  RefreshCw, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RotateCcw, 
  Filter, 
  ShieldCheck, 
  TrendingUp, 
  FileText, 
  Eye, 
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { PaymentStatusBadge } from './PaymentStatus';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { PaymentService } from '../../services/paymentService';
import type { PaymentStats, PaymentRecord, PaymentReceipt } from '../../services/paymentService';

interface AdminPaymentManagerProps {
  currentUser: any;
}

export const AdminPaymentManager: React.FC<AdminPaymentManagerProps> = ({ currentUser }) => {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Receipt Modal State
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [loadingReceiptId, setLoadingReceiptId] = useState<number | null>(null);

  // Refund Modal State
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<PaymentRecord | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('Guest requested cancellation & refund');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundMessage, setRefundMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const data = await PaymentService.getAdminOverview({
        search: searchQuery || undefined,
        status_filter: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin payment overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOverview();
  };

  const handleOpenReceipt = async (paymentId: number) => {
    setLoadingReceiptId(paymentId);
    try {
      const data = await PaymentService.getReceipt(paymentId);
      setReceipt(data);
      setIsReceiptOpen(true);
    } catch (err) {
      console.error('Failed to generate receipt:', err);
    } finally {
      setLoadingReceiptId(null);
    }
  };

  const handleInitiateRefund = (payment: PaymentRecord) => {
    setSelectedPaymentForRefund(payment);
    setRefundAmount(payment.amount.toString());
    setRefundReason('Guest requested cancellation & refund');
    setRefundMessage(null);
  };

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForRefund) return;

    setIsProcessingRefund(true);
    setRefundMessage(null);

    try {
      const amountVal = parseFloat(refundAmount);
      const res = await PaymentService.refundPayment(selectedPaymentForRefund.id, {
        amount: isNaN(amountVal) ? undefined : amountVal,
        reason: refundReason.trim(),
      });

      setRefundMessage({
        type: 'success',
        text: res.message || 'Refund successfully processed through Razorpay Gateway.',
      });

      // Refresh stats
      setTimeout(() => {
        setSelectedPaymentForRefund(null);
        fetchOverview();
      }, 1500);
    } catch (err: any) {
      console.error('Refund execution failed:', err);
      const detail = err.response?.data?.detail || 'Razorpay refund processing failed. Please verify eligibility.';
      setRefundMessage({
        type: 'error',
        text: detail,
      });
    } finally {
      setIsProcessingRefund(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Financial Analytics Summary Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Total Captured Revenue */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.12) 0%, #FFFFFF 100%)',
            border: '1px solid #BAE6FD',
            borderRadius: '14px',
            padding: '1.25rem',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#16A34A', fontWeight: 700 }}>
              Verified Revenue
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(22, 163, 74, 0.15)', color: '#16A34A' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
            ₹{(stats?.total_revenue || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            From captured &amp; verified Razorpay folios
          </div>
        </div>

        {/* Successful Payments */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #BAE6FD',
            borderRadius: '14px',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Successful Payments
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(22, 163, 74, 0.15)', color: '#16A34A' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284C7' }}>
            {stats?.total_successful_payments || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Instant bookings confirmed
          </div>
        </div>

        {/* Pending Payments */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #BAE6FD',
            borderRadius: '14px',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Pending / In Checkout
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(244, 185, 66, 0.18)', color: '#F4B942' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F4B942' }}>
            {stats?.pending_payments || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Awaiting guest payment
          </div>
        </div>

        {/* Failed Payments */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #BAE6FD',
            borderRadius: '14px',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Failed / Declined
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.15)', color: '#DC2626' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#DC2626' }}>
            {stats?.failed_payments || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Rejected or bank errors
          </div>
        </div>

        {/* Total Refunds */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #BAE6FD',
            borderRadius: '14px',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Total Refunded
            </span>
            <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(71, 85, 105, 0.15)', color: '#475569' }}>
              <RotateCcw size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#475569' }}>
            ₹{(stats?.total_refunded_amount || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {stats?.refunded_payments || 0} cancellations refunded
          </div>
        </div>
      </div>

      {/* Visual Analytics Split Bar */}
      {stats && (stats.total_successful_payments > 0 || stats.pending_payments > 0 || stats.failed_payments > 0) && (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span>Transaction Volume Distribution</span>
            <span>
              Total: {(stats.total_successful_payments + stats.pending_payments + stats.failed_payments + stats.refunded_payments)} transactions
            </span>
          </div>
          <div style={{ display: 'flex', height: '10px', borderRadius: '6px', overflow: 'hidden', gap: '2px' }}>
            {stats.total_successful_payments > 0 && (
              <div
                title={`Success: ${stats.total_successful_payments}`}
                style={{
                  flex: stats.total_successful_payments,
                  background: '#10b981',
                }}
              />
            )}
            {stats.pending_payments > 0 && (
              <div
                title={`Pending: ${stats.pending_payments}`}
                style={{
                  flex: stats.pending_payments,
                  background: '#eab308',
                }}
              />
            )}
            {stats.failed_payments > 0 && (
              <div
                title={`Failed: ${stats.failed_payments}`}
                style={{
                  flex: stats.failed_payments,
                  background: '#ef4444',
                }}
              />
            )}
            {stats.refunded_payments > 0 && (
              <div
                title={`Refunded: ${stats.refunded_payments}`}
                style={{
                  flex: stats.refunded_payments,
                  background: '#94a3b8',
                }}
              />
            )}
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /> Success
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eab308' }} /> Pending
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} /> Failed
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} /> Refunded
            </span>
          </div>
        </div>
      )}

      {/* Search & Status Filters Bar */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '0.85rem',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by Booking Ref, Payment ID, or Guest Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.4rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '0.825rem',
              outline: 'none',
            }}
          />
        </div>

        <button type="submit" className="btn-secondary" style={{ padding: '0.55rem 0.9rem', fontSize: '0.8rem' }}>
          Search
        </button>

        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          {['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.35rem 0.7rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: statusFilter === st ? 'var(--gold-main)' : 'var(--border-subtle)',
                background: statusFilter === st ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                color: statusFilter === st ? 'var(--gold-light)' : 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </form>

      {/* Transactions Table */}
      <div
        style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.01)',
        }}
      >
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto', color: 'var(--gold-main)' }} />
            <div>Loading live Razorpay transactions...</div>
          </div>
        ) : !stats?.recent_transactions || stats.recent_transactions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CreditCard size={32} style={{ margin: '0 auto 0.5rem auto', color: 'var(--gold-main)', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>No Transactions Found</h4>
            <p style={{ margin: 0, fontSize: '0.825rem' }}>No payment records match your filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Booking &amp; Ref</th>
                  <th style={{ padding: '0.75rem' }}>Guest Name / Email</th>
                  <th style={{ padding: '0.75rem' }}>Room &amp; Nights</th>
                  <th style={{ padding: '0.75rem' }}>Amount</th>
                  <th style={{ padding: '0.75rem' }}>Gateway IDs</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_transactions.map((t) => (
                  <tr
                    key={t.id}
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--gold-light)' }}>
                        {t.booking_reference}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {t.payment_reference}
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t.guest_name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.guest_email}</div>
                    </td>

                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ color: 'var(--text-secondary)' }}>{t.room_type} (Room {t.room_number})</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {t.num_nights} nights ({t.check_in_date})
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        ₹{t.amount.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {t.method || 'CARD'}
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem' }}>
                      {t.razorpay_payment_id ? (
                        <code style={{ fontSize: '0.7rem', color: 'var(--gold-light)' }}>{t.razorpay_payment_id}</code>
                      ) : t.razorpay_order_id ? (
                        <code style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.razorpay_order_id}</code>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>

                    <td style={{ padding: '0.75rem' }}>
                      <PaymentStatusBadge status={t.status} size="sm" />
                    </td>

                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        {t.status === 'SUCCESS' && (
                          <>
                            <button
                              onClick={() => handleOpenReceipt(t.id)}
                              disabled={loadingReceiptId === t.id}
                              className="btn-secondary"
                              title="View Tax Receipt"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              <FileText size={13} />
                            </button>

                            <button
                              onClick={() => handleInitiateRefund(t)}
                              className="btn-outline-gold"
                              title="Initiate Razorpay Refund"
                              style={{
                                padding: '0.3rem 0.5rem',
                                fontSize: '0.75rem',
                                color: '#ef4444',
                                borderColor: 'rgba(239, 68, 68, 0.4)',
                                background: 'rgba(239, 68, 68, 0.08)',
                              }}
                            >
                              <RotateCcw size={13} />
                              <span style={{ marginLeft: '0.2rem' }}>Refund</span>
                            </button>
                          </>
                        )}
                        {t.status === 'REFUNDED' && (
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Refund Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tax Receipt Modal */}
      <PaymentReceiptModal
        receipt={receipt}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      {/* Refund Confirmation Modal */}
      {selectedPaymentForRefund && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(7, 11, 20, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="glass-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#FFFFFF',
              border: '1px solid #BAE6FD',
              borderRadius: '16px',
              padding: '1.75rem',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(2, 132, 199, 0.25)',
            }}
          >
            <button
              onClick={() => setSelectedPaymentForRefund(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#E0F2FE',
                border: '1px solid #BAE6FD',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284C7',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: '#DC2626' }}>
              <RotateCcw size={22} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0F172A' }}>
                Authorize Razorpay Refund
              </h3>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              You are about to issue a refund for booking <strong>{selectedPaymentForRefund.booking_reference}</strong>. The funds will be credited back via Razorpay.
            </p>

            {refundMessage && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: refundMessage.type === 'success' ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)',
                  border: `1px solid ${refundMessage.type === 'success' ? '#16A34A' : '#DC2626'}`,
                  color: refundMessage.type === 'success' ? '#16A34A' : '#DC2626',
                }}
              >
                {refundMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{refundMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleConfirmRefund} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Refund Amount (₹) — Max: ₹{selectedPaymentForRefund.amount}
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedPaymentForRefund.amount}
                  min="1"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    borderRadius: '8px',
                    color: '#0F172A',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Refund Reason (Audit Log)
                </label>
                <textarea
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    borderRadius: '8px',
                    color: '#0F172A',
                    fontSize: '0.85rem',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={isProcessingRefund}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: isProcessingRefund ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {isProcessingRefund ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                  <span>{isProcessingRefund ? 'Calling Razorpay...' : 'Confirm & Process Refund'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentForRefund(null)}
                  className="btn-secondary"
                  style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
