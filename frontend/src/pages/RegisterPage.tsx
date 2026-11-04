import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Phone, AlertCircle, CheckCircle2,
  Building2, ArrowRight, Eye, EyeOff, Sparkles,
} from 'lucide-react';
import { AuthService } from '../services/api';
import type { UserProfile } from '../services/api';
import { saveUserToFirestore } from '../firebase';

interface RegisterPageProps {
  onSuccess: (user: UserProfile) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess }) => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferences, setPreferences] = useState('');
  const [role, setRole] = useState<'GUEST' | 'ADMIN'>('GUEST');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const roles: { value: 'GUEST' | 'ADMIN'; label: string; icon: string; desc: string; color: string; border: string }[] = [
    { value: 'GUEST', label: 'Guest', icon: '🧳', desc: 'Book & manage stays', color: 'rgba(245,197,66,0.15)', border: 'rgba(245,197,66,0.5)' },
    { value: 'ADMIN', label: 'Admin', icon: '👑', desc: 'Full management', color: 'rgba(4,19,47,0.12)', border: 'rgba(4,19,47,0.35)' },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }
    if (password.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await AuthService.register({
        full_name: fullName, email, phone,
        password, confirm_password: confirmPassword, role, preferences,
      });
      saveUserToFirestore(res.user);
      setSuccessMsg(`Account created! Welcome, ${res.user.full_name} ✓`);
      setTimeout(() => { onSuccess(res.user); navigate('/'); }, 800);
    } catch (err: any) {
      let detail = err.response?.data?.detail;
      if (Array.isArray(detail)) detail = detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
      else if (typeof detail === 'object' && detail) detail = JSON.stringify(detail);
      setErrorMsg(detail || err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '0.72rem 0.875rem 0.72rem 2.5rem',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px', color: '#000000',
    fontSize: '0.875rem', outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'var(--font-sans)',
  };

  const selectedRole = roles.find(r => r.value === role)!;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg-primary)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* ── Left decorative panel ── */}
      <div style={{
        display: 'none',
        flex: '0 0 40%',
        background: 'linear-gradient(160deg, #04132F 0%, #102B56 50%, #0B1B3A 100%)',
        borderRight: '1px solid rgba(245,197,66,0.2)',
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', padding: '3rem',
        position: 'relative', overflow: 'hidden',
      }} className="register-left-panel">
        {[400, 270, 155].map((s, i) => (
          <div key={i} style={{
            position: 'absolute', width: s + 'px', height: s + 'px', borderRadius: '50%',
            border: `1px solid rgba(245,197,66,${0.08 + i * 0.04})`,
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
          }} />
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', position: 'relative' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: '#F5C542', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 24px rgba(245,197,66,0.35)' }}>
            <Building2 size={28} color="#061A40" strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: '#F5C542', letterSpacing: '0.1em' }}>AURA</div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#94A3B8' }}>Comfort Hotel &amp; Rooms</div>
          </div>
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: '#FFFFFF', textAlign: 'center', lineHeight: 1.3, marginBottom: '1rem', position: 'relative' }}>
          Join AURA Hotels<br />Today.
        </h2>
        <p style={{ color: '#94A3B8', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '260px', position: 'relative' }}>
          Create your account in seconds and unlock seamless bookings, loyalty rewards, and premium hotel services.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '2rem', position: 'relative', width: '100%', maxWidth: '240px' }}>
          {['Free instant account creation', 'Exclusive member discounts', 'Real-time booking management'].map((perk) => (
            <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <CheckCircle2 size={14} color="#F5C542" />
              <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>{perk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-8%', right: '-4%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-6%', left: '-3%', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: '460px', position: 'relative' }}>

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
            <div style={{ padding: '1.5rem 2rem 1.1rem', borderBottom: '1px solid #E2E8F0', background: 'linear-gradient(180deg, rgba(245,197,66,0.06) 0%, transparent 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Sparkles size={18} color="#D4A017" />
                <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', letterSpacing: '0.02em' }}>
                  Create Your Account
                </h1>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#374151' }}>
                Join AURA Hotels — choose your role to get started
              </p>
            </div>

            <div style={{ padding: '1.4rem 2rem 2rem' }}>

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

              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

                {/* Role Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Account Role
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
                    {roles.map((r) => (
                      <button key={r.value} type="button" onClick={() => setRole(r.value)}
                        style={{
                          padding: '0.65rem 0.4rem', borderRadius: '10px',
                          background: role === r.value ? r.color : '#F8FAFC',
                          border: `1px solid ${role === r.value ? r.border : '#E2E8F0'}`,
                          cursor: 'pointer', transition: 'all 0.18s',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                        }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{r.icon}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: role === r.value ? '#0B1B3A' : '#374151' }}>{r.label}</span>
                        <span style={{ fontSize: '0.62rem', color: '#6B7280' }}>{r.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#111827', marginBottom: '0.35rem' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                    <input type="text" required placeholder="Your full name"
                      value={fullName} onChange={(e) => setFullName(e.target.value)}
                      style={inputBase}
                      onFocus={(e) => e.currentTarget.style.borderColor = selectedRole.border}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                    />
                  </div>
                </div>

                {/* Email + Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#111827', marginBottom: '0.35rem' }}>Email</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                      <input type="email" required placeholder="your@email.com"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        style={{ ...inputBase, paddingLeft: '2.1rem', fontSize: '0.82rem' }}
                        onFocus={(e) => e.currentTarget.style.borderColor = selectedRole.border}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#111827', marginBottom: '0.35rem' }}>Phone</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                      <input type="tel" placeholder="+91 98765 00000"
                        value={phone} onChange={(e) => setPhone(e.target.value)}
                        style={{ ...inputBase, paddingLeft: '2.1rem', fontSize: '0.82rem' }}
                        onFocus={(e) => e.currentTarget.style.borderColor = selectedRole.border}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                      />
                    </div>
                  </div>
                </div>

                {/* Password + Confirm */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#111827', marginBottom: '0.35rem' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                      <input type={showPass ? 'text' : 'password'} required placeholder="Min 6 chars"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        style={{ ...inputBase, paddingLeft: '2.1rem', paddingRight: '2.4rem', fontSize: '0.82rem' }}
                        onFocus={(e) => e.currentTarget.style.borderColor = selectedRole.border}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 0 }}>
                        {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#111827', marginBottom: '0.35rem' }}>Confirm</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                      <input type={showConfirm ? 'text' : 'password'} required placeholder="Repeat password"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ ...inputBase, paddingLeft: '2.1rem', paddingRight: '2.4rem', fontSize: '0.82rem' }}
                        onFocus={(e) => e.currentTarget.style.borderColor = selectedRole.border}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 0 }}>
                        {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#111827', marginBottom: '0.35rem' }}>
                    Stay Preferences <span style={{ fontWeight: 400, opacity: 0.6, color: '#6B7280' }}>(optional)</span>
                  </label>
                  <input type="text" placeholder="e.g. High floor, king bed, quiet room, extra pillows"
                    value={preferences} onChange={(e) => setPreferences(e.target.value)}
                    style={{ ...inputBase, paddingLeft: '0.875rem' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = selectedRole.border}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit" disabled={isLoading}
                  style={{
                    marginTop: '0.25rem', width: '100%', padding: '0.85rem',
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
                      Creating Account...
                    </>
                  ) : (
                    <>Register as {role} <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.83rem', color: '#374151' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#D4A017', textDecoration: 'none', fontWeight: 600 }}
                  onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Sign in here →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 860px) {
          .register-left-panel { display: flex !important; }
          .mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
