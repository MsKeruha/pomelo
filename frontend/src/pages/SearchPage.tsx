import React, { useEffect, useState, useCallback } from 'react';
import SidebarFilters from '../components/SidebarFilters';
import type { FilterState } from '../components/SidebarFilters';
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

    const [minPrice, setMinPrice] = useState(5000);
    const [maxPrice, setMaxPrice] = useState(150000);

    const [filters, setFilters] = useState<FilterState>({
        pricePercent: 100,
        stars: [5, 4, 3, 2],
        meals: ['All Inclusive', 'Ultra All Inclusive', 'Breakfast Only', 'Half Board', 'Full Board'],
        category: null,
        destination: null,
        date: null,
        people: null
    });

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

    // Sync filters with URL
    useEffect(() => {
        const handleParams = () => {
            const hash = window.location.hash;
            if (hash.includes('?')) {
                const params = new URLSearchParams(hash.split('?')[1]);
                const cat = params.get('cat');
                const dest = params.get('destination');
                const date = params.get('date');
                const people = params.get('people');
                
                setFilters(prev => ({
                    ...prev,
                    category: cat || null,
                    destination: dest || null,
                    date: date || null,
                    people: people || null
                }));
                setCurrentPage(1);
            } else {
                setFilters(prev => ({
                    ...prev,
                    category: null,
                    destination: null,
                    date: null,
                    people: null
                }));
            }
        };

        handleParams();
        window.addEventListener('hashchange', handleParams);
        return () => window.removeEventListener('hashchange', handleParams);
    }, []);

    const handleFilterChange = useCallback((newFilters: FilterState) => {
        setFilters(newFilters);
        setCurrentPage(1);
        
        // Update URL hash to reflect active category/destination
        const params = new URLSearchParams();
        if (newFilters.category) params.append('cat', newFilters.category);
        if (newFilters.destination) params.append('destination', newFilters.destination);
        if (newFilters.date) params.append('date', newFilters.date);
        if (newFilters.people) params.append('people', newFilters.people);
        
        const queryString = params.toString();
        window.location.hash = queryString ? `search?${queryString}` : 'search';
    }, []);

    const maxPriceValue = Math.round(minPrice + (maxPrice - minPrice) * (filters.pricePercent / 100));

    const filteredTours = allTours.filter((tour: any) => {
        // Price
        if (tour.price > maxPriceValue) return false;
        
        // Stars
        if (filters.stars.length > 0 && !filters.stars.includes(tour.stars)) return false;
        
        // Meal
        if (filters.meals.length > 0 && !filters.meals.includes(tour.meal_type)) return false;

        // Category
        if (filters.category) {
            const catName = tour.category?.name?.toLowerCase();
            const catNameEn = tour.category?.name_en?.toLowerCase();
            const catId = String(tour.category_id);
            const activeCatLower = filters.category.toLowerCase();
            if (catName !== activeCatLower && catNameEn !== activeCatLower && catId !== activeCatLower) return false;
        }

        // Destination / Location
        if (filters.destination) {
            const q = filters.destination.toLowerCase();
            const loc = (tour.location || '').toLowerCase();
            const locEn = (tour.location_en || '').toLowerCase();
            if (!loc.includes(q) && !locEn.includes(q)) return false;
        }

        // Date Filtering (Mock simple check)
        if (filters.date) {
            const tourDates = (tour.available_dates || '').toLowerCase();
            const selectedDate = filters.date.toLowerCase();
            // If tour has specific dates, check if selected range matches
            // This is a loose check because available_dates is a string
            if (tourDates && !tourDates.includes(selectedDate)) {
                // If the selected date is a month name like "april", check it
                const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'];
                const foundMonth = months.find(m => selectedDate.includes(m));
                if (foundMonth && !tourDates.includes(foundMonth)) return false;
            }
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

    return (
        <div className="search-page-container">
            <div className="search-results-layout">
                <SidebarFilters
                    onFilterChange={handleFilterChange}
                    filters={filters}
                />

                <main className="results-area">
                    <header className="results-header">
                        <div className="res-info">
                            <h1 className="res-title">
                                {isLoading ? t('common.loading', 'Завантаження...') : `${t('search.found', 'Знайдено')} ${filteredTours.length} ${getPluralTours(filteredTours.length, language)}`}
                            </h1>
                            <p className="res-subtitle">
                                {filters.destination || t('search.all_destinations', 'Всі напрямки')}
                                {filters.category ? ` · ${filters.category}` : ''}
                            </p>
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
                                    setFilters({
                                        pricePercent: 100,
                                        stars: [5, 4, 3, 2],
                                        meals: ['All Inclusive', 'Ultra All Inclusive', 'Breakfast Only', 'Half Board', 'Full Board'],
                                        category: null,
                                        destination: null,
                                        date: null,
                                        people: null
                                    });
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
