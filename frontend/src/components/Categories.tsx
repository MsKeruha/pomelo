import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import Icon from './common/Icon';
import type { IconName } from './common/Icon';
import { useSettings } from '../context/SettingsContext';
import './Categories.css';

const CategorySection: React.FC = () => {
    const { language, t } = useSettings();
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await api.get('/categories');
                setCategories(data);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const handleCategoryClick = (name: string) => {
        window.location.hash = `search?cat=${encodeURIComponent(name)}`;
    };

    const getCategoryStyles = (iconName: string): { icon: IconName; color: string; bg: string } => {
        const styles: Record<string, { icon: IconName; color: string; bg: string }> = {
            'beach': { icon: 'beach', color: '#0fb9b1', bg: '#f0fdfc' },
            'mountain': { icon: 'mountain', color: '#4b7bef', bg: '#f0f4ff' },
            'map': { icon: 'map', color: '#f7b731', bg: '#fffaf0' },
            'ship': { icon: 'ship', color: '#2d98da', bg: '#f5fbff' },
            'city': { icon: 'city', color: '#778ca3', bg: '#f9fafb' },
            'lion': { icon: 'lion', color: '#20bf6b', bg: '#f0fff4' }
        };
        return styles[iconName] || { icon: 'plane', color: '#a5b1c2', bg: '#f1f2f6' };
    };

    return (
        <section className="category-section">
            <h2 className="category-title">{language === 'en' ? 'Categories' : 'Категорії'}</h2>
            <div className="category-grid">
                {categories.map((cat) => {
                    const styles = getCategoryStyles(cat.emoji);
                    const displayName = (language === 'en' && cat.name_en) ? cat.name_en : cat.name;
                    return (
                        <div 
                            key={cat.id} 
                            className="category-card"
                            onClick={() => handleCategoryClick(cat.name)}
                            style={{ '--cat-bg': styles.bg } as any}
                        >
                            <div className="category-icon-wrapper" style={{ color: styles.color }}>
                                <Icon name={styles.icon} size={32} strokeWidth={2.5} />
                            </div>
                            <span className="category-name">{displayName}</span>
                        </div>
                    );
                })}
            </div>
            {categories.length === 0 && <p className="empty-msg">{t('common.loading', 'Завантаження...')}</p>}
        </section>
    );
};

export default CategorySection;
