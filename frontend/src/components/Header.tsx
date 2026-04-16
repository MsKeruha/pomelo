import React, { useState } from 'react';
import './Header.css';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Icon from './common/Icon';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const { language, currency, setLanguage, setCurrency, t } = useSettings();
    const [searchQuery, setSearchQuery] = useState('');
    const [showLangMenu, setShowLangMenu] = useState(false);

    const options = [
        { label: 'UA / ₴', lang: 'uk', curr: 'UAH' },
        { label: 'EN / $', lang: 'en', curr: 'USD' },
        { label: 'EN / €', lang: 'en', curr: 'EUR' }
    ];

    const currentOption = options.find(o => o.lang === language && o.curr === currency) || options[0];

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

    return (
        <header className="main-header">
            <a className="logo-container" href="/#home">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="pomelo" size={24} /> POMELO
                </span>
            </a>

            <nav>
            </nav>

            <form className="header-search" onSubmit={handleSearchSubmit}>
                <span className="search-icon"><Icon name="search" size={20} style={{ color: '#aaa' }} /></span>
                <input
                    type="text"
                    placeholder={t('nav.search', 'Пошук турів...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                />
            </form>

            <div className="header-right">
                <div className="lang-container" style={{ position: 'relative' }}>
                    <button className="lang-selector" onClick={() => setShowLangMenu(!showLangMenu)}>
                        {currentOption.label} <Icon name="settings" size={14} strokeWidth={3} />
                    </button>
                    {showLangMenu && (
                        <div className="header-dropdown lang-dropdown" style={{ minWidth: '110px', top: 'calc(100% + 8px)', right: '0' }}>
                            {options.map((o) => (
                                <button 
                                    key={o.label} 
                                    className={`dropdown-item ${currentOption.label === o.label ? 'active' : ''}`}
                                    onClick={() => { 
                                        setLanguage(o.lang as any); 
                                        setCurrency(o.curr as any); 
                                        setShowLangMenu(false); 
                                    }}
                                >
                                    {o.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {user ? (
                    <div className="header-user-menu">
                        <div
                            className="header-avatar"
                            title={user.full_name}
                            onClick={() => window.location.hash = user.role === 'admin' || user.role === 'manager' ? 'admin' : 'dashboard'}
                        >
                            {initials}
                        </div>
                        <div className="header-dropdown">
                            <span className="dropdown-name">{user.full_name}</span>
                            {(user.role === 'admin' || user.role === 'manager') && (
                                <a className="dropdown-item" href="#admin" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Icon name="settings" size={16} /> {t('profile.admin', 'Адмін-панель')}
                                </a>
                            )}
                            <a className="dropdown-item" href="#dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="plane" size={16} /> {t('profile.bookings', 'Мої бронювання')}
                            </a>
                            <button className="dropdown-item dropdown-logout" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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