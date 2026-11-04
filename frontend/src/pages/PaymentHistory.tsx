import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Download, Clock, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, FileText } from 'lucide-react';
import { PaymentStatusBadge } from '../components/payment/PaymentStatus';
import { PaymentReceiptModal } from '../components/payment/PaymentReceiptModal';
import { PaymentService } from '../services/paymentService';
import type { PaymentRecord, PaymentReceipt } from '../services/paymentService';

export const PaymentHistoryPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [loadingReceiptId, setLoadingReceiptId] = useState<number | null>(null);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const data = await PaymentService.getMyPayments();
      setPayments(data);
    } catch (err) {
      console.error('Failed to load guest payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

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

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.booking_reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.payment_reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.razorpay_payment_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.razorpay_order_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.guest_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.room_type || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Page Title & Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-main)' }}>
            Guest Billing & Invoices
          </span>
          <h1 style={{ margin: '0.2rem 0 0 0', fontSize: '1.85rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            Payment History
          </h1>
        </div>

        <button
          onClick={fetchPayments}
          disabled={isLoading}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          gap: '1rem',
          padding: '1rem',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          marginBottom: '1.5rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by booking reference, transaction ID, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.75rem 0.65rem 2.5rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
          {['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: statusFilter === st ? 'var(--gold-main)' : 'var(--border-subtle)',
                background: statusFilter === st ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                color: statusFilter === st ? 'var(--gold-light)' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div
        className="glass-card"
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {isLoading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
            <div>Loading verified payment transactions...</div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CreditCard size={36} style={{ color: 'var(--gold-main)', opacity: 0.6, margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>No Transactions Found</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              You do not have any payments matching your search criteria.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem 1.25rem' }}>Reference</th>
                  <th style={{ padding: '1rem' }}>Guest</th>
                  <th style={{ padding: '1rem' }}>Room & Dates</th>
                  <th style={{ padding: '1rem' }}>Amount & Date</th>
                  <th style={{ padding: '1rem' }}>Transaction ID</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--gold-light)' }}>
                        {p.booking_reference}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.payment_reference}
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {p.guest_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.guest_email}
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {p.room_type} · Room {p.room_number}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.check_in_date} → {p.check_out_date} ({p.num_nights}N)
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                        ₹{p.amount.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(p.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {p.method || 'CARD'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all', maxWidth: '140px' }}>
                        {p.razorpay_payment_id || p.razorpay_order_id || '—'}
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <PaymentStatusBadge status={p.status} size="sm" />
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      {p.status === 'SUCCESS' ? (
                        <button
                          onClick={() => handleOpenReceipt(p.id)}
                          disabled={loadingReceiptId === p.id}
                          className="btn-secondary"
                          style={{
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <Download size={13} />
                          <span>{loadingReceiptId === p.id ? 'Loading...' : 'Receipt'}</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No Receipt</span>
                      )}
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
    </div>
  );
};
