import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import Icon from '../common/Icon';

interface AdminToursProps {
    onEdit: (id: number) => void;
    onAdd: () => void;
}

const AdminTours: React.FC<AdminToursProps> = ({ onEdit, onAdd }) => {
    const [tours, setTours] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const fetchTours = async () => {
        try {
            const data = await api.get('/admin/tours');
            setTours(data);
        } catch (error) {
            console.error('Failed to fetch admin tours:', error);
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

    return (
        <section className="tours-table-card">
            <div className="card-header">
                <h3 className="card-title">Управління турами ({tours.length})</h3>
                <div className="table-filters">
                </div>
            </div>
            {isLoading ? (
                <div className="table-loading">Завантаження турів...</div>
            ) : (
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
                        {tours.map((tour) => (
                            <tr key={tour.id}>
                                <td>{tour.title}</td>
                                <td>{tour.location || tour.country || '—'}</td>
                                <td>₴ {tour.price?.toLocaleString()}</td>
                                <td>{'★'.repeat(tour.stars || 0)}</td>
                                <td className="table-actions">
                                    <button
                                        className="action-ic"
                                        title="Редагувати"
                                        onClick={() => onEdit(tour.id)}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    ><Icon name="edit" size={16} /></button>
                                    {confirmDeleteId === tour.id ? (
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
                                        <button
                                            className="action-ic"
                                            title="Видалити"
                                            onClick={() => setConfirmDeleteId(tour.id)}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        ><Icon name="trash" size={16} /></button>
                                    )}
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
            )}
        </section>
    );
};

export default AdminTours;
