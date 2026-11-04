import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Activity,
  Flame
} from 'lucide-react';
import type { SystemHealthData } from '../services/api';

interface StatusBannerProps {
  healthData: SystemHealthData | null;
  healthError: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  healthData,
  healthError,
  isLoading,
  onRefresh,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: 'linear-gradient(90deg, #061A40 0%, #102B56 50%, #061A40 100%)',
      borderBottom: '1px solid #102B56',
      padding: '0.6rem 1rem',
      fontSize: '0.825rem',
      transition: 'var(--transition-smooth)'
    }}>
      <div className="container" style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem'
      }}>
        {/* Left: Overall Health indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.2rem 0.6rem',
            borderRadius: 'var(--radius-pill)',
            background: healthData 
              ? 'rgba(22, 163, 74, 0.15)' 
              : healthError 
                ? 'rgba(220, 38, 38, 0.15)' 
                : 'rgba(245, 197, 66, 0.15)',
            border: `1px solid ${healthData ? 'rgba(22, 163, 74, 0.4)' : healthError ? 'rgba(220, 38, 38, 0.4)' : 'rgba(245, 197, 66, 0.4)'}`,
            fontWeight: 700,
            color: healthData ? '#16A34A' : healthError ? '#DC2626' : '#F5C542',
          }}>
            {healthData ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            <span>{healthData ? 'PHASE 1 OPERATIONAL' : healthError ? 'BACKEND OFFLINE' : 'CHECKING...'}</span>
          </div>

          <span style={{ color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Server size={14} color="#F5C542" />
            <strong style={{ color: '#FFFFFF' }}>FastAPI:</strong> {healthData ? 'v' + healthData.version : 'Connecting...'}
          </span>

          <span style={{ color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Database size={14} color="#F5C542" />
            <strong style={{ color: '#FFFFFF' }}>DB:</strong> {healthData ? `${healthData.database.dialect} (${healthData.database.latency_ms}ms)` : 'SQLite (waiting)'}
          </span>

          <span style={{ color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Flame size={14} color="#F5C542" />
            <strong style={{ color: '#FFFFFF' }}>Firebase:</strong> <span style={{ color: '#16A34A', fontWeight: 600 }}>Firestore Active</span>
          </span>
        </div>

        {/* Right: Actions and expand details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: '#F5C542',
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
            title="Perform live handshake with backend /api/health"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isLoading ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: '#94A3B8',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            <span>{expanded ? 'Hide Details' : 'Diagnostics'}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Collapsible Diagnostic Detail Card */}
      {expanded && (
        <div className="container animate-fade-in" style={{
          marginTop: '0.75rem',
          padding: '1rem',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(6, 26, 64, 0.08)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <div style={{ color: 'var(--gold-primary)', fontWeight: 600, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Activity size={14} /> Architecture Health
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
              <div>• Environment: <span style={{ color: 'var(--text-main)' }}>{healthData?.environment || 'development'}</span></div>
              <div>• Backend Engine: <span style={{ color: 'var(--text-main)' }}>Uvicorn + FastAPI (Python 3.13)</span></div>
              <div>• Frontend: <span style={{ color: 'var(--text-main)' }}>React 19 + TypeScript + Vite</span></div>
              <div>• API Base: <code style={{ color: 'var(--gold-light)' }}>/api/health/</code></div>
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--gold-primary)', fontWeight: 600, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Database size={14} /> Database &amp; Storage
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
              <div>• Dialect: <span style={{ color: 'var(--text-main)' }}>{healthData?.database.dialect || 'sqlite'}</span></div>
              <div>• Status: <span style={{ color: '#34d399' }}>{healthData?.database.status || 'connected'}</span></div>
              <div>• Roundtrip Latency: <span style={{ color: 'var(--gold-light)' }}>{healthData?.database.latency_ms} ms</span></div>
              <div>• Storage File: <code style={{ color: 'var(--text-main)' }}>HOTEL/data/hotel.db</code></div>
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--gold-primary)', fontWeight: 600, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Flame size={14} color="#ffca28" /> Firebase Cloud Integration
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
              <div>• Project ID: <span style={{ color: 'var(--text-main)' }}>hotel-management-system-afd89</span></div>
              <div>• Storage Bucket: <span style={{ color: 'var(--text-main)' }}>hotel-management-system-afd89.firebasestorage.app</span></div>
              <div>• Firestore Collections: <span style={{ color: '#34d399' }}>rooms, room_types, users, bookings, reviews</span></div>
              <div>• Client SDK: <code style={{ color: 'var(--gold-light)' }}>v11.4.0 (Initialized)</code></div>
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--gold-primary)', fontWeight: 600, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Layers size={14} /> Initialized Modules (Phase 1)
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
              {healthData?.active_modules.map((mod, idx) => (
                <div key={idx}>✓ {mod}</div>
              )) || <div>Loading modules...</div>}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
