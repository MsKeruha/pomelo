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
    const { language, t } = useSettings();
    const [allTours, setAllTours] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortType, setSortType] = useState<SortType>('newest');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter state (lifted from SidebarFilters)
    const [maxPricePercent, setMaxPricePercent] = useState(100);
    const [activeStars, setActiveStars] = useState<number[]>([5, 4, 3]);
    const [activeMeals, setActiveMeals] = useState<string[]>(['All Inclusive', 'Ultra All Inclusive', 'Breakfast Only', 'Half Board', 'Full Board']);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string | null>(null);

    const MIN_PRICE = 5000;
    const MAX_PRICE = 150000;

    useEffect(() => {
        const fetchTours = async () => {
            try {
                const data = await api.get('/tours');
                setAllTours(data);
            } catch (error) {
                console.error('Failed to fetch tours:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTours();
    }, []);

    // Effect to handle URL parameter changes (Hash change)
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

    const maxPriceValue = Math.round(MIN_PRICE + (MAX_PRICE - MIN_PRICE) * (maxPricePercent / 100));

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
            const loc = tour.location.toLowerCase();
            const locEn = (tour.location_en || '').toLowerCase();
            const q = searchQuery.toLowerCase();
            if (!loc.includes(q) && !locEn.includes(q)) return false;
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
                    ) : pagedTours.length > 0 ? (
                        <div className="results-list">
                            {pagedTours.map((tour) => (
                                <TourCard key={tour.id} tour={tour} variant="horizontal" />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-search" style={{ textAlign: 'center', padding: '40px' }}>
                            <Icon name="search" size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
                            <p>{t('search.no_tours', 'За вашими фільтрами турів не знайдено.')}</p>
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
