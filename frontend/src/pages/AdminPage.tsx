import React, { useState } from 'react';
import AdminStats from '../components/admin/AdminStats';
import AdminTours from '../components/admin/AdminTours';
import AdminTourEditor from '../components/admin/AdminTourEditor';
import AdminBookings from '../components/admin/AdminBookings';
import AdminSupport from '../components/admin/AdminSupport';
import AdminManagers from '../components/admin/AdminManagers';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Icon from '../components/common/Icon';
import './AdminPage.css';

type AdminTab = 'stats' | 'tours' | 'bookings' | 'editor' | 'support' | 'managers' | 'settings';

const AdminPage: React.FC = () => {
    const { user, logout } = useAuth();
    const { t, language } = useSettings();
    const [activeTab, setActiveTab] = useState<AdminTab>('stats');
    const [prevTab, setPrevTab] = useState<AdminTab>('tours');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [editTourId, setEditTourId] = useState<number | null>(null);
    const [settings, setSettings] = useState({
        platformName: 'Pomelo Travel',
        supportEmail: 'support@pomelo.travel',
        currency: 'UAH',
        sessionLimit: 24,
        twoFactor: false
    });
    const [isSaving, setIsSaving] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const openEditor = (id?: number) => {
        setEditTourId(id ?? null);
        setPrevTab(activeTab);
        setActiveTab('editor');
    };

    const closeEditor = () => {
        setActiveTab(prevTab);
        setEditTourId(null);
    };

    const handleSaved = () => {
        setActiveTab('tours');
        setEditTourId(null);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'tours':
                return <AdminTours onEdit={(id) => openEditor(id)} onAdd={() => openEditor()} />;
            case 'bookings':
                return <AdminBookings />;
            case 'editor':
                return <AdminTourEditor onCancel={closeEditor} onSaved={handleSaved} editId={editTourId} />;
            case 'support':
                return <AdminSupport />;
            case 'managers':
                return <AdminManagers />;
            case 'settings':
                return (
                    <div className="admin-settings-panel">
                        <section className="settings-block-admin">
                            <h3>{language === 'en' ? 'General Settings' : 'Загальні налаштування'}</h3>
                            <div className="settings-row">
                                <label>{language === 'en' ? 'Platform Name' : 'Назва платформи'}</label>
                                <input 
                                    type="text" 
                                    value={settings.platformName} 
                                    onChange={e => setSettings({...settings, platformName: e.target.value})}
                                />
                            </div>
                            <div className="settings-row">
                                <label>{language === 'en' ? 'Support Email' : 'Email підтримки'}</label>
                                <input 
                                    type="email" 
                                    value={settings.supportEmail} 
                                    onChange={e => setSettings({...settings, supportEmail: e.target.value})}
                                />
                            </div>
                            <div className="settings-row">
                                <label>{language === 'en' ? 'Currency' : 'Валюта'}</label>
                                <select 
                                    value={settings.currency}
                                    onChange={e => setSettings({...settings, currency: e.target.value})}
                                >
                                    <option value="UAH">₴ UAH</option>
                                    <option value="USD">$ USD</option>
                                    <option value="EUR">€ EUR</option>
                                </select>
                            </div>
                        </section>
                        <section className="settings-block-admin">
                            <h3>{language === 'en' ? 'Security' : 'Безпека'}</h3>
                            <div className="settings-row">
                                <label>{language === 'en' ? 'Session (hours)' : 'Сесія (годин)'}</label>
                                <input 
                                    type="number" 
                                    value={settings.sessionLimit} 
                                    min={1} 
                                    max={168} 
                                    onChange={e => setSettings({...settings, sessionLimit: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className="settings-row">
                                <label>{language === 'en' ? 'Two-Factor Auth' : 'Двофакторна автентифікація'}</label>
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.twoFactor}
                                        onChange={e => setSettings({...settings, twoFactor: e.target.checked})}
                                    />
                                    <span className="toggle-slider" />
                                </label>
                            </div>
                        </section>
                        <button 
                            className="btn-save-settings" 
                            disabled={isSaving}
                            onClick={() => {
                                setIsSaving(true);
                                setTimeout(() => {
                                    setIsSaving(false);
                                    alert(language === 'en' ? 'Settings saved locally!' : 'Налаштування збережено локально!');
                                }, 800);
                            }}
                        >
                            {isSaving ? (language === 'en' ? 'Saving...' : 'Збереження...') : (language === 'en' ? 'Save Settings' : 'Зберегти налаштування')}
                        </button>
                    </div>
                );
            default:
                return <AdminStats />;
        }
    };

    const getPageTitle = () => {
        const titles: Record<AdminTab, string> = {
            stats: t('admin.dashboard'),
            tours: t('admin.tours'),
            bookings: t('admin.bookings'),
            editor: editTourId ? (language === 'en' ? 'Edit Tour' : 'Редагування туру') : t('admin.new_tour'),
            support: t('admin.support'),
            managers: t('admin.managers'),
            settings: t('admin.settings'),
        };
        return titles[activeTab];
    };

    return (
        <div className={`admin-layout ${!isSidebarOpen ? 'collapsed' : ''}`}>
            <aside className="admin-sidebar" style={{ '--icon-size': '1.125rem' } as any}>
                <div className="admin-logo">
                    <div className="logo-pill" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icon name="pomelo" size={20} /> POMELO</div>
                    <div className="admin-tag">{(user?.role || 'staff')?.toUpperCase()} PANEL</div>
                </div>

                <nav className="admin-nav">
                    <p className="nav-group-label">{language === 'en' ? 'MAIN' : 'ГОЛОВНЕ'}</p>
                    <button
                        className={`admin-nav-item ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}
                    ><Icon name="dashboard" size={18} /> {t('admin.dashboard')}</button>
                    <button
                        className={`admin-nav-item ${activeTab === 'tours' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tours')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}
                    ><Icon name="plane" size={18} /> {t('admin.tours')}</button>
                    <button
                        className={`admin-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bookings')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}
                    ><Icon name="calendar" size={18} /> {t('admin.bookings')}</button>

                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                        <button
                            className={`admin-nav-item ${activeTab === 'managers' ? 'active' : ''}`}
                            onClick={() => setActiveTab('managers')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}
                        ><Icon name="users" size={18} /> {t('admin.managers')}</button>
                    )}

                    <div className="nav-divider" />

                    <p className="nav-group-label">{language === 'en' ? 'SUPPORT' : 'ПІДТРИМКА'}</p>
                    <button
                        className={`admin-nav-item ${activeTab === 'support' ? 'active' : ''}`}
                        onClick={() => setActiveTab('support')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}
                    ><Icon name="message" size={18} /> {language === 'en' ? 'Chats' : 'Чати'}</button>
                    <button
                        className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}
                    ><Icon name="settings" size={18} /> {t('admin.settings')}</button>

                    <div className="nav-divider" />
                    <a href="#home" className="admin-nav-item back-to-site-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}><Icon name="home" size={18} /> {t('admin.back_to_site')}</a>
                    <button className="admin-nav-item logout-btn" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}><Icon name="logout" size={18} /> {t('profile.logout')}</button>
                </nav>

                <div className="admin-user">
                    <div className="admin-avatar">{user?.full_name?.substring(0, 2).toUpperCase()}</div>
                    <div className="admin-user-info">
                        <span className="admin-name">{user?.full_name}</span>
                        <span className="admin-email">{user?.email}</span>
                    </div>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <button className="btn-toggle-sidebar" onClick={toggleSidebar}>
                            <Icon name={isSidebarOpen ? 'close' : 'menu'} size={20} />
                        </button>
                        <h1 className="admin-page-title">{getPageTitle()}</h1>
                    </div>
                    <div className="topbar-right">
                        <span className="admin-date">
                            {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        {activeTab === 'tours' && (
                            <button className="btn-new-tour" onClick={() => openEditor()}>+ {t('admin.new_tour')}</button>
                        )}
                    </div>
                </header>

                <div className="admin-content-area">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminPage;
