import React, { useState, useEffect } from 'react';
import './SidebarFilters.css';
import Icon from './common/Icon';
import { useSettings } from '../context/SettingsContext';
import { api } from '../api/client';

interface SidebarFiltersProps {
    onFilterChange: (filters: FilterState) => void;
    filters: FilterState;
}

export interface FilterState {
    pricePercent: number;
    stars: number[];
    meals: string[];
    category: string | null;
    destination: string | null;
    date: string | null;
    people: string | null;
}

const MEAL_OPTIONS = ['All Inclusive', 'Ultra All Inclusive', 'Breakfast Only', 'Half Board', 'Full Board'];

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
    onFilterChange,
    filters
}) => {
    const { formatPrice, t, language } = useSettings();
    const [categories, setCategories] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
        destination: true,
        category: true,
        date: true,
        people: true,
        price: true,
        stars: true,
        meals: true
    });

    const toggleCollapse = (key: string) => {
        setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cats, locs] = await Promise.all([
                    api.get('/categories'),
                    api.get('/tours/locations')
                ]);
                setCategories(cats);
                setLocations(locs);
            } catch (err) {
                console.error('Failed to fetch filter data:', err);
            }
        };

        const generateDates = () => {
            const ukMonths = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'];
            const enMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const months = language === 'en' ? enMonths : ukMonths;
            
            const now = new Date();
            const currentMonth = now.getMonth();
            const nextMonth = (currentMonth + 1) % 12;
            
            const options = [
                t('hero.dates.next_7', 'Найближчі 7 днів'),
                t('hero.dates.all_month', 'Весь {month}').replace('{month}', months[currentMonth]),
                t('hero.dates.all_month', 'Весь {month}').replace('{month}', months[nextMonth]),
                t('hero.dates.season', 'Сезон')
            ];
            setAvailableDates(options);
        };

        fetchData();
        generateDates();
    }, [language, t]);

    const updateFilter = (newFields: Partial<FilterState>) => {
        onFilterChange({ ...filters, ...newFields });
    };

    const toggleStar = (star: number) => {
        const next = filters.stars.includes(star)
            ? filters.stars.filter(s => s !== star)
            : [...filters.stars, star];
        updateFilter({ stars: next });
    };

    const toggleMeal = (meal: string) => {
        const next = filters.meals.includes(meal)
            ? filters.meals.filter(m => m !== meal)
            : [...filters.meals, meal];
        updateFilter({ meals: next });
    };

    const handleReset = () => {
        onFilterChange({
            pricePercent: 100,
            stars: [5, 4, 3],
            meals: MEAL_OPTIONS,
            category: null,
            destination: null,
            date: null,
            people: null
        });
    };

    const MIN = 5000;
    const MAX = 150000;
    const maxPriceValue = Math.round(MIN + (MAX - MIN) * (filters.pricePercent / 100));

    const peopleOptions = [
        t('hero.who.adult', '1 дорослий').replace('{count}', '1'),
        t('hero.who.adults', '2 дорослих').replace('{count}', '2'),
        `${t('hero.who.adults', '2 дорослих').replace('{count}', '2')} + 1 ${t('hero.who.child', '1 дитина').replace('{count}', '1')}`,
        t('hero.who.adults', '3 дорослих').replace('{count}', '3')
    ];

    const FilterHeader = ({ label, groupKey }: { label: string, groupKey: string }) => (
        <div className="filter-group-header" onClick={() => toggleCollapse(groupKey)}>
            <p className="group-label">{label}</p>
            <Icon 
                name="chevron-down" 
                size={16} 
                className={`collapse-icon ${collapsed[groupKey] ? 'collapsed' : ''}`} 
            />
        </div>
    );

    return (
        <aside className="sidebar-filters">
            <div className="filters-title-row">
                <h2 className="filters-title">{t('filter.title', 'Фільтри')}</h2>
                <button className="btn-reset-filters" onClick={handleReset}>{t('filter.reset', 'Скинути')}</button>
            </div>
            
            <div className="divider" />

            {/* Destinations */}
            <div className={`filter-group ${collapsed.destination ? 'collapsed' : ''}`}>
                <FilterHeader label={t('hero.where', 'Куди?')} groupKey="destination" />
                <div className="filter-group-content chip-group">
                    {locations.map((loc, i) => {
                        const name = language === 'en' ? loc.en : loc.uk;
                        const isActive = filters.destination === name;
                        return (
                            <button 
                                key={i} 
                                className={`chip ${isActive ? 'active' : ''}`}
                                onClick={() => updateFilter({ destination: isActive ? null : name })}
                            >
                                {name}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="divider" />

            {/* Categories */}
            <div className={`filter-group ${collapsed.category ? 'collapsed' : ''}`}>
                <FilterHeader label={t('nav.categories', 'Категорії')} groupKey="category" />
                <div className="filter-group-content chip-group">
                    {categories.map((cat) => {
                        const name = (language === 'en' && cat.name_en) ? cat.name_en : cat.name;
                        const isActive = filters.category === cat.name;
                        return (
                            <button 
                                key={cat.id} 
                                className={`chip ${isActive ? 'active' : ''}`}
                                onClick={() => updateFilter({ category: isActive ? null : cat.name })}
                            >
                                {name}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="divider" />

            {/* Dates */}
            <div className={`filter-group ${collapsed.date ? 'collapsed' : ''}`}>
                <FilterHeader label={t('hero.when', 'Коли?')} groupKey="date" />
                <div className="filter-group-content chip-group">
                    {availableDates.map((opt, i) => (
                        <button 
                            key={i} 
                            className={`chip ${filters.date === opt ? 'active' : ''}`}
                            onClick={() => updateFilter({ date: filters.date === opt ? null : opt })}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="divider" />

            {/* People */}
            <div className={`filter-group ${collapsed.people ? 'collapsed' : ''}`}>
                <FilterHeader label={t('hero.who', 'Осіб?')} groupKey="people" />
                <div className="filter-group-content chip-group">
                    {peopleOptions.map((opt, i) => (
                        <button 
                            key={i} 
                            className={`chip ${filters.people === opt ? 'active' : ''}`}
                            onClick={() => updateFilter({ people: filters.people === opt ? null : opt })}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="divider" />

            {/* Price */}
            <div className={`filter-group ${collapsed.price ? 'collapsed' : ''}`}>
                <FilterHeader label={t('filter.price_per_person', 'Ціна за особу')} groupKey="price" />
                <div className="filter-group-content price-slider-mock">
                    <div
                        className="slider-track"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            updateFilter({ pricePercent: Math.round((x / rect.width) * 100) });
                        }}
                    >
                        <div className="slider-fill" style={{ width: `${filters.pricePercent}%` }} />
                        <div
                            className="slider-handle"
                            style={{ left: `${filters.pricePercent}%` }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                const track = e.currentTarget.parentElement!;
                                const move = (ev: MouseEvent) => {
                                    const rect = track.getBoundingClientRect();
                                    const x = Math.max(0, Math.min(ev.clientX - rect.left, rect.width));
                                    updateFilter({ pricePercent: Math.round((x / rect.width) * 100) });
                                };
                                const up = () => {
                                    window.removeEventListener('mousemove', move);
                                    window.removeEventListener('mouseup', up);
                                };
                                window.addEventListener('mousemove', move);
                                window.addEventListener('mouseup', up);
                            }}
                        />
                    </div>
                    <div className="slider-values">
                        <span>{formatPrice(MIN)}</span>
                        <span>{formatPrice(maxPriceValue)}</span>
                    </div>
                </div>
            </div>

            <div className="divider" />

            {/* Stars */}
            <div className={`filter-group ${collapsed.stars ? 'collapsed' : ''}`}>
                <FilterHeader label={t('filter.stars', 'Зірковість')} groupKey="stars" />
                <div className="filter-group-content star-chips">
                    {[5, 4, 3, 2].map(star => (
                        <button
                            key={star}
                            className={`chip ${filters.stars.includes(star) ? 'active' : ''}`}
                            onClick={() => toggleStar(star)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                        >
                            {star} <Icon name="star" size={14} style={{ color: filters.stars.includes(star) ? '#fff' : '#ffd700' }} />
                        </button>
                    ))}
                </div>
            </div>

            <div className="divider" />

            {/* Meals */}
            <div className={`filter-group ${collapsed.meals ? 'collapsed' : ''}`}>
                <FilterHeader label={t('filter.meal_type', 'Харчування')} groupKey="meals" />
                <div className="filter-group-content chip-group">
                    {MEAL_OPTIONS.map(meal => (
                        <button 
                            key={meal} 
                            className={`chip ${filters.meals.includes(meal) ? 'active' : ''}`}
                            onClick={() => toggleMeal(meal)}
                        >
                            {meal}
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default SidebarFilters;
