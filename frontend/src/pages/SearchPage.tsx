import React, { useEffect, useState, useCallback } from 'react';
import SidebarFilters from '../components/SidebarFilters';
import TourCard from '../components/TourCard';
import { api } from '../api/client';
import Icon from '../components/common/Icon';
import { useSettings } from '../context/SettingsContext';
import './SearchPage.css';

type SortType = 'newest' | 'price_asc' | 'price_desc' | 'rating_desc';

const SORT_LABELS: Record<string, Record<'uk' | 'en', string>> = {
    newest: { uk: 'Новинки', en: 'Newest' },
    price_asc: { uk: 'Ціна ↑', en: 'Price ↑' },
    price_desc: { uk: 'Ціна ↓', en: 'Price ↓' },
    rating_desc: { uk: 'Рейтинг ↓', en: 'Rating ↓' },
};

const PAGE_SIZE = 6;

const SearchPage: React.FC = () => {
    const { language, t, getErrorMessage } = useSettings();
    const [allTours, setAllTours] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sortType, setSortType] = useState<SortType>('newest');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string | null>(null);

    const [maxPricePercent, setMaxPricePercent] = useState(100);
    const [activeStars, setActiveStars] = useState<number[]>([]);
    const [activeMeals, setActiveMeals] = useState<string[]>([]);

    const [minPrice, setMinPrice] = useState(5000);
    const [maxPrice, setMaxPrice] = useState(150000);

    useEffect(() => {
        if (allTours.length > 0) {
            const prices = allTours.map(t => t.price);
            setMinPrice(Math.floor(Math.min(...prices)));
            setMaxPrice(Math.ceil(Math.max(...prices)));
        }
    }, [allTours]);

    useEffect(() => {
        const fetchTours = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await api.get('/tours');
                setAllTours(data);
            } catch (error: any) {
                console.error('Failed to fetch tours:', error);
                setError(getErrorMessage(error));
            } finally {
                setIsLoading(false);
            }
        };
        fetchTours();
    }, []);

    // check url for filters
    useEffect(() => {
        const handleParams = () => {
            const hash = window.location.hash;
            if (hash.includes('?')) {
                const params = new URLSearchParams(hash.split('?')[1]);
                const cat = params.get('cat');
                const dest = params.get('destination');
                
                // Update state from URL (or null if missing)
                setActiveCategory(cat || null);
                setSearchQuery(dest || null);
                setCurrentPage(1); // Reset to first page on filter change
            } else {
                // If no params, reset specific URL-driven filters
                setActiveCategory(null);
                setSearchQuery(null);
            }
        };

        handleParams(); // Initial parse on mount
        window.addEventListener('hashchange', handleParams);
        return () => window.removeEventListener('hashchange', handleParams);
    }, []);

    const maxPriceValue = Math.round(minPrice + (maxPrice - minPrice) * (maxPricePercent / 100));

    const filteredTours = allTours.filter((tour: any) => {
        if (tour.price > maxPriceValue) return false;
        if (activeStars.length > 0 && !activeStars.includes(tour.stars)) return false;
        
        // Meal filter
        if (activeMeals.length > 0 && !activeMeals.includes(tour.meal_type)) return false;

        // Category filter
        if (activeCategory) {
            const catName = tour.category?.name?.toLowerCase();
            const catNameEn = tour.category?.name_en?.toLowerCase();
            const catId = String(tour.category_id);
            const activeCatLower = activeCategory.toLowerCase();
            
            if (catName !== activeCatLower && catNameEn !== activeCatLower && catId !== activeCatLower) return false;
        }

        // Destination/SearchQuery filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const title = (tour.title || '').toLowerCase();
            const titleEn = (tour.title_en || '').toLowerCase();
            const loc = (tour.location || '').toLowerCase();
            const locEn = (tour.location_en || '').toLowerCase();
            const desc = (tour.description || '').toLowerCase();
            const descEn = (tour.description_en || '').toLowerCase();
            
            const category = tour.category?.name?.toLowerCase() || '';
            const categoryEn = tour.category?.name_en?.toLowerCase() || '';
            const amenityKeys = (tour.amenities || '').toLowerCase().split(',').map((k: string) => k.trim());
            
            // Map amenity keys to their display names for searching
            const amenityLabelsMap: Record<string, string[]> = {
                pool: ['басейн', 'pool'],
                beach: ['пляж', 'beach'],
                spa: ['спа', 'spa'],
                restaurant: ['ресторан', 'rest'],
                gym: ['тренажер', 'зал', 'gym'],
                wifi: ['вайфай', 'wifi', 'internet', 'інтернет'],
                party: ['розваги', 'вечірки', 'party', 'entertainment'],
                mountain: ['гори', 'mountains'],
                ship: ['круїз', 'cruise', 'лайнер'],
                lion: ['сафарі', 'safari', 'тварини'],
                skis: ['лижі', 'ski'],
                city: ['місто', 'city'],
                anchor: ['порт', 'anchor']
            };

            const amenityMatches = amenityKeys.some(key => {
                const labels = amenityLabelsMap[key] || [key];
                return labels.some(label => label.includes(q)) || key.includes(q);
            });
            
            const matches = 
                title.includes(q) || 
                titleEn.includes(q) || 
                loc.includes(q) || 
                locEn.includes(q) || 
                desc.includes(q) || 
                descEn.includes(q) ||
                category.includes(q) ||
                categoryEn.includes(q) ||
                amenityMatches;
                
            if (!matches) return false;
        }

        return true;
    });

    const sortedTours = [...filteredTours].sort((a, b) => {
        switch (sortType) {
            case 'newest': return (b.id || 0) - (a.id || 0);
            case 'price_asc': return a.price - b.price;
            case 'price_desc': return b.price - a.price;
            case 'rating_desc': return (b.average_rating || 0) - (a.average_rating || 0);
            default: return 0;
        }
    });

    const totalPages = Math.max(1, Math.ceil(sortedTours.length / PAGE_SIZE));
    const pagedTours = sortedTours.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleSortChange = (type: SortType) => {
        setSortType(type);
        setShowSortMenu(false);
        setCurrentPage(1);
    };

    const handleFilterChange = useCallback((pricePercent: number, stars: number[], meals: string[]) => {
        setMaxPricePercent(pricePercent);
        setActiveStars(stars);
        setActiveMeals(meals);
        setCurrentPage(1);
    }, []);

    return (
        <div className="search-page-container">
            <div className="search-results-layout">
                <SidebarFilters
                    onFilterChange={handleFilterChange}
                    pricePercent={maxPricePercent}
                    activeStars={activeStars}
                    activeMeals={activeMeals}
                />

                <main className="results-area">
                    <header className="results-header">
                        <div className="res-info">
                            <h1 className="res-title">
                                {isLoading ? t('common.loading', 'Завантаження...') : `${t('search.found', 'Знайдено')} ${filteredTours.length} ${getPluralTours(filteredTours.length, language)}`}
                            </h1>
                            <p className="res-subtitle">{t('search.all_destinations', 'Всі напрямки')}</p>
                        </div>
                        <div className="res-sort" style={{ position: 'relative' }}>
                            <button
                                className="btn-sort"
                                onClick={() => setShowSortMenu(!showSortMenu)}
                            >
                                {t('search.sort_by', 'Сортувати')}: {SORT_LABELS[sortType][language]}
                            </button>
                            {showSortMenu && (
                                <div className="sort-dropdown">
                                    {(Object.keys(SORT_LABELS) as SortType[]).map(key => (
                                        <button
                                            key={key}
                                            className={`sort-opt ${sortType === key ? 'active' : ''}`}
                                            onClick={() => handleSortChange(key)}
                                        >
                                            {SORT_LABELS[key][language]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </header>

                    {isLoading ? (
                        <div className="search-loading">{t('common.loading', 'Завантаження турів...')}</div>
                    ) : error ? (
                        <div className="search-error" style={{ textAlign: 'center', padding: '40px', color: '#ff4d4f' }}>
                            <Icon name="x-circle" size={48} style={{ marginBottom: '16px' }} />
                            <p>{error}</p>
                            <button onClick={() => window.location.reload()} className="btn-retry" style={{ marginTop: '16px', border: '1px solid #ff4d4f', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                                {language === 'en' ? 'Retry' : 'Спробувати знову'}
                            </button>
                        </div>
                    ) : pagedTours.length > 0 ? (
                        <div className="results-list">
                            {pagedTours.map((tour) => (
                                <TourCard key={tour.id} tour={tour} variant="horizontal" />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-search-state">
                            <div className="empty-icon-wrapper">
                                <Icon name="search" size={64} />
                            </div>
                            <h2>{language === 'en' ? 'No tours found' : 'Нічого не знайдено'}</h2>
                            <p>
                                {language === 'en' 
                                    ? "We couldn't find any tours matching your current filters. Try adjusting your preferences or resetting the search."
                                    : "Ми не знайшли турів, що відповідають вашим фільтрам. Спробуйте змінити параметри або скинути пошук."}
                            </p>
                            <button 
                                className="btn-reset-filters"
                                onClick={() => {
                                    window.location.hash = 'search';
                                    setMaxPricePercent(100);
                                    setActiveStars([]);
                                    setActiveMeals([]);
                                }}
                            >
                                {language === 'en' ? 'Reset all filters' : 'Скинути всі фільтри'}
                            </button>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="pagination">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    className={`page-btn ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => { setCurrentPage(page); window.scrollTo(0, 0); }}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

function getPluralTours(count: number, lang: 'uk' | 'en'): string {
    if (lang === 'en') {
        return count === 1 ? 'tour' : 'tours';
    }
    if (count % 10 === 1 && count % 100 !== 11) return 'тур';
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'тури';
    return 'турів';
}

export default SearchPage;
