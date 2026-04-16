import React, { useState } from 'react';
import AdminStats from '../components/admin/AdminStats';
import AdminTours from '../components/admin/AdminTours';
import AdminTourEditor from '../components/admin/AdminTourEditor';
import AdminBookings from '../components/admin/AdminBookings';
import AdminSupport from '../components/admin/AdminSupport';
import AdminManagers from '../components/admin/AdminManagers';
import AdminCategories from '../components/admin/AdminCategories';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Icon from '../components/common/Icon';
import Modal from '../components/common/Modal';
import { api } from '../api/client';
import './AdminPage.css';

type AdminTab = 'stats' | 'tours' | 'bookings' | 'categories' | 'editor' | 'support' | 'managers' | 'settings';

const AdminPage: React.FC = () => {
    const { user, logout } = useAuth();
    const { t, language } = useSettings();
    const [activeTab, setActiveTab] = useState<AdminTab>('stats');
    const [prevTab, setPrevTab] = useState<AdminTab>('tours');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [editTourId, setEditTourId] = useState<number | null>(null);
    const [systemSettings, setSystemSettings] = useState<any[]>([]);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchSystemSettings = async () => {
        try {
            const data = await api.get('/admin/settings');
            setSystemSettings(data);
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'settings') {
            fetchSystemSettings();
        }
    }, [activeTab]);

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
            case 'categories':
                return <AdminCategories />;
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
                            <h3>{language === 'en' ? 'Financials' : 'Фінанси'}</h3>
                            <div className="settings-row">
                                <label>{language === 'en' ? 'Global Markup (%)' : 'Націнка (%)'}</label>
                                <input 
                                    type="number" 
                                    value={systemSettings.find(s => s.name === 'commission_rate')?.value || ''} 
                                    onChange={e => {
                                        const newSets = [...systemSettings];
                                        const idx = newSets.findIndex(s => s.name === 'commission_rate');
                                        if (idx !== -1) newSets[idx].value = e.target.value;
                                        else newSets.push({ name: 'commission_rate', value: e.target.value, group: 'financial' });
                                        setSystemSettings(newSets);
                                    }}
                                />
                            </div>
                            <div className="settings-row">
                                <label>{language === 'en' ? 'Service Fee (₴)' : 'Сервісний збір (₴)'}</label>
                                <input 
                                    type="number" 
                                    value={systemSettings.find(s => s.name === 'service_fee')?.value || ''} 
                                    onChange={e => {
                                        const newSets = [...systemSettings];
                                        const idx = newSets.findIndex(s => s.name === 'service_fee');
                                        if (idx !== -1) newSets[idx].value = e.target.value;
                                        else newSets.push({ name: 'service_fee', value: e.target.value, group: 'financial' });
                                        setSystemSettings(newSets);
                                    }}
                                />
                            </div>
                        </section>

                        <section className="settings-block-admin">
                            <h3>{language === 'en' ? 'Support & Contacts' : 'Підтримка та Контакти'}</h3>
                            <div className="settings-row">
                                <label>Phone</label>
                                <input 
                                    type="text" 
                                    value={systemSettings.find(s => s.name === 'support_phone')?.value || ''} 
                                    onChange={e => {
                                        const newSets = [...systemSettings];
                                        const idx = newSets.findIndex(s => s.name === 'support_phone');
                                        if (idx !== -1) newSets[idx].value = e.target.value;
                                        else newSets.push({ name: 'support_phone', value: e.target.value, group: 'contacts' });
                                        setSystemSettings(newSets);
                                    }}
                                />
                            </div>
                            <div className="settings-row">
                                <label>Telegram Link</label>
                                <input 
                                    type="text" 
                                    value={systemSettings.find(s => s.name === 'telegram_link')?.value || ''} 
                                    onChange={e => {
                                        const newSets = [...systemSettings];
                                        const idx = newSets.findIndex(s => s.name === 'telegram_link');
                                        if (idx !== -1) newSets[idx].value = e.target.value;
                                        else newSets.push({ name: 'telegram_link', value: e.target.value, group: 'contacts' });
                                        setSystemSettings(newSets);
                                    }}
                                />
                            </div>
                        </section>

                        <section className="settings-block-admin">
                            <h3>{language === 'en' ? 'Operations' : 'Операції'}</h3>
                            <div className="settings-row">
                                <label>{language === 'en' ? 'Maintenance Mode' : 'Технічні роботи'}</label>
                                <div className="toggle-switch-admin" onClick={() => {
                                    const newSets = [...systemSettings];
                                    const idx = newSets.findIndex(s => s.name === 'maintenance_mode');
                                    const nextVal = (systemSettings[idx]?.value === 'true' ? 'false' : 'true');
                                    if (idx !== -1) newSets[idx].value = nextVal;
                                    else newSets.push({ name: 'maintenance_mode', value: nextVal, group: 'operations' });
                                    setSystemSettings(newSets);
                                }}>
                                    <div className={`switch-knob ${systemSettings.find(s => s.name === 'maintenance_mode')?.value === 'true' ? 'active' : ''}`} />
                                </div>
                            </div>
                        </section>

                        <button 
                            className="btn-save-settings" 
                            disabled={isSaving}
                            onClick={async () => {
                                setIsSaving(true);
                                try {
                                    // Save all changed settings
                                    for (const s of systemSettings) {
                                        await api.put(`/admin/settings/${s.name}`, { value: String(s.value) });
                                    }
                                    setIsStatusModalOpen(true);
                                } catch (err) {
                                    alert('Failed to save settings');
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                        >
                            {isSaving ? (language === 'en' ? 'Saving...' : 'Збереження...') : (language === 'en' ? 'Save Settings' : 'Зберегти налаштування')}
                        </button>

                        <Modal 
                            isOpen={isStatusModalOpen} 
                            onClose={() => setIsStatusModalOpen(false)}
                            title={language === 'en' ? 'Success' : 'Успіх'}
                            hideFooter={true}
                        >
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    background: 'rgba(168, 208, 141, 0.1)', 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    margin: '0 auto 20px'
                                }}>
                                    <Icon name="check" size={48} style={{ color: 'var(--pomelo-green)' }} />
                                </div>
                                <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '20px' }}>
                                    {language === 'en' ? 'Settings saved successfully!' : 'Налаштування успішно збережено!'}
                                </p>
                                <button 
                                    className="btn-save-settings" 
                                    onClick={() => setIsStatusModalOpen(false)}
                                    style={{ alignSelf: 'center' }}
                                >
                                    {language === 'en' ? 'Close' : 'Закрити'}
                                </button>
                            </div>
                        </Modal>
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
            categories: language === 'en' ? 'Categories' : 'Категорії',
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
                    <button
                        className={`admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => setActiveTab('categories')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}
                    ><Icon name="settings" size={18} /> {language === 'en' ? 'Categories' : 'Категорії'}</button>

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
