import React, { useState, useEffect } from 'react';
import './Hero.css';
import Icon from './common/Icon';
import { api } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import heroImage from '../assets/hero.png';

const Hero: React.FC = () => {
    const { language, t } = useSettings();
    const [openField, setOpenField] = useState<string | null>(null);
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    
    // Default people label
    const [people, setPeople] = useState('');
    
    const [availableLocations, setAvailableLocations] = useState<any[]>([]);
    const [availableDates, setAvailableDates] = useState<string[]>([]);

    useEffect(() => {
        setPeople(language === 'en' ? `2 ${t('common.adults')}` : `2 ${t('common.adults')}`);
    }, [language, t]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                // Backend now returns [{uk: "...", en: "..."}]
                const locations = await api.get('/tours/locations');
                setAvailableLocations(locations);
            } catch (err) {
                console.error('Failed to fetch locations:', err);
                setAvailableLocations([]);
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
                t('hero.dates.next_7'),
                t('hero.dates.all_month').replace('{month}', months[currentMonth]),
                t('hero.dates.all_month').replace('{month}', months[nextMonth]),
                t('hero.dates.season')
            ];
            
            setAvailableDates(options);
            setDate(options[1]); // Default to current month
        };

        fetchLocations();
        generateDates();
    }, [language, t]);

    const toggleField = (field: string) => {
        setOpenField(openField === field ? null : field);
    };

    const handleSelect = (field: string, value: string) => {
        if (field === 'where') setDestination(value);
        if (field === 'when') setDate(value);
        if (field === 'who') setPeople(value);
        setOpenField(null);
    };

    const handleSearch = () => {
        const params = new URLSearchParams();
        const cleanDest = destination.includes(' · ') ? destination.split(' · ')[0] : destination;
        if (cleanDest) params.append('destination', cleanDest);
        if (date) params.append('date', date);
        params.append('people', people);
        window.location.hash = `search?${params.toString()}`;
    };

    const HERO_IMAGE_PATH = heroImage;

    const peopleOptions = [
        t('hero.who.adult').replace('{count}', '1'),
        t('hero.who.adults').replace('{count}', '2'),
        `${t('hero.who.adults').replace('{count}', '2')} + 1 ${t('hero.who.child').replace('{count}', '1')}`,
        t('hero.who.adults').replace('{count}', '3')
    ];

    const categoryTags = [
        { label: t('amenity.beach'), icon: 'beach', cat: t('amenity.beach') },
        { label: t('nav.excursions'), icon: 'map', cat: t('nav.excursions') },
        { label: t('nav.cruises'), icon: 'anchor', cat: t('nav.cruises') },
        { label: 'Safari', icon: 'lion', cat: 'Safari' }
    ];

    return (
        <section className="hero-section">
            <div className="circle-1"></div>
            <div className="circle-2"></div>
            
            <div className="hero-content">
                <h1 className="hero-headline" dangerouslySetInnerHTML={{ __html: t('hero.title') }}></h1>
                <p className="hero-subheadline">
                    {t('hero.subtitle')}
                </p>
                
                <div className="hero-search-box">
                    <div className="search-field-wrapper">
                        <div className={`search-field ${openField === 'where' ? 'active' : ''}`} onClick={() => toggleField('where')}>
                            <span className="field-label">{t('hero.where')}</span>
                            <span className={`field-value ${!destination ? 'placeholder' : ''}`}>{destination || t('hero.dest_placeholder')}</span>
                        </div>
                        {openField === 'where' && (
                            <div className="mock-dropdown">
                                {availableLocations.length > 0 ? availableLocations.map((opt, i) => {
                                    const locName = language === 'en' ? opt.en : opt.uk;
                                    return (
                                        <div key={i} className="dropdown-opt" onClick={() => handleSelect('where', locName)}>
                                            {locName}
                                        </div>
                                    );
                                }) : <div className="dropdown-opt disabled">{t('search.no_tours')}</div>}
                            </div>
                        )}
                    </div>

                    <div className="search-field-wrapper">
                        <div className={`search-field ${openField === 'when' ? 'active' : ''}`} onClick={() => toggleField('when')}>
                            <span className="field-label">{t('hero.when')}</span>
                            <span className={`field-value ${!date ? 'placeholder' : ''}`}>{date || t('hero.date_placeholder')}</span>
                        </div>
                        {openField === 'when' && (
                            <div className="mock-dropdown">
                                {availableDates.map((opt, i) => (
                                    <div key={i} className="dropdown-opt" onClick={() => handleSelect('when', opt)}>{opt}</div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="search-field-wrapper">
                        <div className={`search-field ${openField === 'who' ? 'active' : ''}`} onClick={() => toggleField('who')}>
                            <span className="field-label">{t('hero.who')}</span>
                            <span className="field-value">{people}</span>
                        </div>
                        {openField === 'who' && (
                            <div className="mock-dropdown">
                                {peopleOptions.map((opt, i) => (
                                    <div key={i} className="dropdown-opt" onClick={() => handleSelect('who', opt)}>{opt}</div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className="btn-hero-search" onClick={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <Icon name="search" size={20} /> {t('hero.btn_search')}
                    </button>
                </div>
                
                <div className="hero-tags">
                    {categoryTags.map(cat => (
                        <a key={cat.cat} href={`#search?cat=${encodeURIComponent(cat.cat)}`} className="hero-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Icon name={cat.icon as any} size={18} /> {cat.label}
                        </a>
                    ))}
                </div>
            </div>
            
            <div className="hero-images">
                <div 
                    className="hero-placeholder-img" 
                    style={{ 
                        backgroundImage: `url(${HERO_IMAGE_PATH})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        borderRadius: '1.5rem',
                        boxShadow: 'none',
                        background: 'transparent'
                    }}
                ></div>
            </div>
        </section>
    );
};

export default Hero;
