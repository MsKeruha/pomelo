import React from 'react';
import './TourCard.css';
import Icon from './common/Icon';
import { useSettings } from '../context/SettingsContext';

export interface Tour {
    id: number;
    title: string;
    description?: string;
    price: number;
    original_price?: number;
    image_url?: string;
    location: string;
    stars?: number;
    average_rating?: number;
    reviews_count?: number;
    created_at?: string;
    image_gradient?: string;
    badge?: string;
    category_id?: number;
    category?: {
        id: number;
        name: string;
        name_en?: string;
        emoji?: string;
    };
    // Added localization fields
    title_en?: string;
    location_en?: string;
    description_en?: string;
}

interface TourCardProps {
    tour: Tour;
    variant?: 'vertical' | 'horizontal';
    onBook?: (id: number) => void;
}

const TourCard: React.FC<TourCardProps> = ({ tour, variant = 'vertical', onBook }) => {
    const { language, formatPrice, t } = useSettings();



    const getBadgeLabel = (badge: string) => {
        if (language === 'en') {
            if (badge === 'АКЦІЯ') return 'PROMO';
            if (badge === 'НОВИНКА') return 'NEW';
            return badge;
        }
        return badge;
    };
    
    const displayTitle = (language === 'en' && tour.title_en) ? tour.title_en : tour.title;
    const displayLocation = (language === 'en' && tour.location_en) ? tour.location_en : tour.location;
    const displayCategory = tour.category 
        ? ((language === 'en' && (tour.category as any).name_en) ? (tour.category as any).name_en : tour.category.name)
        : null;

    return (
        <div 
            className={`tour-card ${variant}`}
            onClick={() => window.location.hash = `tour/${tour.id}`}
        >
            <div className="card-image-wrapper">
                <div 
                    className="card-image-placeholder"
                    style={{ 
                        backgroundImage: tour.image_url ? `url(${tour.image_url})` : 'none',
                        '--image-gradient': tour.image_gradient
                    } as any}
                />
                
                {tour.badge && (
                    <div className={`card-badge ${
                        tour.badge === 'TOP' ? 'badge-top' : 
                        tour.badge === 'АКЦІЯ' ? 'badge-promo' : 'badge-new'
                    }`}>
                        {getBadgeLabel(tour.badge)}
                    </div>
                )}
            </div>
            
            <div className="card-content">
                <div className="card-top-info">
                    <div className="card-category-strip">
                        {tour.category && (
                            <span className="card-category-tag">
                                <Icon name={tour.category.emoji as any} size={14} strokeWidth={2.5} /> {displayCategory}
                            </span>
                        )}
                    </div>

                    <div className="card-header-info">
                        <h3 className="card-title">{displayTitle}</h3>
                        <p className="card-hotel-name">
                            <Icon name="map" size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                            {displayLocation}
                        </p>
                    </div>
                    
                    <div className="card-stats">
                        <div className="card-stars">
                            {tour.reviews_count && tour.reviews_count > 0 ? (
                                <>
                                    <span className="rating-value">{(tour.average_rating || 0).toFixed(1)}</span>
                                    {'★'.repeat(Math.round(tour.average_rating || 0))}{'☆'.repeat(5 - Math.round(tour.average_rating || 0))}
                                </>
                            ) : (
                                <span className="new-tour-tag">{language === 'en' ? 'NEW' : 'НОВИНКА'}</span>
                            )}
                        </div>
                        <span className="card-reviews">
                            {tour.reviews_count || 0} {t('tour.reviews', 'відгуків')}
                        </span>
                    </div>
                </div>
                
                <div className="card-footer">
                    <div className="card-price-info">
                        <span className="card-price-label">{t('tour.price_from', 'від')}</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            {tour.original_price && (
                                <span className="card-old-price" style={{ textDecoration: 'line-through', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                                    {formatPrice(tour.original_price)}
                                </span>
                            )}
                            <span className="card-price">{formatPrice(tour.price)}</span>
                        </div>
                    </div>
                    
                    <button 
                        className="btn-book"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onBook) {
                                onBook(tour.id);
                            } else {
                                window.location.hash = `tour/${tour.id}`;
                            }
                        }}
                    >
                        {t('tour.book', 'Забронювати')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TourCard;
