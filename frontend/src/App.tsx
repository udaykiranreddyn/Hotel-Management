import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { StatusBanner } from './components/StatusBanner';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { SearchRoomsPage } from './pages/SearchRoomsPage';
import { RoomsRatesPage } from './pages/RoomsRatesPage';
import { HowToBookPage } from './pages/HowToBookPage';
import { AmenitiesPage } from './pages/AmenitiesPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentSuccessPage } from './pages/PaymentSuccess';
import { PaymentFailurePage } from './pages/PaymentFailure';
import { PaymentHistoryPage } from './pages/PaymentHistory';
import { AuthModal } from './components/AuthModal';
import { StaffDashboardModal } from './components/StaffDashboardModal';
import { BookingModal } from './components/BookingModal';
import { MyBookingsModal } from './components/MyBookingsModal';
import { AIChatBot } from './components/AIChatBot';
import { MobileBottomNav } from './components/MobileBottomNav';
import { BookingProvider } from './context/BookingContext';
import { HealthService, AuthService } from './services/api';
import type { SystemHealthData, UserProfile } from './services/api';

// ─── Route Guards ────────────────────────────────────────────────────────────

/** Redirects authenticated users away from login/register back to home */
function PublicOnlyRoute({ user, children }: { user: UserProfile | null; children: React.ReactNode }) {
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ─── App Shell (Sidebar on Left + Top Navbar + Footer + Modals) ─────────────

function AppShell({
  children,
  healthData,
  healthError,
  isLoadingHealth,
  currentUser,
  onRefreshHealth,
  onOpenAuth,
  onLogout,
  onOpenStaffPortal,
}: {
  children: React.ReactNode;
  healthData: SystemHealthData | null;
  healthError: boolean;
  isLoadingHealth: boolean;
  currentUser: UserProfile | null;
  onRefreshHealth: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenStaffPortal: () => void;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Health Status Banner */}
      <StatusBanner
        healthData={healthData}
        healthError={healthError}
        isLoading={isLoadingHealth}
        onRefresh={onRefreshHealth}
      />

      {/* Main Split Layout: Left Sidebar + Right Content Area */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 35px)', position: 'relative' }}>
        {/* Left Sidebar Navigation */}
        <Sidebar
          currentUser={currentUser}
          onOpenStaffPortal={onOpenStaffPortal}
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Right Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, width: '100%' }}>
          <Navbar
            healthData={healthData}
            healthError={healthError}
            onRefreshHealth={onRefreshHealth}
            currentUser={currentUser}
            onOpenAuth={onOpenAuth}
            onLogout={onLogout}
            onOpenStaffPortal={onOpenStaffPortal}
            onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          />

          <main style={{ flex: 1, position: 'relative', paddingBottom: '3.5rem' }}>
            {children}
          </main>

          <Footer />

          {/* Floating Mobile Bottom Navigation */}
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export function App() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(AuthService.getSavedUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  const fetchHealth = useCallback(async () => {
    setIsLoadingHealth(true);
    try {
      const data = await HealthService.getHealth();
      setHealthData(data);
      setHealthError(false);
    } catch (err) {
      console.warn('Backend API connection check failed:', err);
      setHealthError(true);
      setHealthData(null);
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  // Restore session from token on mount
  useEffect(() => {
    fetchHealth();
    const token = localStorage.getItem('aura_auth_token');
    if (token) {
      AuthService.getMe()
        .then((user) => setCurrentUser(user))
        .catch(() => {
          localStorage.removeItem('aura_auth_token');
          localStorage.removeItem('aura_user');
          setCurrentUser(null);
        });
    }
  }, [fetchHealth]);

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    fetchHealth();
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  return (
    <Router>
      <BookingProvider currentUser={currentUser} setCurrentUser={setCurrentUser}>
        <Routes>
          {/* ── PUBLIC: Login (unauthenticated only) ── */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute user={currentUser}>
                <LoginPage onSuccess={handleAuthSuccess} />
              </PublicOnlyRoute>
            }
          />

          {/* ── PUBLIC: Register (unauthenticated only) ── */}
          <Route
            path="/register"
            element={
              <PublicOnlyRoute user={currentUser}>
                <RegisterPage onSuccess={handleAuthSuccess} />
              </PublicOnlyRoute>
            }
          />

          {/* ── SEPARATE PAGES INSIDE LEFT-SIDEBAR LAYOUT ── */}
          <Route
            path="/*"
            element={
              <AppShell
                healthData={healthData}
                healthError={healthError}
                isLoadingHealth={isLoadingHealth}
                currentUser={currentUser}
                onRefreshHealth={fetchHealth}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onLogout={handleLogout}
                onOpenStaffPortal={() => setIsStaffModalOpen(true)}
              >
                <Routes>
                  {/* Home Page */}
                  <Route
                    path="/"
                    element={
                      <HomePage
                        currentUser={currentUser}
                        onOpenAuth={() => setIsAuthModalOpen(true)}
                        onOpenStaffPortal={() => setIsStaffModalOpen(true)}
                      />
                    }
                  />

                  {/* Separate Page: Search Rooms */}
                  <Route path="/search" element={<SearchRoomsPage />} />
                  <Route path="/search-rooms" element={<SearchRoomsPage />} />

                  {/* Separate Page: Rooms & Rates */}
                  <Route path="/rooms" element={<RoomsRatesPage />} />
                  <Route path="/rooms-rates" element={<RoomsRatesPage />} />

                  {/* Separate Page: How to Book Rooms */}
                  <Route path="/how-to-book" element={<HowToBookPage />} />

                  {/* Separate Page: Amenities */}
                  <Route path="/amenities" element={<AmenitiesPage />} />

                  {/* Separate Page: About */}
                  <Route path="/about" element={<AboutPage />} />

                  {/* Separate Page: Contact */}
                  <Route path="/contact" element={<ContactPage />} />

                  {/* ── RAZORPAY PAYMENT GATEWAY ROUTES ── */}
                  <Route path="/payment" element={<PaymentPage />} />
                  <Route path="/payment/:bookingRef" element={<PaymentPage />} />
                  <Route path="/payment-success" element={<PaymentSuccessPage />} />
                  <Route path="/payment-failure" element={<PaymentFailurePage />} />
                  <Route path="/my-payments" element={<PaymentHistoryPage />} />

                  {/* 404 Fallback */}
                  <Route
                    path="*"
                    element={
                      <div style={{ padding: '6rem 1rem', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--gold-light)' }}>
                          Page Not Found
                        </h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                          Please use the left sidebar navigation to explore our hotel pages.
                        </p>
                        <a href="/" className="btn-primary">Return to Home</a>
                      </div>
                    }
                  />
                </Routes>

                {/* Shared Booking Modal */}
                <BookingModal
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onOpenStaffPortal={() => setIsStaffModalOpen(true)}
                />

                {/* Shared My Bookings Drawer/Modal */}
                <MyBookingsModal />

                {/* AI Chatbot — floats over all pages */}
                <AIChatBot currentUser={currentUser} />

                {/* Auth modal (for quick sign-in without leaving the page) */}
                <AuthModal
                  isOpen={isAuthModalOpen}
                  onClose={() => setIsAuthModalOpen(false)}
                  onSuccess={handleAuthSuccess}
                />

                {/* Staff Operations Portal */}
                <StaffDashboardModal
                  isOpen={isStaffModalOpen}
                  onClose={() => setIsStaffModalOpen(false)}
                  currentUser={currentUser}
                  onRefreshParent={fetchHealth}
                />
              </AppShell>
            }
          />
        </Routes>
      </BookingProvider>
    </Router>
  );
}

export default App;
