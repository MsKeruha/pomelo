import React, { useState, useEffect } from 'react';
import Icon from '../common/Icon';
import { useSettings } from '../../context/SettingsContext';
import { api } from '../../api/client';
import './AdminTours.css';

interface AdminToursProps {
    onEdit: (id: number) => void;
    onAdd: () => void;
}

const AdminTours: React.FC<AdminToursProps> = ({ onEdit, onAdd }) => {
    const { language, t, getErrorMessage } = useSettings();
    const [tours, setTours] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'id', direction: 'desc' });

    const fetchTours = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await api.get('/admin/tours');
            setTours(data);
        } catch (error: any) {
            console.error('Failed to fetch admin tours:', error);
            setError(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchTours(); }, []);

    const handleDelete = async (id: number) => {
        setDeletingId(id);
        try {
            await api.delete(`/tours/${id}`);
            setTours(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error('Failed to delete tour:', err);
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const sortedTours = [...tours].sort((a, b) => {
        if (sortConfig.key === 'price') {
            return sortConfig.direction === 'asc' ? a.price - b.price : b.price - a.price;
        }
        if (sortConfig.key === 'id') {
            return sortConfig.direction === 'asc' ? a.id - b.id : b.id - a.id;
        }
        return 0;
    });

    const renderActions = (tour: any) => (
        confirmDeleteId === tour.id ? (
            <>
                <button
                    className="action-ic danger"
                    title="Підтвердити видалення"
                    onClick={() => handleDelete(tour.id)}
                    disabled={deletingId === tour.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    {deletingId === tour.id ? <Icon name="clock-loading" size={16} className="spin-anim" /> : <Icon name="check" size={16} />}
                </button>
                <button
                    className="action-ic"
                    title="Скасувати"
                    onClick={() => setConfirmDeleteId(null)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                ><Icon name="close" size={16} /></button>
            </>
        ) : (
            <>
                <button
                    className="action-ic"
                    title="Редагувати"
                    onClick={() => onEdit(tour.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                ><Icon name="edit" size={16} /></button>
                <button
                    className="action-ic"
                    title="Видалити"
                    onClick={() => setConfirmDeleteId(tour.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                ><Icon name="trash" size={16} /></button>
            </>
        )
    );

    return (
        <section className="tours-table-card">
            <div className="card-header">
                <h3 className="card-title">
                    {language === 'en' ? 'Manage Tours' : 'Управління турами'} ({tours.length})
                </h3>
                <div className="admin-sort-controls">
                    <select 
                        value={`${sortConfig.key}-${sortConfig.direction}`}
                        onChange={(e) => {
                            const [key, dir] = e.target.value.split('-');
                            setSortConfig({ key, direction: dir as 'asc' | 'desc' });
                        }}
                        className="admin-sort-select"
                    >
                        <option value="id-desc">{language === 'en' ? 'Newest First' : 'Спочатку нові'}</option>
                        <option value="id-asc">{language === 'en' ? 'Oldest First' : 'Спочатку старі'}</option>
                        <option value="price-asc">{language === 'en' ? 'Price: Low to High' : 'Ціна: від дешевих'}</option>
                        <option value="price-desc">{language === 'en' ? 'Price: High to Low' : 'Ціна: від дорогих'}</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="table-loading">{t('common.loading')}</div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#ff4d4f' }}>
                    <p>{error}</p>
                    <button onClick={fetchTours} style={{ marginTop: '1rem', cursor: 'pointer', background: 'none', border: '1px solid currentColor', padding: '4px 12px', borderRadius: '4px' }}>
                        {language === 'en' ? 'Retry' : 'Спробувати знову'}
                    </button>
                </div>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="admin-table-wrapper admin-tours-desktop">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Назва туру</th>
                                    <th>Напрямок</th>
                                    <th>Ціна</th>
                                    <th>Зірки</th>
                                    <th>Дії</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTours.map((tour) => (
                                    <tr key={tour.id}>
                                        <td>{tour.title}</td>
                                        <td>{tour.location || tour.country || '—'}</td>
                                        <td>₴ {tour.price?.toLocaleString()}</td>
                                        <td>{'★'.repeat(tour.stars || 0)}</td>
                                        <td className="table-actions" style={{ display: 'flex', gap: '4px' }}>
                                            {renderActions(tour)}
                                        </td>
                                    </tr>
                                ))}
                                {tours.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                                            Турів ще немає. Додайте перший!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="admin-tours-mobile">
                        {tours.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                                Турів ще немає. Додайте перший!
                            </div>
                        )}
                        {sortedTours.map((tour) => (
                            <div key={tour.id} className="tour-mobile-card">
                                {tour.image_url && (
                                    <div
                                        className="tour-mobile-image"
                                        style={{ backgroundImage: `url(${tour.image_url})` }}
                                    />
                                )}
                                <div className="tour-mobile-body">
                                    <div className="tour-mobile-title">{tour.title}</div>
                                    <div className="tour-mobile-meta">
                                        <span>{tour.location || tour.country || '—'}</span>
                                        <span>{'★'.repeat(tour.stars || 0)}</span>
                                        <span>₴ {tour.price?.toLocaleString()}</span>
                                    </div>
                                    <div className="tour-mobile-actions">
                                        {renderActions(tour)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
};

export default AdminTours;
