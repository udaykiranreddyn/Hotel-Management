import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, AlertCircle, CheckCircle2,
  Building2, KeyRound, ArrowRight, Eye, EyeOff,
} from 'lucide-react';
import { AuthService } from '../services/api';
import type { UserProfile } from '../services/api';

interface LoginPageProps {
  onSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const demoAccounts = [
    { role: 'Guest', email: 'guest@aurahotels.com', name: 'Vikram Malhotra', icon: '🧳', color: 'rgba(245,197,66,0.15)', border: 'rgba(245,197,66,0.5)' },
    { role: 'Admin', email: 'admin@aurahotels.com', name: 'Dr. Vance', icon: '👑', color: 'rgba(4,19,47,0.12)', border: 'rgba(4,19,47,0.35)' },
  ];

  const doLogin = async (emailVal: string, passVal: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await AuthService.login(emailVal, passVal);
      setSuccessMsg(`Welcome back, ${res.user.full_name}! ✓`);
      setTimeout(() => {
        onSuccess(res.user);
        navigate('/');
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setErrorMsg('Please enter your email and password.'); return; }
    doLogin(email, password);
  };

  const handleDemo = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword('Password@123');
    doLogin(acc.email, 'Password@123');
  };

  const inputBase: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '0.75rem 0.875rem 0.75rem 2.6rem',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px', color: '#0B1B3A',
    fontSize: '0.9rem', outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'var(--font-sans)',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg-primary)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* ── Left decorative panel ── */}
      <div style={{
        display: 'none',
        flex: '0 0 42%',
        background: 'linear-gradient(160deg, #04132F 0%, #102B56 50%, #0B1B3A 100%)',
        borderRight: '1px solid rgba(245,197,66,0.2)',
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', padding: '3rem',
        position: 'relative', overflow: 'hidden',
      }} className="login-left-panel">
        {/* Big faint rings */}
        {[380, 260, 150].map((s, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: s + 'px', height: s + 'px',
            borderRadius: '50%',
            border: `1px solid rgba(245,197,66,${0.08 + i * 0.04})`,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }} />
        ))}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.8rem',
          marginBottom: '1.5rem', position: 'relative',
        }}>
          <div style={{
            width: '54px', height: '54px', borderRadius: '14px',
            background: '#F5C542',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(245,197,66,0.35)',
          }}>
            <Building2 size={28} color="#061A40" strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: '#F5C542', letterSpacing: '0.1em' }}>AURA</div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#94A3B8' }}>Comfort Hotel &amp; Rooms</div>
          </div>
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: '#FFFFFF', textAlign: 'center', lineHeight: 1.3, marginBottom: '1rem', position: 'relative' }}>
          Experience Luxury,<br />Redefined.
        </h2>
        <p style={{ color: '#94A3B8', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '260px', position: 'relative' }}>
          Sign in to manage your bookings, access exclusive offers, and enjoy a seamless hotel experience.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '2rem 1.5rem',
        position: 'relative',
      }}>
        {/* Glow blobs */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-8%', left: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: '440px', position: 'relative' }}>

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '2rem' }} className="mobile-logo">
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F5C542', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(245,197,66,0.35)' }}>
              <Building2 size={22} color="#061A40" strokeWidth={2.2} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#061A40', letterSpacing: '0.1em' }}>AURA</span>
          </div>

          {/* Card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '20px',
            boxShadow: '0 24px 60px rgba(6,26,64,0.12)',
            backdropFilter: 'blur(24px)',
            overflow: 'hidden',
          }}>
            {/* Card header */}
            <div style={{
              padding: '1.75rem 2rem 1.25rem',
              borderBottom: '1px solid #E2E8F0',
              background: 'linear-gradient(180deg, rgba(245,197,66,0.06) 0%, transparent 100%)',
            }}>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: '#0B1B3A', letterSpacing: '0.02em' }}>
                Welcome Back
              </h1>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: '#374151' }}>
                Sign in to access your dashboard
              </p>
            </div>

            <div style={{ padding: '1.5rem 2rem 2rem' }}>

              {/* Demo accounts */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
                  <KeyRound size={12} color="#D4A017" />
                  <span style={{ fontSize: '0.73rem', fontWeight: 600, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Quick Demo Access
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#374151' }}>pass: Password@123</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleDemo(acc)}
                      style={{
                        padding: '0.6rem 0.4rem', borderRadius: '10px',
                        background: email === acc.email ? acc.color : '#F8FAFC',
                        border: `1px solid ${email === acc.email ? acc.border : '#E2E8F0'}`,
                        cursor: 'pointer', transition: 'all 0.18s ease',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = acc.color; e.currentTarget.style.borderColor = acc.border; }}
                      onMouseOut={(e) => {
                        if (email !== acc.email) {
                          e.currentTarget.style.background = '#F8FAFC';
                          e.currentTarget.style.borderColor = '#E2E8F0';
                        }
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>{acc.icon}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0B1B3A' }}>{acc.role}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                <span style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 500 }}>OR SIGN IN MANUALLY</span>
                <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
              </div>

              {/* Alerts */}
              {errorMsg && (
                <div style={{ padding: '0.7rem 0.9rem', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={15} /><span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div style={{ padding: '0.7rem 0.9rem', borderRadius: '8px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={15} /><span>{successMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#111827', marginBottom: '0.4rem' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                    <input
                      type="email" required
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrorMsg(null); }}
                      style={inputBase}
                      onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#111827', marginBottom: '0.4rem' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                    <input
                      type={showPass ? 'text' : 'password'} required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }}
                      style={{ ...inputBase, paddingRight: '2.8rem' }}
                      onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 0 }}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={isLoading}
                  style={{
                    marginTop: '0.4rem', width: '100%', padding: '0.85rem',
                    borderRadius: '10px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                    background: isLoading ? 'rgba(245,197,66,0.5)' : '#F5C542',
                    color: '#061A40', fontWeight: 700, fontSize: '0.95rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    fontFamily: 'var(--font-sans)',
                    boxShadow: isLoading ? 'none' : '0 4px 20px rgba(245,197,66,0.35)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isLoading ? (
                    <>
                      <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      Signing In...
                    </>
                  ) : (
                    <>Sign In <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              {/* Footer */}
              <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.83rem', color: '#374151', margin: '1.5rem 0 0' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: '#D4A017', textDecoration: 'none', fontWeight: 600 }}
                  onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Create one now →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 860px) {
          .login-left-panel { display: flex !important; }
          .mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
