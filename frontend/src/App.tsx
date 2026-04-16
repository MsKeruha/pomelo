import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import TourDetails from './pages/TourDetails';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import Icon from './components/common/Icon';

function AppContent() {
  const [page, setPage] = useState('home');
  const [tourId, setTourId] = useState<number | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const { t, isLoading: settingsLoading } = useSettings();

  // Simple "router" based on URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const fullHash = window.location.hash.replace('#', '') || 'home';
      // Split to separate page from query params (e.g. search?q=...)
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
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
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
