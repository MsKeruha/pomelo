import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import Icon from '../common/Icon';
import Modal from '../common/Modal';
import './AdminTourEditor.css';

interface AdminTourEditorProps {
    onCancel: () => void;
    onSaved: () => void;
    editId?: number | null;
}

const GRADIENTS = [
    'var(--grad-card-1)',
    'var(--grad-card-2)',
    'var(--grad-card-3)',
    'var(--grad-tour-hero)',
];

const AdminTourEditor: React.FC<AdminTourEditorProps> = ({ onCancel, onSaved, editId }) => {
    const [title, setTitle] = useState('');
    const [country, setCountry] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [galleryUrls, setGalleryUrls] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedGrad, setSelectedGrad] = useState(0);
    const [mealType, setMealType] = useState('All Inclusive');
    const [accommodation, setAccommodation] = useState('');
    const [flights, setFlights] = useState('');
    const [program, setProgram] = useState('');
    const [availableDatesString, setAvailableDatesString] = useState('');
    const [newDateStart, setNewDateStart] = useState('');
    const [newDateEnd, setNewDateEnd] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);
    const [curatedLocations, setCuratedLocations] = useState<Record<string, string[]>>({});
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['wifi', 'restaurant']);
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean, title: string, message: string }>({
        isOpen: false, title: '', message: ''
    });

    const ALL_AMENITIES = [
        { id: 'pool', label: 'Басейн' },
        { id: 'beach', label: 'Пляж' },
        { id: 'spa', label: 'SPA' },
        { id: 'restaurant', label: 'Ресторан' },
        { id: 'gym', label: 'Зал' },
        { id: 'wifi', label: 'Wi-Fi' },
        { id: 'party', label: 'Розваги' },
        { id: 'mountain', label: 'Гори' },
        { id: 'ship', label: 'Корабель' },
        { id: 'lion', label: 'Сафарі' },
        { id: 'skis', label: 'Лижі' },
        { id: 'city', label: 'Місто' },
        { id: 'anchor', label: 'Якір' }
    ];

    // Load categories and tour for editing
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const cats = await api.get('/categories');
                setCategories(cats);

                const curated = await api.get('/locations/curated');
                setCuratedLocations(curated);
                
                if (editId) {
                    setIsLoadingEdit(true);
                    const tour = await api.get(`/tours/${editId}`);
                    setTitle(tour.title || '');
                    
                    // Split location into country and city if possible
                    if (tour.location && tour.location.includes(' · ')) {
                        const parts = tour.location.split(' · ');
                        setCountry(parts[0] || '');
                        setLocation(parts[1] || '');
                    } else {
                        setCountry('');
                        setLocation(tour.location || '');
                    }
                    
                    setDescription(tour.description || '');
                    setPrice(String(tour.price || ''));
                    setImageUrl(tour.image_url || '');
                    setGalleryUrls(tour.gallery_urls || '');
                    setCategoryId(String(tour.category_id || ''));
                    setMealType(tour.meal_type || 'All Inclusive');
                    setAccommodation(tour.accommodation || '');
                    setFlights(tour.flights || '');
                    setProgram(tour.program || '');
                    setAvailableDatesString(tour.available_dates || '');
                    
                    const gradIndex = GRADIENTS.indexOf(tour.image_gradient);
                    if (gradIndex !== -1) setSelectedGrad(gradIndex);
                    
                    if (tour.amenities) {
                        setSelectedAmenities(tour.amenities.split(',').map((a: string) => a.trim()));
                    }
                }
            } catch (err) {
                setError('Не вдалося завантажити дані');
            } finally {
                setIsLoadingEdit(false);
            }
        };
        loadInitialData();
    }, [editId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title.trim() || !price || !country || !location) {
            setError('Заповніть обов\'язкові поля: назва, локація та ціна');
            return;
        }

        const fullLocation = country ? `${country.trim()} · ${location.trim()}` : location.trim();
        
        // Populate English location version using curated data
        const countryData = curatedLocations[country];
        const countryEn = countryData?.en || country;
        const cityEn = countryData?.cities?.[location] || location;
        const fullLocationEn = countryEn && cityEn ? `${countryEn} · ${cityEn}` : (cityEn || countryEn);
        
        const payload = {
            title: title.trim(),
            location: fullLocation,
            location_en: fullLocationEn,
            description: description.trim(),
            price: parseFloat(price),
            image_url: imageUrl.trim() || null,
            gallery_urls: galleryUrls.trim() || null,
            image_gradient: GRADIENTS[selectedGrad],
            category_id: categoryId ? parseInt(categoryId) : null,
            amenities: selectedAmenities.join(','),
            meal_type: mealType,
            accommodation: accommodation,
            flights: flights,
            program: program,
            available_dates: availableDatesString
        };

        setIsSaving(true);
        try {
            if (editId) {
                await api.put(`/tours/${editId}`, payload);
            } else {
                await api.post('/tours', payload);
            }
            onSaved();
        } catch (err: any) {
            setError(err.message || 'Не вдалося зберегти тур. Перевірте дані.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGeneratePhotos = async () => {
        if (!title.trim()) {
            setError('Спочатку введіть назву туру для пошуку фото');
            return;
        }
        setIsSaving(true);
        try {
            // Find selected category name for context
            const selectedCat = categories.find(c => String(c.id) === categoryId);
            const catNameEn = selectedCat ? (selectedCat.name_en || selectedCat.name) : '';
            
            // Build query using strictly ENGLISH locations if possible to avoid confusing Unsplash
            const countryData = curatedLocations[country];
            const countryEn = countryData?.en || country;
            const cityEn = countryData?.cities?.[location] || location;
            // Often titles in Ukrainian like "Спадщина та історія" give random images on Unsplash.
            // Using City + Country gets perfect localized images.
            const query = `${cityEn} ${countryEn}`.trim() || 'Travel';
            
            const photos = await api.get(`/admin/search-photos?query=${encodeURIComponent(query)}&category=${encodeURIComponent(catNameEn)}`);
            if (photos && photos.length > 0) {
                setImageUrl(photos[0]);
                // Take up to 7 more images for gallery (to use all 8)
                setGalleryUrls(photos.slice(1, 8).join(', '));
            } else {
                setInfoModal({
                    isOpen: true,
                    title: 'Фото не знайдено',
                    message: 'Ми не змогли знайти фото за вашим запитом. Спробуйте змінити назву туру або країну.'
                });
            }
        } catch (err) {
            console.error('Photo search failed', err);
            setInfoModal({
                isOpen: true,
                title: 'Помилка',
                message: 'Помилка при пошуку фото. Будь ласка, перевірте налаштування API Unsplash.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAutoFillDetails = () => {
        setAccommodation("Комфортабельний готель з усіма зручностями та сніданками. Розташування в центрі або біля моря.");
        setFlights("Переліт у дві сторони регулярним або чартерним рейсом. Включено ручну поклажу.");
        setProgram("День 1: Прибуття та поселення.\nДні 2-6: Відпочинок або екскурсії за бажанням.\nДень 7: Виселення та трансфер в аеропорт.");
    };

    if (isLoadingEdit) {
        return <div className="admin-loading">Завантаження туру...</div>;
    }

    return (
        <div className="tour-editor-container">
            <header className="editor-header">
                <h2>{editId ? 'Редагування туру' : 'Новий тур'}</h2>
                <button className="btn-close-editor" onClick={onCancel} type="button">✕ Закрити</button>
            </header>

            {error && <div className="editor-error">⚠ {error}</div>}

            <form className="editor-form" onSubmit={handleSave}>
                <div className="editor-grid">
                    <div className="editor-left">
                        <section className="editor-section-card">
                            <span className="section-title">Основна інформація</span>
                            <div className="form-group-admin">
                                <label>НАЗВА ТУРУ *</label>
                                <input
                                    type="text"
                                    placeholder="Наприклад: Coral Beach Resort"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-row-admin">
                                <div className="form-group-admin">
                                    <label>КРАЇНА *</label>
                                    <select
                                        value={country}
                                        onChange={e => {
                                            setCountry(e.target.value);
                                            setLocation(''); // Reset city when country changes
                                        }}
                                        required
                                    >
                                        <option value="">Оберіть країну...</option>
                                        {Object.keys(curatedLocations).map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group-admin">
                                    <label>МІСТО / КУРОРТ *</label>
                                    <select
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        disabled={!country}
                                        required
                                    >
                                        <option value="">Оберіть місто...</option>
                                        {country && Object.keys(curatedLocations[country]?.cities || {}).map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group-admin" style={{ marginBottom: 0 }}>
                                <label>ОПИС</label>
                                <textarea
                                    placeholder="Детальний опис туру та готелю..."
                                    rows={8}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                        </section>

                        <section className="editor-section-card" style={{ marginBottom: '20px' }}>
                            <span className="section-title">Додаткова інформація</span>
                            <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 10px 0' }}>Натисніть кнопку, щоб заповнити стандартним шаблоном</p>
                            <button type="button" className="btn-auto-gen" onClick={handleAutoFillDetails} style={{ marginBottom: '15px' }}>
                                <Icon name="edit" size={16} /> Згенерувати стандартний опис
                            </button>
                            
                            <div className="form-group-admin">
                                <label>ТИП ХАРЧУВАННЯ</label>
                                <select value={mealType} onChange={e => setMealType(e.target.value)}>
                                    <option value="All Inclusive">All Inclusive</option>
                                    <option value="Ultra All Inclusive">Ultra All Inclusive</option>
                                    <option value="Breakfast Only">Breakfast Only</option>
                                    <option value="Half Board">Half Board</option>
                                    <option value="No Meals">No Meals</option>
                                </select>
                            </div>

                            <div className="form-group-admin">
                                <label>ДОСТУПНІ ДАТИ (Діапазон)</label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                    <input 
                                        type="date" 
                                        value={newDateStart}
                                        onChange={e => setNewDateStart(e.target.value)}
                                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-divider)' }}
                                    />
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>—</span>
                                    <input 
                                        type="date" 
                                        value={newDateEnd}
                                        onChange={e => setNewDateEnd(e.target.value)}
                                        min={newDateStart}
                                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-divider)' }}
                                    />
                                    <button 
                                        type="button" 
                                        className="btn-apply-people"
                                        style={{ whiteSpace: 'nowrap', width: 'auto', padding: '0 15px' }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (newDateStart) {
                                                const dStart = new Date(newDateStart);
                                                let dStr = dStart.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
                                                
                                                if (newDateEnd && newDateEnd !== newDateStart) {
                                                    const dEnd = new Date(newDateEnd);
                                                    const dStartStr = dStart.toLocaleDateString('uk-UA', { day: 'numeric' });
                                                    const dEndStr = dEnd.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
                                                    dStr = `${dStartStr}–${dEndStr}`;
                                                }

                                                const existing = availableDatesString ? availableDatesString.split(',').map(x=>x.trim()).filter(Boolean) : [];
                                                if (!existing.includes(dStr)) {
                                                    setAvailableDatesString([...existing, dStr].join(', '));
                                                }
                                                setNewDateStart('');
                                                setNewDateEnd('');
                                            }
                                        }}
                                    >Додати</button>
                                </div>
                                <div className="selected-dates" style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {availableDatesString.split(',').map((d, i) => {
                                        const trimmed = d.trim();
                                        if (!trimmed) return null;
                                        return (
                                            <span key={i} className="amenity-chip active" style={{ padding: '4px 8px', fontSize: '13px' }}>
                                                {trimmed} 
                                                <Icon 
                                                    name="close" 
                                                    size={12} 
                                                    style={{ marginLeft: '5px', cursor: 'pointer' }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const existing = availableDatesString.split(',').map(x=>x.trim()).filter((_, idx) => idx !== i);
                                                        setAvailableDatesString(existing.join(', '));
                                                    }}
                                                />
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="form-group-admin">
                                <label>ПРОЖИВАННЯ (ДЕТАЛІ)</label>
                                <textarea rows={3} value={accommodation} onChange={e => setAccommodation(e.target.value)} />
                            </div>

                            <div className="form-group-admin">
                                <label>ПЕРЕЛЬОТИ (ДЕТАЛІ)</label>
                                <textarea rows={3} value={flights} onChange={e => setFlights(e.target.value)} />
                            </div>

                            <div className="form-group-admin">
                                <label>ПРОГРАМА ТУРУ</label>
                                <textarea rows={3} value={program} onChange={e => setProgram(e.target.value)} />
                            </div>
                        </section>

                        <section className="editor-section-card" style={{ marginBottom: '20px' }}>
                            <span className="section-title">Зручності (Amenities)</span>
                            <div className="amenities-selector-admin">
                                {ALL_AMENITIES.map(amenity => (
                                    <button
                                        key={amenity.id}
                                        type="button"
                                        className={`amenity-chip ${selectedAmenities.includes(amenity.id) ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (selectedAmenities.includes(amenity.id)) {
                                                setSelectedAmenities(selectedAmenities.filter(a => a !== amenity.id));
                                            } else {
                                                setSelectedAmenities([...selectedAmenities, amenity.id]);
                                            }
                                        }}
                                    >
                                        <Icon name={amenity.id as any} size={14} />
                                        {amenity.label}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="editor-right">
                        <section className="editor-section-card" style={{ marginBottom: '20px' }}>
                            <span className="section-title">Параметри та ціна</span>
                            <div className="form-row-admin">
                                <div className="form-group-admin">
                                    <label>ЦІНА (₴) *</label>
                                    <input
                                        type="number"
                                        placeholder="24900"
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                        min={0}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group-admin">
                                <label>КАТЕГОРІЯ</label>
                                <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                                    <option value="">Оберіть категорію...</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                                    ))}
                                </select>
                            </div>

                             <div className="form-group-admin" style={{ marginBottom: 0 }}>
                                <label>ГРАДІЄНТ КАРТКИ</label>
                                <div className="gradient-selector">
                                    {GRADIENTS.map((g, i) => (
                                        <div
                                            key={i}
                                            className={`grad-opt ${selectedGrad === i ? 'active' : ''}`}
                                            style={{ background: g }}
                                            onClick={() => setSelectedGrad(i)}
                                            title={`Варіант ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="editor-section-card">
                            <span className="section-title">Медіа та Контент</span>
                            
                            <div className="photo-generation-box">
                                <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 10px 0' }}>На основі назви ми підберемо найкращі фото через Unsplash API</p>
                                <button 
                                    type="button"
                                    className="btn-auto-gen" 
                                    disabled={!title.trim() || isSaving}
                                    onClick={handleGeneratePhotos}
                                >
                                    <Icon name="search" size={16} /> 
                                    {isSaving ? 'Шукаємо фото...' : 'Згенерувати через Unsplash'}
                                </button>
                            </div>

                            <div className="form-group-admin" style={{ marginTop: '20px' }}>
                                <label>ГОЛОВНЕ ЗОБРАЖЕННЯ (URL)</label>
                                <input
                                    type="url"
                                    placeholder="https://.../photo.jpg"
                                    value={imageUrl}
                                    onChange={e => setImageUrl(e.target.value)}
                                />
                            </div>
                            
                            <div className="form-group-admin" style={{ marginBottom: 0 }}>
                                <label>ГАЛЕРЕЯ (Посилання через кому)</label>
                                <textarea
                                    placeholder="https://.../1.jpg, https://.../2.jpg"
                                    rows={3}
                                    value={galleryUrls}
                                    onChange={e => setGalleryUrls(e.target.value)}
                                    style={{ fontSize: '12px' }}
                                />
                            </div>

                            {imageUrl && (
                                <div className="image-preview" style={{ 
                                    marginTop: '15px', 
                                    height: '140px', 
                                    backgroundImage: `url(${imageUrl})`, 
                                    backgroundSize: 'cover', 
                                    backgroundPosition: 'center',
                                    borderRadius: '14px', 
                                    border: '1px solid var(--border-divider)' 
                                }}></div>
                            )}
                        </section>
                    </div>
                </div>

                <div className="editor-footer">
                    <button type="button" className="btn-cancel" onClick={onCancel}>Скасувати</button>
                    <button type="submit" className="btn-save-tour" disabled={isSaving}>
                        {isSaving ? 'Збереження...' : (editId ? 'Оновити тур' : 'Зберегти тур')}
                    </button>
                </div>
            </form>

            <Modal 
                isOpen={infoModal.isOpen} 
                onClose={() => setInfoModal({ ...infoModal, isOpen: false })}
                title={infoModal.title}
                hideFooter={true}
            >
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <p style={{ fontSize: '16px', marginBottom: '20px' }}>{infoModal.message}</p>
                    <button 
                        className="btn-save-tour" 
                        onClick={() => setInfoModal({ ...infoModal, isOpen: false })}
                        style={{ minWidth: '120px' }}
                    >
                        Зрозуміло
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default AdminTourEditor;
