import React, { useEffect, useState } from 'react';
import './DashboardPage.css';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { api, apiFetch } from '../api/client';
import Modal from '../components/common/Modal';
import Icon from '../components/common/Icon';
import type { IconName } from '../components/common/Icon';

type DashTab = 'bookings' | 'favorites' | 'settings' | 'notifications' | 'payments';

const DashboardPage: React.FC = () => {
    const { language, t, formatPrice, isLoading: isSettingsLoading } = useSettings();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<DashTab>('bookings');
    const [bookings, setBookings] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [balance, setBalance] = useState(user?.balance || 0);
    const [isLoading, setIsLoading] = useState(true);
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');

    // Top up modal state
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [amount, setAmount] = useState('5000');
    const [isProcessing, setIsProcessing] = useState(false);

    const [modalInfo, setModalInfo] = useState({
        isOpen: false, title: '', message: '', type: 'info' as 'info' | 'error' | 'success'
    });

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [bookingsRes, favoritesRes, userRes, transRes] = await Promise.all([
                api.get('/bookings/me'),
                api.get('/favorites/me'),
                api.get('/users/me'),
                api.get('/users/me/transactions')
            ]);
            setBookings(bookingsRes);
            setFavorites(favoritesRes);
            setBalance(userRes.balance);
            setTransactions(transRes);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
            setFullName(user.full_name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        try {
            await apiFetch('/users/update', {
                method: 'PUT',
                body: JSON.stringify({ full_name: fullName, email })
            });
            setModalInfo({
                isOpen: true,
                title: t('profile.profile_updated'),
                message: t('profile.update_success'),
                type: 'success'
            });
        } catch (error: any) {
            setModalInfo({
                isOpen: true,
                title: t('profile.update_error'),
                message: error.message || t('auth.error_msg'),
                type: 'error'
            });
        }
    };

    const handleTopUp = async () => {
        setIsProcessing(true);
        try {
            const res = await api.post('/users/me/topup', {
                card_number: cardNumber,
                card_expiry: cardExpiry,
                card_cvv: cardCvv,
                amount: parseFloat(amount)
            });
            setBalance(res.new_balance);
            setIsTopUpOpen(false);
            fetchData(); // Refresh history
            setModalInfo({
                isOpen: true,
                title: t('wallet.topup_success'),
                message: t('wallet.topup_success_msg')
                    .replace('{amount}', amount)
                    .replace('{balance}', formatPrice(res.new_balance)),
                type: 'success'
            });
            setCardNumber('');
            setCardExpiry('');
            setCardCvv('');
        } catch (err: any) {
            setModalInfo({
                isOpen: true,
                title: language === 'en' ? 'Payment Error' : 'Помилка оплати',
                message: err.message || (language === 'en' ? 'Could not process payment. Check card data.' : 'Не вдалося обробити платіж. Перевірте дані карти.'),
                type: 'error'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    if (!user || isSettingsLoading) return <div className="loading">{t('common.loading')}</div>;

    const initials = user.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U';

    const NAV_ITEMS: { tab: DashTab; icon: IconName; label: string }[] = [
        { tab: 'bookings', icon: 'plane', label: t('profile.bookings') },
        { tab: 'favorites', icon: 'heart', label: t('profile.favorites') },
        { tab: 'settings', icon: 'user', label: t('profile.settings') },
        { tab: 'payments', icon: 'credit-card', label: t('profile.wallet') },
    ];

    return (
        <div className="dashboard-container">
            <aside className="dashboard-sidebar">
                <div className="user-profile-large">
                    <div className="avatar-large">{initials}</div>
                    <h2 className="user-name">{user.full_name}</h2>
                    <p className="user-email">{user.email}</p>
                </div>

                <div className="divider" />

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(({ tab, icon, label }) => (
                        <button
                            key={tab}
                            className={`nav-item ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            <Icon name={icon} size={20} strokeWidth={activeTab === tab ? 2.5 : 2} /> {label}
                        </button>
                    ))}
                    <div className="divider" />
                    <button
                        className="nav-item logout"
                        onClick={logout}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}
                    >
                        <Icon name="logout" size={18} /> {t('profile.logout')}
                    </button>
                </nav>
            </aside>

            <main className="dashboard-main">
                <section className="loyalty-card">
                    <div className="loyalty-info">
                        <h3 className="loyalty-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Icon name="pomelo" size={24} /> Pomelo {user.role === 'admin' ? 'Elite' : 'Silver'}
                        </h3>
                        <p className="loyalty-subtitle">{t('profile.balance')}: <strong>{formatPrice(balance)}</strong></p>
                    </div>
                </section>

                {/* BOOKINGS TAB */}
                {activeTab === 'bookings' && (
                    <section className="bookings-section">
                        <h2 className="section-title">{t('profile.bookings')}</h2>
                        {isLoading ? (
                            <div className="loading-inline">{t('common.loading')}</div>
                        ) : bookings.length > 0 ? (
                            <div className="bookings-list">
                                {bookings.map((booking: any) => {
                                    const tourTitle = (language === 'en' && booking.tour?.title_en) ? booking.tour.title_en : booking.tour?.title;
                                    return (
                                        <div key={booking.id} className="booking-card-dashboard">
                                            <div className={`booking-status ${booking.status.toLowerCase()}`}>
                                                {booking.status === 'Confirmed' ? (
                                                    <span className="status-confirmed"><Icon name="check-circle" size={14} strokeWidth={2.5} /> {language === 'en' ? 'CONFIRMED' : 'ПІДТВЕРДЖЕНО'}</span>
                                                ) : booking.status === 'Cancelled' ? (
                                                    <span className="status-cancelled"><Icon name="x-circle" size={14} strokeWidth={2.5} /> {language === 'en' ? 'CANCELLED' : 'СКАСОВАНО'}</span>
                                                ) : (
                                                    <span className="status-pending"><Icon name="clock-loading" size={14} strokeWidth={2.5} /> {language === 'en' ? 'PENDING' : 'ОЧІКУЄТЬСЯ'}</span>
                                                )}
                                            </div>
                                            <div className="booking-info">
                                                <h4 className="booking-tour-name">{tourTitle || (language === 'en' ? 'Tour' : 'Тур')}</h4>
                                                <p className="booking-details">
                                                    {booking.date_range || '—'} · {booking.nights || '?'} {t('common.nights')} · {booking.people_count || '—'}
                                                </p>
                                                <div className="booking-actions">
                                                    <span className="booking-price">
                                                        {formatPrice(booking.total_price || 0)}
                                                    </span>
                                                    <button
                                                        className="btn-details"
                                                        onClick={() => window.location.hash = `tour/${booking.tour_id}`}
                                                    >
                                                        {t('tour.details')}
                                                    </button>
                                                </div>
                                            </div>
                                            <div
                                                className="booking-image-placeholder"
                                                style={{ backgroundImage: `url(${booking.tour?.image_url})`, backgroundSize: 'cover' }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>{language === 'en' ? 'You have no bookings yet.' : 'У вас ще немає бронювань.'}</p>
                                <a href="#search" className="btn-start-search">{language === 'en' ? 'Find a tour' : 'Знайти тур'}</a>
                            </div>
                        )}
                    </section>
                )}

                {/* FAVORITES TAB */}
                {activeTab === 'favorites' && (
                    <section className="bookings-section">
                        <h2 className="section-title">{t('profile.favorites')}</h2>
                        {favorites.length > 0 ? (
                            <div className="bookings-list">
                                {favorites.map((tour: any) => {
                                    const tourTitle = (language === 'en' && tour.title_en) ? tour.title_en : tour.title;
                                    const tourLocation = (language === 'en' && tour.location_en) ? tour.location_en : tour.location;
                                    return (
                                        <div key={tour.id} className="booking-card-dashboard" onClick={() => window.location.hash = `tour/${tour.id}`} style={{ cursor: 'pointer' }}>
                                            <div className="booking-info">
                                                <h4 className="booking-tour-name">{tourTitle}</h4>
                                                <p className="booking-details">{tourLocation} · {tour.stars}★</p>
                                                <div className="booking-actions">
                                                    <span className="booking-price">{t('tour.price_from')} {formatPrice(tour.price)}</span>
                                                    <Icon name="heart" size={18} fill="#ff4d4f" stroke="none" />
                                                </div>
                                            </div>
                                            <div className="booking-image-placeholder" style={{ backgroundImage: `url(${tour.image_url})`, backgroundSize: 'cover' }} />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                    <Icon name="heart" size={24} style={{ color: '#cbd5e1' }} /> {language === 'en' ? 'You have no saved tours yet.' : 'У вас ще немає збережених турів.'}
                                </p>
                                <a href="#search" className="btn-start-search">{language === 'en' ? 'View tours' : 'Переглянути тури'}</a>
                            </div>
                        )}
                    </section>
                )}

                {/* PAYMENTS TAB */}
                {activeTab === 'payments' && (
                    <section className="payments-section">
                        <h2 className="section-title">{t('profile.wallet')}</h2>
                        <div className="balance-hero">
                            <div className="balance-info">
                                <span className="label">{t('wallet.available')}</span>
                                <span className="value">{formatPrice(balance)}</span>
                            </div>
                            <button className="btn-topup-hero" onClick={() => setIsTopUpOpen(true)}>
                                <Icon name="credit-card" size={20} /> {t('wallet.topup')}
                            </button>
                        </div>
                        
                        <div className="payment-history-real">
                            <h3 className="block-title">{t('wallet.recent_transactions')}</h3>
                            <div className="history-list">
                                {transactions.length === 0 ? (
                                    <div className="empty-state">{t('wallet.no_transactions')}</div>
                                ) : (
                                    transactions.map(tx => (
                                        <div key={tx.id} className="history-item">
                                            <Icon 
                                                name={tx.type === 'deposit' ? 'credit-card' : 'plane'} 
                                                size={18} 
                                                strokeWidth={2.5}
                                                style={{ color: tx.type === 'deposit' ? '#10b981' : '#f7b731' }} 
                                            />
                                            <div className="hist-details">
                                                <span className="hist-title">
                                                    {tx.description || (tx.type === 'deposit' ? t('wallet.deposit') : t('wallet.payment'))}
                                                </span>
                                                <span className="hist-date">{new Date(tx.timestamp).toLocaleDateString(language === 'en' ? 'en-US' : 'uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                            </div>
                                            <span className={`hist-amount ${tx.type === 'deposit' ? 'positive' : 'negative'}`}>
                                                {tx.type === 'deposit' ? '+' : '-'} {formatPrice(tx.amount)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* SETTINGS */}
                {activeTab === 'settings' && (
                    <section className="settings-block">
                        <h3 className="block-title">{language === 'en' ? 'Profile Settings' : 'Налаштування профілю'}</h3>
                        <div className="form-group"><label>{language === 'en' ? 'NAME' : "ІМ'Я"}</label><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}/></div>
                        <div className="form-group"><label>EMAIL</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)}/></div>
                        <button className="btn-save" onClick={handleUpdateProfile}>{language === 'en' ? 'Save Changes' : 'Зберегти зміни'}</button>
                    </section>
                )}
            </main>

            {/* TOP UP MODAL WITH CARD UI */}
            <Modal isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} title={t('wallet.topup')}>
                <div className="card-payment-form">
                    <div className="stunning-card-box">
                        <div className="glass-card">
                            <div className="card-head">
                                <Icon name="pomelo" size={32} />
                                <span className="card-brand">VISA / MASTERCARD</span>
                            </div>
                            <div className="card-num-display">{cardNumber || '•••• •••• •••• ••••'}</div>
                            <div className="card-lower">
                                <div className="card-owner">
                                    <span className="lbl">{language === 'en' ? 'Owner' : 'Власник'}</span>
                                    <span className="val">{fullName.toUpperCase() || 'USER NAME'}</span>
                                </div>
                                <div className="card-exp">
                                    <span className="lbl">{language === 'en' ? 'Expires' : 'Діє до'}</span>
                                    <span className="val">{cardExpiry || 'MM/YY'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-inputs-grid">
                        <div className="f-group full">
                            <label>{language === 'en' ? 'CARD NUMBER' : 'НОМЕР КАРТКИ'}</label>
                            <input 
                                placeholder="4441 2223 4445 6667" 
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19))}
                            />
                        </div>
                        <div className="f-group">
                            <label>{language === 'en' ? 'EXPIRY DATE' : 'ТЕРМІН ДІЇ'}</label>
                            <input placeholder="08/25" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))} />
                        </div>
                        <div className="f-group">
                            <label>CVV</label>
                            <input type="password" placeholder="•••" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.slice(0, 3))} />
                        </div>
                        <div className="f-group full">
                            <label>{language === 'en' ? 'AMOUNT' : 'СУМА ПОПОВНЕННЯ'} (₴)</label>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                        </div>
                    </div>

                    <button className="btn-process-payment" onClick={handleTopUp} disabled={isProcessing}>
                        {isProcessing ? (language === 'en' ? 'Processing...' : 'Обробка...') : `${language === 'en' ? 'Top up' : 'Поповнити на'} ₴ ${amount}`}
                    </button>
                    <p className="secure-hint">🔐 {language === 'en' ? 'Secure connection. Data not stored.' : "Безпечне з'єднання. Дані не зберігаються."}</p>
                </div>
            </Modal>

            <Modal isOpen={modalInfo.isOpen} onClose={() => setModalInfo({ ...modalInfo, isOpen: false })} title={modalInfo.title} type={modalInfo.type}>{modalInfo.message}</Modal>
        </div>
    );
};

export default DashboardPage;
