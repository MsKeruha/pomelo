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
    const { language, t, formatPrice, getErrorMessage, isLoading: isSettingsLoading } = useSettings();
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
    
    // Avatar state
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

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
                message: getErrorMessage(error, t('auth.error_msg')),
                type: 'error'
            });
        }
    };

    const handleTopUp = async () => {
        if (!amount || Number(amount) <= 0) return;

        if (!validateLuhn(cardNumber)) {
            setModalInfo({ 
                isOpen: true, 
                title: language === 'en' ? 'Invalid Card' : 'Невірна картка', 
                message: language === 'en' ? 'The card number is invalid (Luhn check failed).' : 'Невірний номер картки (помилка алгоритму Луна).', 
                type: 'error' 
            });
            return;
        }

        if (isExpired(cardExpiry)) {
            setModalInfo({ 
                isOpen: true, 
                title: language === 'en' ? 'Card Expired' : 'Картка протермінована', 
                message: language === 'en' ? 'Please check the expiry date.' : 'Будь ласка, перевірте термін дії картки.', 
                type: 'error' 
            });
            return;
        }

        if (cardCvv.length < 3) {
            setModalInfo({ 
                isOpen: true, 
                title: 'CVV', 
                message: language === 'en' ? 'Please enter a valid CVV.' : 'Будь ласка, введіть вірний CVV.', 
                type: 'error' 
            });
            return;
        }

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
                message: getErrorMessage(err, (language === 'en' ? 'Could not process payment. Check card data.' : 'Не вдалося обробити платіж. Перевірте дані карти.')),
                type: 'error'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelBooking = async (bookingId: number) => {
        if (!window.confirm(language === 'en' ? 'Are you sure you want to cancel this booking and get a refund?' : 'Ви впевнені, що хочете скасувати це бронювання та повернути кошти?')) {
            return;
        }

        try {
            await api.post(`/bookings/${bookingId}/cancel`);
            setModalInfo({
                isOpen: true,
                title: language === 'en' ? 'Cancelled' : 'Скасовано',
                message: language === 'en' ? 'Booking successfully cancelled and funds refunded.' : 'Бронювання скасовано, кошти повернуто на ваш баланс.',
                type: 'success'
            });
            fetchData(); // Refresh list and balance
        } catch (error: any) {
            setModalInfo({
                isOpen: true,
                title: language === 'en' ? 'Error' : 'Помилка',
                message: getErrorMessage(error, 'Failed to cancel booking'),
                type: 'error'
            });
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImage(reader.result as string);
                setIsAvatarModalOpen(true);
                setScale(1);
                setPosition({ x: 0, y: 0 });
            };
            reader.readAsDataURL(file);
        }
    };

    const validateLuhn = (num: string) => {
        const digits = num.replace(/\D/g, '');
        if (digits.length < 13) return false;
        let sum = 0;
        for (let i = 0; i < digits.length; i++) {
            let d = parseInt(digits[digits.length - 1 - i]);
            if (i % 2 !== 0) {
                d *= 2;
                if (d > 9) d -= 9;
            }
            sum += d;
        }
        return sum % 10 === 0;
    };

    const isExpired = (expiry: string) => {
        if (!/^\d{2}\/\d{2}$/.test(expiry)) return true;
        const [m, y] = expiry.split('/').map(Number);
        const now = new Date();
        const curY = now.getFullYear() % 100;
        const curM = now.getMonth() + 1;
        if (y < curY) return true;
        if (y === curY && m < curM) return true;
        if (m < 1 || m > 12) return true;
        return false;
    };

    const handleAvatarSave = async () => {
        if (!canvasRef.current) return;
        setIsProcessing(true);
        try {
            const canvas = canvasRef.current;
            // Wrap toBlob in a Promise so async/await works correctly
            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9);
            });

            if (!blob) {
                setIsProcessing(false);
                return;
            }

            const formData = new FormData();
            // Filename doesn't matter much now as backend renames it to UUID
            formData.append('file', blob, 'avatar.jpg');
            
            // This endpoint also updates the user's avatar_url in the DB
            await api.uploadAvatar(formData);

            setIsAvatarModalOpen(false);
            // Reload to refresh AuthContext with new avatar
            window.location.reload();
        } catch (err: any) {
            setModalInfo({
                isOpen: true,
                title: language === 'en' ? 'Error' : 'Помилка',
                message: getErrorMessage(err, 'Upload failed'),
                type: 'error'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (isAvatarModalOpen && selectedImage && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw circular mask for preview help
                const size = 200;
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;

                ctx.save();
                
                // Draw background image scaled and moved
                const drawWidth = img.width * scale;
                const drawHeight = img.height * scale;
                ctx.drawImage(
                    img, 
                    centerX + position.x - drawWidth / 2, 
                    centerY + position.y - drawHeight / 2,
                    drawWidth,
                    drawHeight
                );

                // Apply circular clip for final result preview
                ctx.globalCompositeOperation = 'destination-in';
                ctx.beginPath();
                ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            };
            img.src = selectedImage;
        }
    }, [isAvatarModalOpen, selectedImage, scale, position]);

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
                    <div 
                        className="avatar-large" 
                        onClick={() => fileInputRef.current?.click()}
                        style={{ 
                            backgroundImage: user.avatar_url ? `url(${user.avatar_url}?v=${Date.now()})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                    >
                        {!user.avatar_url && initials}
                        <div className="avatar-edit-hint">
                            <Icon name="edit" size={16} />
                        </div>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
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
                                                    {booking.status !== 'Cancelled' && (
                                                        <button 
                                                            className="btn-cancel-booking"
                                                            onClick={() => handleCancelBooking(booking.id)}
                                                            style={{
                                                                background: 'none',
                                                                border: '1px solid #ff4d4f',
                                                                color: '#ff4d4f',
                                                                padding: '0.5rem 1rem',
                                                                borderRadius: '1rem',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {language === 'en' ? 'Cancel' : 'Скасувати'}
                                                        </button>
                                                    )}
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

                {activeTab === 'settings' && (
                    <div className="settings-container-grid">
                        <section className="settings-block">
                            <h3 className="block-title">{language === 'en' ? 'Profile Settings' : 'Налаштування профілю'}</h3>
                            <div className="form-group"><label>{language === 'en' ? 'NAME' : "ІМ'Я"}</label><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}/></div>
                            <div className="form-group"><label>EMAIL</label><input type="text" value={email} onChange={(e) => setEmail(e.target.value)}/></div>
                            <button className="btn-save" onClick={handleUpdateProfile}>{language === 'en' ? 'Save Changes' : 'Зберегти зміни'}</button>
                        </section>

                        <section className="settings-block section-change-password">
                            <h3 className="block-title">{language === 'en' ? 'Security' : 'Безпека'}</h3>
                            <div className="form-group">
                                <label>{language === 'en' ? 'CURRENT PASSWORD' : 'ПОТОЧНИЙ ПАРОЛЬ'}</label>
                                <input type="password" id="old-pass" placeholder="••••••••" />
                            </div>
                            <div className="form-group">
                                <label>{language === 'en' ? 'NEW PASSWORD' : 'НОВИЙ ПАРОЛЬ'}</label>
                                <input type="password" id="new-pass" placeholder="••••••••" />
                            </div>
                            <button className="btn-save btn-secondary" onClick={async () => {
                                const oldPass = (document.getElementById('old-pass') as HTMLInputElement).value;
                                const newPass = (document.getElementById('new-pass') as HTMLInputElement).value;
                                if (!oldPass || !newPass) return;
                                if (newPass.length < 6 || newPass.length > 30) {
                                    setModalInfo({
                                        isOpen: true,
                                        title: t('profile.update_error', 'Помилка'),
                                        message: language === 'en' ? 'Password must be between 6 and 30 characters.' : 'Пароль має бути від 6 до 30 символів.',
                                        type: 'error'
                                    });
                                    return;
                                }
                                try {
                                    await api.put('/users/change-password', { old_password: oldPass, new_password: newPass });
                                    setModalInfo({ isOpen: true, title: t('profile.password_updated', 'Пароль оновлено'), message: t('profile.password_success', 'Ваш пароль успішно змінено.'), type: 'success' });
                                    (document.getElementById('old-pass') as HTMLInputElement).value = '';
                                    (document.getElementById('new-pass') as HTMLInputElement).value = '';
                                } catch (err: any) {
                                    setModalInfo({ isOpen: true, title: t('profile.update_error', 'Помилка'), message: getErrorMessage(err), type: 'error' });
                                }
                            }}>
                                {language === 'en' ? 'Update Password' : 'Оновити пароль'}
                            </button>
                        </section>
                    </div>
                )}
            </main>

            <Modal isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} title={t('wallet.topup')} hideFooter>
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
                            <input 
                                placeholder="08/25" 
                                value={cardExpiry} 
                                onChange={(e) => {
                                    let val = e.target.value.replace(/\D/g, '');
                                    if (val.length > 4) val = val.slice(0, 4);
                                    if (val.length > 2) {
                                        val = val.slice(0, 2) + '/' + val.slice(2);
                                    }
                                    setCardExpiry(val);
                                }} 
                            />
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

            <Modal 
                isOpen={isAvatarModalOpen} 
                onClose={() => setIsAvatarModalOpen(false)} 
                title={language === 'en' ? 'Edit Avatar' : 'Редагувати аватарку'}
                hideFooter={true}
            >
                <div className="avatar-cropper-container" style={{ textAlign: 'center' }}>
                    <div 
                        className="canvas-wrapper" 
                        style={{ 
                            position: 'relative', 
                            display: 'inline-block',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '4px solid var(--pomelo-green)',
                            cursor: 'move',
                            width: '200px',
                            height: '200px',
                            background: '#f0f0f0'
                        }}
                        onMouseDown={(e) => setDragStart({ x: e.clientX, y: e.clientY })}
                        onMouseMove={(e) => {
                            if (dragStart) {
                                setPosition({
                                    x: position.x + (e.clientX - dragStart.x),
                                    y: position.y + (e.clientY - dragStart.y)
                                });
                                setDragStart({ x: e.clientX, y: e.clientY });
                            }
                        }}
                        onMouseUp={() => setDragStart(null)}
                        onMouseLeave={() => setDragStart(null)}
                        onTouchStart={(e) => setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })}
                        onTouchMove={(e) => {
                            if (dragStart) {
                                setPosition({
                                    x: position.x + (e.touches[0].clientX - dragStart.x),
                                    y: position.y + (e.touches[0].clientY - dragStart.y)
                                });
                                setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
                            }
                        }}
                        onTouchEnd={() => setDragStart(null)}
                    >
                        <canvas 
                            ref={canvasRef} 
                            width={200} 
                            height={200} 
                        />
                    </div>
                    
                    <div className="cropper-controls" style={{ marginTop: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {language === 'en' ? 'ZOOM' : 'МАСШТАБ'}
                        </label>
                        <input 
                            type="range" 
                            min="0.1" 
                            max="3" 
                            step="0.05" 
                            value={scale} 
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--pomelo-green)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                        <button className="btn-admin-secondary" onClick={() => setIsAvatarModalOpen(false)} style={{ flex: 1 }}>
                            {language === 'en' ? 'Cancel' : 'Скасувати'}
                        </button>
                        <button className="btn-save-tour" onClick={handleAvatarSave} disabled={isProcessing} style={{ flex: 1 }}>
                            {isProcessing ? '...' : (language === 'en' ? 'Save' : 'Зберегти')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DashboardPage;
