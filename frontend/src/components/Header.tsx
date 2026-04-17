import React, { useState, useEffect } from 'react';
import './Header.css';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Icon from './common/Icon';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const { language, currency, setLanguage, setCurrency, t } = useSettings();
    const [searchQuery, setSearchQuery] = useState('');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const currentLanguageLabel = language === 'uk' ? 'UA' : 'EN';
    const currencySymbols: Record<string, string> = { 'UAH': '₴', 'USD': '$', 'EUR': '€' };
    const currentCurrencySymbol = currencySymbols[currency] || '₴';

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.hash = `search?destination=${encodeURIComponent(searchQuery.trim())}`;
        } else {
            window.location.hash = 'search';
        }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearchSubmit(e as any);
        }
    };

    const initials = user?.full_name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '';

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as Element).closest('.lang-container') && 
                !(e.target as Element).closest('.header-user-menu')) {
                setShowLangMenu(false);
                setShowUserMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const toggleLangMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowLangMenu(!showLangMenu);
        setShowUserMenu(false);
    };

    const toggleUserMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowUserMenu(!showUserMenu);
        setShowLangMenu(false);
    };

    // Track current page for conditional rendering
    const [isAuthPage, setIsAuthPage] = useState(window.location.hash.startsWith('#auth'));

    useEffect(() => {
        const handleHashChange = () => {
            setIsAuthPage(window.location.hash.startsWith('#auth'));
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    return (
        <header className="main-header">
            <a className="logo-container" href="/#home">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="pomelo" size={24} /> POMELO
                </span>
            </a>

            <nav>
            </nav>

            {!isAuthPage && (
                <form className="header-search main-nav-search" onSubmit={handleSearchSubmit}>
                    <span className="search-icon"><Icon name="search" size={20} style={{ color: '#aaa' }} /></span>
                    <input
                        type="text"
                        placeholder={t('nav.search', 'Пошук турів...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                </form>
            )}

            <div className="header-right">
                <div className="lang-container" style={{ position: 'relative' }}>
                    <button className="lang-selector" onClick={toggleLangMenu}>
                        {currentLanguageLabel} / {currentCurrencySymbol} <Icon name="settings" size={14} strokeWidth={3} />
                    </button>
                    {showLangMenu && (
                        <div className="header-dropdown settings-dropdown" style={{ minWidth: '160px', top: 'calc(100% + 8px)', right: '0', padding: '12px' }}>
                            <div className="settings-section">
                                <span className="settings-label" style={{ fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>
                                    {t('settings.language', 'Мова')}
                                </span>
                                <div className="settings-options" style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                                    <button 
                                        className={`settings-opt-btn ${language === 'uk' ? 'active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setLanguage('uk'); }}
                                        style={{ flex: 1, padding: '6px', borderRadius: '6px', fontSize: '13px', fontWeight: 500 }}
                                    >
                                        UA
                                    </button>
                                    <button 
                                        className={`settings-opt-btn ${language === 'en' ? 'active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setLanguage('en'); }}
                                        style={{ flex: 1, padding: '6px', borderRadius: '6px', fontSize: '13px', fontWeight: 500 }}
                                    >
                                        EN
                                    </button>
                                </div>
                            </div>

                            <div className="settings-section">
                                <span className="settings-label" style={{ fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>
                                    {t('settings.currency', 'Валюта')}
                                </span>
                                <div className="settings-options" style={{ display: 'flex', gap: '4px' }}>
                                    {(['UAH', 'USD', 'EUR'] as const).map(curr => (
                                        <button 
                                            key={curr}
                                            className={`settings-opt-btn ${currency === curr ? 'active' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); setCurrency(curr); }}
                                            style={{ flex: 1, padding: '6px', borderRadius: '6px', fontSize: '13px', fontWeight: 500 }}
                                        >
                                            {currencySymbols[curr]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {user ? (
                    <div className="header-user-menu" onClick={(e) => e.stopPropagation()}>
                        <div
                            className={`header-avatar ${showUserMenu ? 'active' : ''}`}
                            title={user.full_name}
                            onClick={toggleUserMenu}
                            style={user.avatar_url ? { 
                                backgroundImage: user.avatar_url ? `url(${user.avatar_url}?v=${Date.now()})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                position: 'relative'
                            } : { position: 'relative' }}
                        >
                            {!user.avatar_url && initials}
                        </div>
                        <div className={`header-dropdown ${showUserMenu ? 'show' : ''}`}>
                            <span className="dropdown-name">{user.full_name}</span>
                            {(user.role === 'admin' || user.role === 'manager') && (
                                <a className="dropdown-item" href="#admin" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Icon name="settings" size={16} /> {t('profile.admin', 'Адмін-панель')}
                                </a>
                            )}
                            <a className="dropdown-item" href="#dashboard" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="plane" size={16} /> {t('profile.bookings', 'Мої бронювання')}
                            </a>
                            <button className="dropdown-item dropdown-logout" onClick={() => { logout(); setShowUserMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="logout" size={16} /> {t('profile.logout', 'Вийти')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <a href="/#auth" className="btn-signin">{t('auth.signin', 'Увійти')}</a>
                )}
            </div>
        </header>
    );
};

export default Header;