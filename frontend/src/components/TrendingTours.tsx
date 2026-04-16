import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import TourCard from './TourCard';
import Icon from './common/Icon';
import { useSettings } from '../context/SettingsContext';
import './TrendingTours.css';

const TrendingTours: React.FC = () => {
    const { t } = useSettings();
    const [tours, setTours] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTours = async () => {
            try {
                // Fetch first 3 tours as trending
                const data = await api.get('/tours');
                setTours(data.slice(0, 3));
            } catch (error) {
                console.error('Failed to fetch tours:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTours();
    }, []);

    return (
        <section className="trending-section">
            <div className="section-header">
                <div>
                    <h2 className="section-title">{t('trending.title', 'Популярні тури')}</h2>
                    <p className="section-subtitle">{t('trending.subtitle', 'Те, що обирають наші клієнти найчастіше')}</p>
                </div>
                <button className="btn-view-all" onClick={() => window.location.hash = 'search'}>
                    {t('see_all', 'Дивитися всі')} <Icon name="arrow-right" size={18} />
                </button>
            </div>
            {isLoading ? (
                <div className="loading-grid">{t('loading', 'Завантаження турів...')}</div>
            ) : (
                <div className="tours-grid">
                    {tours.map((tour) => (
                        <TourCard key={tour.id} tour={tour} />
                    ))}
                    {tours.length === 0 && <p className="empty-msg" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>{t('no_tours', 'Турів поки немає. Поверніться пізніше!')} <Icon name="pomelo" size={16} /></p>}
                </div>
            )}
        </section>
    );
};

export default TrendingTours;
