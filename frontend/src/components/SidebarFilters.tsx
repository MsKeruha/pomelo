import React, { useState } from 'react';
import './SidebarFilters.css';
import Icon from './common/Icon';
import { useSettings } from '../context/SettingsContext';

interface SidebarFiltersProps {
    onFilterChange?: (pricePercent: number, stars: number[], meals: string[]) => void;
    pricePercent?: number;
    activeStars?: number[];
    activeMeals?: string[];
}

const MEAL_OPTIONS = ['All Inclusive', 'Ultra All Inclusive', 'Breakfast Only', 'Half Board', 'Full Board'];

const SidebarFilters: React.FC<SidebarFiltersProps> = ({
    onFilterChange,
    pricePercent: externalPrice,
    activeStars: externalStars,
    activeMeals: externalMeals,
}) => {
    const { formatPrice, t } = useSettings();
    const [localPrice, setLocalPrice] = useState(100);
    const [localStars, setLocalStars] = useState<number[]>([5, 4, 3]);
    const [localMeals, setLocalMeals] = useState<string[]>(MEAL_OPTIONS);

    // Use external state if provided (controlled), otherwise local
    const pricePercent = externalPrice !== undefined ? externalPrice : localPrice;
    const activeStars = externalStars !== undefined ? externalStars : localStars;
    const activeMeals = externalMeals !== undefined ? externalMeals : localMeals;

    const setPricePercent = (val: number) => {
        setLocalPrice(val);
        onFilterChange?.(val, activeStars, activeMeals);
    };

    const toggleStar = (star: number) => {
        const next = activeStars.includes(star)
            ? activeStars.filter(s => s !== star)
            : [...activeStars, star];
        setLocalStars(next);
        onFilterChange?.(pricePercent, next, activeMeals);
    };

    const toggleMeal = (meal: string) => {
        const next = activeMeals.includes(meal)
            ? activeMeals.filter(m => m !== meal)
            : [...activeMeals, meal];
        setLocalMeals(next);
        onFilterChange?.(pricePercent, activeStars, next);
    };

    const handleReset = () => {
        setLocalPrice(100);
        setLocalStars([5, 4, 3]);
        setLocalMeals(MEAL_OPTIONS);
        onFilterChange?.(100, [5, 4, 3], MEAL_OPTIONS);
    };

    const MIN = 5000;
    const MAX = 150000;
    const maxPriceValue = Math.round(MIN + (MAX - MIN) * (pricePercent / 100));

    const renderPriceValue = (val: number) => {
        return formatPrice(val);
    };

    return (
        <aside className="sidebar-filters">
            <div className="filters-title-row">
                <h2 className="filters-title">{t('filter.title', 'Фільтри')}</h2>
                <button className="btn-reset-filters" onClick={handleReset}>{t('filter.reset', 'Скинути')}</button>
            </div>
            <div className="divider" />

            <div className="filter-group">
                <p className="group-label">{t('filter.price_per_person', 'Ціна за особу')}</p>
                <div className="price-slider-mock">
                    <div
                        className="slider-track"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            setPricePercent(Math.round((x / rect.width) * 100));
                        }}
                    >
                        <div className="slider-fill" style={{ width: `${pricePercent}%` }} />
                        <div
                            className="slider-handle"
                            style={{ left: `${pricePercent}%` }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                const track = e.currentTarget.parentElement!;
                                const move = (ev: MouseEvent) => {
                                    const rect = track.getBoundingClientRect();
                                    const x = Math.max(0, Math.min(ev.clientX - rect.left, rect.width));
                                    setPricePercent(Math.round((x / rect.width) * 100));
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
                        <span>{renderPriceValue(MIN)}</span>
                        <span>{renderPriceValue(maxPriceValue)}</span>
                    </div>
                </div>
            </div>

            <div className="divider" />

            <div className="filter-group">
                <p className="group-label">{t('filter.stars', 'Зірковість')}</p>
                <div className="star-chips">
                    {[5, 4, 3, 2].map(star => (
                        <button
                            key={star}
                            className={`chip ${activeStars.includes(star) ? 'active' : ''}`}
                            onClick={() => toggleStar(star)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                        >
                            {star} <Icon name="star" size={14} style={{ color: activeStars.includes(star) ? '#fff' : '#ffd700' }} />
                        </button>
                    ))}
                </div>
            </div>

            <div className="divider" />

            <div className="filter-group">
                <p className="group-label">{t('filter.meal_type', 'Харчування')}</p>
                <div className="checkbox-group">
                    {MEAL_OPTIONS.map(meal => (
                        <label key={meal} className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={activeMeals.includes(meal)}
                                onChange={() => toggleMeal(meal)}
                            />
                            <span>{meal}</span>
                        </label>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default SidebarFilters;
