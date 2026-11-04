import React, { useState } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Mail, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  KeyRound, 
  ArrowRight
} from 'lucide-react';
import { AuthService } from '../services/api';
import type { UserProfile } from '../services/api';
import { saveUserToFirestore } from '../firebase';


interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register State
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferences, setPreferences] = useState('');
  const [regRole, setRegRole] = useState<'GUEST' | 'WORKER' | 'ADMIN'>('GUEST');
  
  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // 3 Core Demo Roles: Guest, Worker, Admin
  const demoAccounts = [
    { role: 'Guest', email: 'guest@aurahotels.com', name: 'Vikram Malhotra', icon: '🧳', badge: 'Guest Portal' },
    { role: 'Worker', email: 'receptionist@aurahotels.com', name: 'Sarah Jenkins', icon: '🧹', badge: 'Hotel Worker / Staff' },
    { role: 'Admin', email: 'admin@aurahotels.com', name: 'Dr. Alistair Vance', icon: '👑', badge: 'General Manager' },
  ];

  const handleSelectDemo = async (email: string) => {
    setLoginEmail(email);
    setLoginPassword('Password@123');
    setActiveTab('login');
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await AuthService.login(email, 'Password@123');
      setSuccessMsg(`Welcome back, ${res.user.full_name}! (Role: ${res.user.role})`);
      setTimeout(() => {
        onSuccess(res.user);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Demo login failed. Make sure FastAPI backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await AuthService.login(loginEmail, loginPassword);
      setSuccessMsg(`Welcome, ${res.user.full_name}! Logged in as ${res.user.role}.`);
      setTimeout(() => {
        onSuccess(res.user);
        onClose();
      }, 600);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Invalid email or password. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await AuthService.register({
        full_name: fullName,
        email: regEmail,
        phone,
        password: regPassword,
        confirm_password: confirmPassword,
        role: regRole,
        preferences,
      });
      saveUserToFirestore(res.user);
      setSuccessMsg(`Account created! Welcome, ${res.user.full_name} (${res.user.role})!`);
      setTimeout(() => {
        onSuccess(res.user);
        onClose();
      }, 800);
    } catch (err: any) {
      console.error("[Registration Error]:", err);
      let detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        detail = detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
      } else if (typeof detail === 'object' && detail !== null) {
        detail = JSON.stringify(detail);
      }
      setErrorMsg(detail || err.message || 'Registration failed. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backgroundColor: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '540px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #BAE6FD',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(14, 165, 233, 0.25)',
        overflow: 'hidden',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #BAE6FD',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#E0F2FE',
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#0284C7',
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 700,
            }}>
              <ShieldCheck size={20} color="#0284C7" />
              <span>AURA Guest &amp; Staff Access</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569' }}>
              Secure JWT authentication for Guest, Worker &amp; Admin accounts
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#BAE6FD',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F172A',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          
          {/* 1-Click Demo Accounts Switcher (3 Roles) */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '0.85rem',
            borderRadius: '12px',
            background: '#F0F9FF',
            border: '1px dashed #38BDF8',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.6rem',
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0284C7', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <KeyRound size={13} />
                <span>1-Click Demo Logins (Guest, Worker &amp; Admin)</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: '#475569' }}>
                Pass: Password@123
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
            }}>
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleSelectDemo(acc.email)}
                  disabled={isLoading}
                  style={{
                    padding: '0.65rem 0.5rem',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    border: '1px solid #BAE6FD',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#0284C7';
                    e.currentTarget.style.background = '#E0F2FE';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#BAE6FD';
                    e.currentTarget.style.background = '#FFFFFF';
                  }}
                  title={`Login instantly as ${acc.name} (${acc.role})`}
                >
                  <span style={{ fontSize: '1.2rem' }}>{acc.icon}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>{acc.role}</span>
                  <span style={{ fontSize: '0.65rem', color: '#0284C7' }}>{acc.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Selector: Login vs Register */}
          <div style={{
            display: 'flex',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '3px',
            marginBottom: '1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'login' ? 'var(--gold-gradient)' : 'transparent',
                color: activeTab === 'login' ? '#0b111e' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'register' ? 'var(--gold-gradient)' : 'transparent',
                color: activeTab === 'register' ? '#0b111e' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Create New Account
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '0.825rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '0.825rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form: Sign In */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              
              {/* Quick Select Role Buttons for Login */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Select Account Role
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                  {[
                    { label: 'Guest', email: 'guest@aurahotels.com', icon: '🧳' },
                    { label: 'Worker', email: 'receptionist@aurahotels.com', icon: '🧹' },
                    { label: 'Admin', email: 'admin@aurahotels.com', icon: '👑' },
                  ].map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => {
                        setLoginEmail(r.email);
                        setLoginPassword('Password@123');
                      }}
                      style={{
                        padding: '0.45rem 0.25rem',
                        borderRadius: '6px',
                        border: loginEmail === r.email ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: loginEmail === r.email ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                        color: loginEmail === r.email ? 'var(--gold-light)' : 'var(--text-muted)',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{r.icon}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. guest@aurahotels.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  justifyContent: 'center',
                  marginTop: '0.5rem',
                }}
              >
                {isLoading ? 'Verifying Credentials...' : 'Sign In'}
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            /* Form: Register */
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Role Selection for New Registration */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Select Account Role
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                  {[
                    { role: 'GUEST', label: 'Guest', icon: '🧳' },
                    { role: 'WORKER', label: 'Worker', icon: '🧹' },
                    { role: 'ADMIN', label: 'Admin', icon: '👑' },
                  ].map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => setRegRole(item.role as any)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '8px',
                        border: regRole === item.role ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: regRole === item.role ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                        color: regRole === item.role ? 'var(--gold-light)' : 'var(--text-muted)',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Malhotra"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@domain.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Room / Stay Preferences (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. High floor, extra pillows, king bed, quiet room"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  justifyContent: 'center',
                  marginTop: '0.5rem',
                }}
              >
                {isLoading ? 'Creating Account...' : `Register as ${regRole}`}
                <Sparkles size={16} />
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
