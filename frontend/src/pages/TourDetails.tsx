import React, { useState, useEffect, useMemo } from 'react';
import './TourDetails.css';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Modal from '../components/common/Modal';
import Icon from '../components/common/Icon';
import StarRating from '../components/common/StarRating';

const NIGHTS_OPTIONS = [7, 10, 14];

interface TourDetailsProps {
    tourId?: number | null;
}

const TourDetails: React.FC<TourDetailsProps> = ({ tourId }) => {
    const { user } = useAuth();
    const { language, formatPrice, t, getErrorMessage } = useSettings();

    const AVAILABLE_DATES = useMemo(() => {
        const ukMonths = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
        const enMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const months = language === 'en' ? enMonths : ukMonths;
        
        if (language === 'en') {
            return [
                `August 14–21, 2025`,
                `August 22–29, 2025`,
                `September 5–12, 2025`,
                `September 19–26, 2025`,
            ];
        }
        return [
            `14–21 ${months[7]} 2025`,
            `22–29 ${months[7]} 2025`,
            `5–12 ${months[8]} 2025`,
            `19–26 ${months[8]} 2025`,
        ];
    }, [language]);

    const [tour, setTour] = useState<any>(null);
    const [isTourLoading, setIsTourLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const dynamicDates = useMemo(() => {
        if (tour?.available_dates) {
            return tour.available_dates.split(',').map((d: string) => d.trim());
        }
        return AVAILABLE_DATES;
    }, [tour, AVAILABLE_DATES]);

    const [activeTab, setActiveTab] = useState('Опис');
    const [selectedDate, setSelectedDate] = useState('');
    const [nights, setNights] = useState(7);
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showNightsPicker, setShowNightsPicker] = useState(false);
    const [showPeoplePicker, setShowPeoplePicker] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [showAllThumbnails, setShowAllThumbnails] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [newReviewText, setNewReviewText] = useState('');
    const [newReviewRating, setNewReviewRating] = useState(5);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' as 'info' | 'error' | 'success' });
    
    useEffect(() => {
        if (dynamicDates.length > 0) {
            setSelectedDate(dynamicDates[0]);
        }
    }, [dynamicDates]);

    useEffect(() => {
        const loadTour = async () => {
            setIsTourLoading(true);
            try {
                const targetId = tourId || 2; 
                const data = await api.get(`/tours/${targetId}`);
                setTour(data);
                setSelectedImage(data.image_url);
                
                const reviewData = await api.get(`/tours/${targetId}/reviews`);
                setReviews(reviewData);

                if (user) {
                    const favorites = await api.get('/favorites/me');
                    setIsFavorite(favorites.some((f: any) => f.id === data.id));
                }
            } catch (err) {
                console.error('Failed to load tour:', err);
            } finally {
                setIsTourLoading(false);
            }
        };
        loadTour();
    }, [tourId, user]);

    const BASE_PRICE = tour?.price || 0;
    const nightMultiplier = nights / 7;
    const adjustedPrice = Math.round(BASE_PRICE * nightMultiplier);
    const CHILD_PRICE = Math.round(adjustedPrice * 0.5);

    const adultTotal = adults * adjustedPrice;
    const childTotal = children * CHILD_PRICE;

    // Logic: Welcome Bonus (5%) for first tour, else 1% per 2 confirmed bookings (max 10%)
    const loyaltyDiscount = useMemo(() => {
        if (!user) return 0;
        
        const count = user.bookings_count || 0;
        if (count === 0) {
            return Math.round(adultTotal * 0.05); // 5% Welcome Bonus
        }
        
        const loyaltyPercent = Math.min(0.10, Math.floor(count / 2) * 0.01 + 0.01);
        return Math.round(adultTotal * loyaltyPercent);
    }, [user, adultTotal]);

    const discountLabel = useMemo(() => {
        if (!user) return '';
        const count = user.bookings_count || 0;
        return count === 0 
            ? (language === 'en' ? 'Welcome Bonus (5%)' : 'Вітальний бонус (5%)')
            : (language === 'en' ? `Loyalty Discount (${Math.min(10, Math.floor(count / 2) * 1 + 1)}%)` : `Знижка лояльності (${Math.min(10, Math.floor(count / 2) * 1 + 1)}%)`);
    }, [user, language]);

    const serviceFee = useMemo(() => {
        return Number(publicSettings.service_fee || 0);
    }, [publicSettings.service_fee]);

    const grandTotal = adultTotal + childTotal + serviceFee - loyaltyDiscount;

    const getBadgeLabel = (badge: string) => {
        if (language === 'en') {
            if (badge === 'АКЦІЯ') return 'PROMO';
            if (badge === 'НОВИНКА') return 'NEW';
            return badge;
        }
        return badge;
    };

    const peopleLabel = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
            <Icon name="users" size={16} /> 
            <span>
                {adults} {adults === 1 ? t('common.adult') : t('common.adults')}
                {children > 0 ? ` · ${children} ${children === 1 ? t('common.child') : t('common.children')}` : ''}
            </span>
            <span style={{ marginLeft: 'auto', opacity: 0.5 }}>▾</span>
        </div>
    );

    const handleToggleFavorite = async () => {
        if (!user) {
            window.location.hash = 'auth';
            return;
        }
        try {
            const res = await api.post(`/favorites/${tour.id}`);
            setIsFavorite(res.status === 'added');
        } catch (err) {
            console.error('Favorite toggle failed:', err);
        }
    };

    const handlePostReview = async () => {
        if (!newReviewText.trim()) return;
        try {
            const res = await api.post('/reviews', {
                tour_id: tour.id,
                rating: newReviewRating,
                text: newReviewText
            });
            setReviews([res, ...reviews]);
            setNewReviewText('');
        } catch (err) {
            console.error('Failed to post review:', err);
        }
    };

    const handleDeleteReview = async (reviewId: number) => {
        try {
            await api.delete(`/reviews/${reviewId}`);
            setReviews(reviews.filter(r => r.id !== reviewId));
        } catch (err) {
            console.error('Failed to delete review:', err);
        }
    };

    const handleBook = async () => {
        if (!user) {
            window.location.hash = 'auth';
            return;
        }
        setIsBooking(true);
        try {
            const travelersStr = `${adults} ${adults === 1 ? t('common.adult') : t('common.adults')}${children > 0 ? `, ${children} ${children === 1 ? t('common.child') : t('common.children')}` : ''}`;
            
            await api.post('/bookings', {
                tour_id: tour?.id,
                date_range: selectedDate,
                nights,
                people_count: travelersStr,
                total_price: grandTotal,
            });
            
            setModal({
                isOpen: true,
                title: <><Icon name="check-circle" size={24} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> {t('booking.success_title')}</>,
                message: t('book.success_msg') || `Tour successfully booked.`,
                type: 'success',
            });
        } catch (err: any) {
            setModal({
                isOpen: true,
                title: t('book.error_title'),
                message: getErrorMessage(err, t('book.error_msg')),
                type: 'error',
            });
        } finally {
            setIsBooking(false);
        }
    };

    if (isTourLoading) return (
        <div className="loading-screen">
            <Icon name="pomelo" size={32} className="spin-anim" style={{ marginBottom: '1rem' }} /> 
            {t('common.loading')}
        </div>
    );

    if (!tour) return <div className="loading-screen">{t('search.no_tours')}</div>;

    const displayLocation = language === 'en' ? (tour.location_en || tour.location) : tour.location;
    const displayCategory = language === 'en' ? (tour.category?.name_en || tour.category?.name) : tour.category?.name;
    const displayTitle = language === 'en' ? (tour.title_en || tour.title) : tour.title;

    const tabs = [
        { key: 'Опис', label: t('tab.desc') },
        { key: 'Проживання', label: t('tab.acc') },
        { key: 'Перельоти', label: t('tab.flights') },
        { key: 'Програма', label: t('tab.program') },
        { key: 'Відгуки', label: `${t('tab.reviews')} (${reviews.length})` }
    ];

    return (
        <div className="tour-details-container">
            <nav className="breadcrumb">
                <a href="#home">{t('nav.home')}</a> › <a href="#search">{t('nav.tours')}</a> › <span className="active">{displayTitle}</span>
            </nav>

            <div className="tour-info-layout">
                <div className="tour-main-content">
                    <section className="image-gallery">
                        <div className="main-image-placeholder" style={selectedImage ? { backgroundImage: `url(${selectedImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                            {tour.badge && <span className="tour-badge">{getBadgeLabel(tour.badge)}</span>}
                            <div className="image-overlay-info">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <p className="gallery-subtitle" style={{ marginBottom: 0 }}>{displayLocation}</p>
                                    {tour.category && (
                                        <span className="tour-category-tag-detail">
                                            <Icon name={tour.category.emoji as any} size={14} strokeWidth={2.5} />
                                            {displayCategory}
                                        </span>
                                    )}
                                </div>
                                <h1 className="gallery-title">{displayTitle}</h1>
                            </div>
                        </div>
                        
                        <div className="thumbnail-strip" style={{ flexWrap: 'wrap' }}>
                                 {(() => {
                                    const allImages = [tour.image_url, ...(tour.gallery_urls?.split(',').map((u: string) => u.trim()) || [])].filter(Boolean);
                                    const displayed = showAllThumbnails ? allImages : allImages.slice(0, 4);
                                    
                                    return displayed.map((img, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`thumb ${selectedImage === img ? 'active' : ''}`}
                                            style={{ backgroundImage: `url(${img})` }}
                                            onClick={() => setSelectedImage(img)}
                                        />
                                    ));
                                })()}
                            
                            {(tour.gallery_urls?.split(',').length || 0) > 3 && !showAllThumbnails && (
                                <div 
                                    className="thumb thumb-more" 
                                    onClick={(e) => { e.stopPropagation(); setShowAllThumbnails(true); }}
                                >
                                    +{(tour.gallery_urls?.split(',').length || 0) - 3}
                                </div>
                            )}
                        </div>
                    </section>

                    <nav className="info-tabs">
                        {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.key)}
                                >
                                    {tab.label}
                                </button>
                        ))}
                    </nav>

                    <section className="tab-content">
                        {activeTab === 'Опис' && (
                            <div className="description-tab">
                                <h2 className="tab-title">{t('tour.about')}</h2>
                                <p className="tab-text">
                                    {(language === 'en' ? (tour.description_en || tour.description) : tour.description) || `${displayTitle} — ${t('tour.description_fallback')} ${displayLocation}.`}
                                </p>
                                <h3 className="amenities-title">{t('tour.amenities')}</h3>
                                <div className="amenities-grid">
                                    {(tour.amenities || 'wifi,restaurant').split(',').map((id: string) => {
                                        const uid = id.trim();
                                        // Simple mapping for labels if needed, or use t()
                                        const labels: any = {
                                            pool: t('amenity.pool'),
                                            beach: t('amenity.beach'),
                                            spa: t('amenity.spa'),
                                            restaurant: t('amenity.restaurant'),
                                            gym: t('amenity.gym'),
                                            wifi: t('amenity.wifi'),
                                            party: language === 'en' ? 'Entertainment' : 'Розваги',
                                            mountain: language === 'en' ? 'Mountains' : 'Гори',
                                            ship: language === 'en' ? 'Cruise' : 'Круїз',
                                            lion: language === 'en' ? 'Safari' : 'Сафарі',
                                            skis: language === 'en' ? 'Skiing' : 'Лижі',
                                            city: language === 'en' ? 'City' : 'Місто',
                                            anchor: language === 'en' ? 'Port' : 'Порт'
                                        };
                                        return (
                                            <div key={uid} className="amenity-item" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                <Icon name={uid as any} size={16} /> 
                                                {labels[uid] || uid}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {activeTab === 'Відгуки' && (
                            <div className="description-tab">
                                <h2 className="tab-title">{t('tab.reviews')}</h2>
                                {user && (
                                    <div className="write-review-box">
                                        <div className="review-rating-select">
                                            {[1,2,3,4,5].map(s => (
                                                <button key={s} onClick={() => setNewReviewRating(s)}>
                                                    <Icon name="star" size={20} style={{ color: s <= newReviewRating ? '#ffd700' : '#ddd' }} />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea 
                                            placeholder={t('tour.review_placeholder')}
                                            value={newReviewText}
                                            onChange={(e) => setNewReviewText(e.target.value)}
                                        />
                                        <button className="btn-send-review" onClick={handlePostReview} disabled={!newReviewText.trim()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Icon name="send" size={16} />
                                            {language === 'en' ? 'Send' : 'Надіслати'}
                                        </button>
                                    </div>
                                )}
                                <div className="reviews-list">
                                    {reviews.length === 0 ? <p className="no-reviews">{t('tour.no_reviews')}</p> : reviews.map(r => (
                                        <div key={r.id} className="review-item">
                                            <div className="review-header">
                                                <div className="review-user-info">
                                                    <span className="review-user">{r.user?.full_name || (language === 'en' ? 'Guest' : 'Гість')}</span>
                                                    <div className="review-stars-row">
                                                        <StarRating rating={r.rating} size={12} />
                                                    </div>
                                                </div>
                                                {user && (user.id === r.user_id || user.role === 'admin') && (
                                                    <button className="btn-delete-review" title={language === 'en' ? 'Delete review' : 'Видалити відгук'} onClick={() => handleDeleteReview(r.id)}><Icon name="trash" size={14} /></button>
                                                )}
                                            </div>
                                            <p className="review-text">{r.text}</p>
                                            <div className="review-footer">
                                                <span className="review-date">{new Date(r.timestamp).toLocaleDateString(language === 'en' ? 'en-US' : 'uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'Проживання' && (
                            <div className="description-tab">
                                <h2 className="tab-title">{t('tour.accommodation')}</h2>
                                <p className="tab-text">{(language === 'en' ? (tour.accommodation_en || tour.accommodation) : tour.accommodation) || t('common.loading')}</p>
                            </div>
                        )}
                        {activeTab === 'Перельоти' && (
                            <div className="description-tab">
                                <h2 className="tab-title">{t('tour.flights')}</h2>
                                <p className="tab-text">{(language === 'en' ? (tour.flights_en || tour.flights) : tour.flights) || t('common.loading')}</p>
                            </div>
                        )}
                        {activeTab === 'Програма' && (
                            <div className="description-tab">
                                <h2 className="tab-title">{t('tour.program')}</h2>
                                <p className="tab-text">{(language === 'en' ? (tour.program_en || tour.program) : tour.program) || t('common.loading')}</p>
                            </div>
                        )}
                    </section>
                </div>

                <aside className="booking-sidebar">
                    <div className="booking-card">
                        <div className="booking-price-header">
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {tour.meal_type && (
                                    <span className="meal-type-tag" style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Icon name="restaurant" size={12} /> {tour.meal_type}
                                    </span>
                                )}
                                {tour.original_price && (
                                    <span className="old-price-sidebar" style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                                        {formatPrice(tour.original_price * nightMultiplier)}
                                    </span>
                                )}
                                <span className="price-value">{formatPrice(adjustedPrice)}</span>
                            </div>
                            <span className="price-label">{t('tour.per_person')} · {nights} {t('common.nights')}</span>
                        </div>
                        <div className="booking-form">
                            <div className="input-group" style={{ position: 'relative' }}>
                                <label>{t('booking.date')}</label>
                                <div className="form-input clickable" onClick={() => setShowDatePicker(!showDatePicker)}>
                                    <Icon name="calendar" size={16} /> 
                                    <span style={{ flex: 1 }}>{selectedDate}</span>
                                    <Icon name="settings" size={12} style={{ opacity: 0.5 }} />
                                </div>
                                {showDatePicker && <div className="picker-dropdown">{dynamicDates.map(d => <div key={d} className="picker-option" onClick={() => { setSelectedDate(d); setShowDatePicker(false); }}>{d}</div>)}</div>}
                            </div>
                            <div className="input-group" style={{ position: 'relative' }}>
                                <label>{t('booking.nights')}</label>
                                <div className="form-input clickable" onClick={() => setShowNightsPicker(!showNightsPicker)}>
                                    <Icon name="moon" size={16} />
                                    <span style={{ flex: 1 }}>{nights} {t('common.nights')}</span>
                                    <Icon name="settings" size={12} style={{ opacity: 0.5 }} />
                                </div>
                                {showNightsPicker && <div className="picker-dropdown">{NIGHTS_OPTIONS.map(n => <div key={n} className="picker-option" onClick={() => { setNights(n); setShowNightsPicker(false); }}>{n} {t('common.nights')}</div>)}</div>}
                            </div>
                            <div className="input-group full" style={{ position: 'relative' }}>
                                <label>{t('booking.travelers')}</label>
                                <div className="form-input clickable" onClick={() => setShowPeoplePicker(!showPeoplePicker)}>
                                    {peopleLabel}
                                </div>
                                {showPeoplePicker && (
                                    <div className="picker-dropdown">
                                        <div className="people-row">
                                            <span>{t('common.adults')}</span>
                                            <div className="counter-row">
                                                <button className="counter-btn" onClick={() => setAdults(Math.max(1, adults-1))}>−</button>
                                                <span>{adults}</span>
                                                <button className="counter-btn" onClick={() => setAdults(adults+1)}>+</button>
                                            </div>
                                        </div>
                                        <div className="people-row">
                                            <span>{t('common.children')}</span>
                                            <div className="counter-row">
                                                <button className="counter-btn" onClick={() => setChildren(Math.max(0, children-1))}>−</button>
                                                <span>{children}</span>
                                                <button className="counter-btn" onClick={() => setChildren(children+1)}>+</button>
                                            </div>
                                        </div>
                                        <button className="btn-apply-people" onClick={() => setShowPeoplePicker(false)}>{t('common.done')}</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="price-summary">
                            <div className="summary-row"><span>{adults} {t('common.adults')} × {formatPrice(adjustedPrice)}</span><span>{formatPrice(adultTotal)}</span></div>
                            {children > 0 && <div className="summary-row"><span>{children} {t('common.children')} × {formatPrice(CHILD_PRICE)}</span><span>{formatPrice(childTotal)}</span></div>}
                            {serviceFee > 0 && <div className="summary-row"><span>{language === 'en' ? 'Service Fee' : 'Сервісний збір'}</span><span>{formatPrice(serviceFee)}</span></div>}
                            {loyaltyDiscount > 0 && <div className="summary-row discount"><span>{discountLabel}</span><span className="discount-val">–{formatPrice(loyaltyDiscount)}</span></div>}
                            <div className="summary-row total"><span>{t('booking.total')}</span><span>{formatPrice(grandTotal)}</span></div>
                        </div>
                        <button className="btn-final-book" onClick={handleBook} disabled={isBooking}>{isBooking ? t('booking.processing') : `${t('booking.book_btn')} →`}</button>
                    </div>
                    <p className="booking-hint">{language === 'en' ? 'Free cancellation up to 48h before flight' : 'Безкоштовне скасування за 48г до вильоту'}</p>
                </aside>
            </div>
            <Modal isOpen={modal.isOpen} onClose={() => { setModal({ ...modal, isOpen: false }); if (modal.type === 'success') window.location.hash = 'dashboard'; }} title={modal.title} type={modal.type}>{modal.message}</Modal>
        </div>
    );
};

export default TourDetails;
