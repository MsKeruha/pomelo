import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import TourDetails from './pages/TourDetails';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import MaintenancePage from './pages/MaintenancePage';
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import Icon from './components/common/Icon';

function AppContent() {
  const [page, setPage] = useState('home');
  const [tourId, setTourId] = useState<number | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const { t, isLoading: settingsLoading, maintenanceMode } = useSettings();

  // Simple "router" based on URL hash and platform detection
  useEffect(() => {
    const handleHashChange = () => {
      const fullHash = window.location.hash.replace('#', '') || 'home';
      const [hash, _] = fullHash.split('?');
      
      if (hash.startsWith('tour/')) {
        const id = parseInt(hash.split('/')[1], 10);
        setTourId(isNaN(id) ? null : id);
        setPage('tour');
      } else {
        setTourId(null);
        setPage(hash || 'home');
      }
    };

    // Detect mobile by touch or UA and add class to body
    const detectMobile = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isTouch || uaMobile) {
        document.body.classList.add('is-mobile-device');
      } else {
        document.body.classList.remove('is-mobile-device');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('resize', detectMobile);
    
    handleHashChange();
    detectMobile();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('resize', detectMobile);
    };
  }, []);

  if (authLoading || settingsLoading) {
    return (
      <div className="loading-screen" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        gap: '1rem',
        backgroundColor: 'var(--bg-main)'
      }}>
        <Icon name="pomelo" size={48} className="spin-anim" /> 
        <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {t('common.loading')}
        </span>
      </div>
    );
  }

  // Maintenance Check
  const isStaff = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff';
  if (maintenanceMode && !isStaff && page !== 'auth') {
    return <MaintenancePage />;
  }

  // Admin access control
  if (page === 'admin') {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      window.location.hash = 'auth';
      return <AuthPage />;
    }
    return <AdminPage />;
  }

  const renderPage = () => {
    switch (page) {
      case 'home': return <HomePage />;
      case 'search': return <SearchPage />;
      case 'tour': return <TourDetails tourId={tourId} />;
      case 'dashboard':
        if (!user) {
          window.location.hash = 'auth';
          return <AuthPage />;
        }
        return <DashboardPage />;
      case 'auth': return <AuthPage />;
      default: return <NotFoundPage />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
