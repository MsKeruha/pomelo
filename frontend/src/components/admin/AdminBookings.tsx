import React, { useState, useEffect } from 'react';
import Icon from '../common/Icon';
import { useSettings } from '../../context/SettingsContext';
import { api } from '../../api/client';

type StatusFilter = 'all' | 'Confirmed' | 'Pending' | 'Cancelled';

const STATUS_LABELS: Record<string, string> = {
    Confirmed: 'Підтверджено',
    Pending: 'Очікує',
    Cancelled: 'Скасовано',
};

const AdminBookings: React.FC = () => {
    const { language, t, getErrorMessage } = useSettings();
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'id', direction: 'desc' });

    const fetchBookings = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await api.get('/admin/bookings');
            setBookings(data || []);
        } catch (error: any) {
            console.error('Failed to fetch admin bookings:', error);
            setError(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchBookings(); }, []);

    const updateStatus = async (bookingId: number, newStatus: string) => {
        setUpdatingId(bookingId);
        try {
            const updated = await api.put(`/admin/bookings/${bookingId}/status`, { status: newStatus });
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: updated.status } : b));
        } catch (err) {
            console.error('Failed to update booking status:', err);
        } finally {
            setUpdatingId(null);
        }
    };

    const filtered = statusFilter === 'all'
        ? bookings
        : bookings.filter(b => b.status === statusFilter);

    const sortedBookings = [...filtered].sort((a, b) => {
        if (sortConfig.key === 'price') {
            return sortConfig.direction === 'asc' ? a.total_price - b.total_price : b.total_price - a.total_price;
        }
        if (sortConfig.key === 'id') {
            return sortConfig.direction === 'asc' ? a.id - b.id : b.id - a.id;
        }
        return 0;
    });

    const counts: Record<string, number> = {
        all: bookings.length,
        Confirmed: bookings.filter(b => b.status === 'Confirmed').length,
        Pending: bookings.filter(b => b.status === 'Pending').length,
        Cancelled: bookings.filter(b => b.status === 'Cancelled').length,
    };

    const renderActions = (b: any) => (
        <div className="booking-actions-group">
            <button
                className="action-ic"
                title="Деталі"
                onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            ><Icon name="eye" size={16} /> <span className="admin-mobile-only" style={{ marginLeft: '6px' }}>Деталі</span></button>
            <button
                className="action-ic"
                title="Підтвердити"
                disabled={updatingId === b.id || b.status === 'Confirmed' || b.status === 'Cancelled'}
                onClick={() => updateStatus(b.id, 'Confirmed')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                {updatingId === b.id ? <Icon name="clock-loading" size={16} className="spin-anim" /> : <Icon name="check-circle" size={16} />}
                <span className="admin-mobile-only" style={{ marginLeft: '6px' }}>Підтвердити</span>
            </button>
            <button
                className="action-ic danger"
                title="Скасувати"
                disabled={updatingId === b.id || b.status === 'Cancelled'}
                onClick={() => updateStatus(b.id, 'Cancelled')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <Icon name="close" size={16} />
                <span className="admin-mobile-only" style={{ marginLeft: '6px' }}>Скасувати</span>
            </button>
        </div>
    );

    return (
        <section className="tours-table-card">
            <div className="card-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 className="card-title">{language === 'en' ? 'Manage Bookings' : 'Управління бронюваннями'}</h3>
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
                <div className="table-filters status-tabs">
                    {(['all', 'Confirmed', 'Pending', 'Cancelled'] as StatusFilter[]).map(s => (
                        <button
                            key={s}
                            className={`status-tab ${statusFilter === s ? 'active' : ''}`}
                            onClick={() => setStatusFilter(s)}
                        >
                            {s === 'all' ? (language === 'en' ? 'All' : 'Всі') : (language === 'en' ? s : STATUS_LABELS[s])} ({counts[s]})
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="table-loading">{t('common.loading')}</div>
            ) : error ? (
                <div className="table-error" style={{ textAlign: 'center', padding: '2rem', color: '#ff4d4f' }}>
                    <p>{error}</p>
                    <button onClick={fetchBookings} style={{ marginTop: '1rem', cursor: 'pointer', background: 'none', border: '1px solid currentColor', padding: '4px 12px', borderRadius: '4px' }}>
                        {language === 'en' ? 'Retry' : 'Спробувати знову'}
                    </button>
                </div>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="admin-table-wrapper admin-desktop">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Клієнт</th>
                                    <th>Тур</th>
                                    <th>Дати</th>
                                    <th>Сума</th>
                                    <th>Статус</th>
                                    <th>Дії</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedBookings.map((b) => (
                                    <React.Fragment key={b.id}>
                                        <tr className={expandedId === b.id ? 'row-expanded' : ''}>
                                            <td>#{b.id}</td>
                                            <td>{b.user?.full_name || 'Гість'}</td>
                                            <td>{b.tour?.title || 'Видалений тур'}</td>
                                            <td>{b.date_range || '—'}</td>
                                            <td>₴ {b.total_price?.toLocaleString() || '—'}</td>
                                            <td>
                                                <span className={`table-badge ${b.status?.toLowerCase()}`}>
                                                    {STATUS_LABELS[b.status] || b.status}
                                                </span>
                                            </td>
                                            <td className="table-actions">
                                                {renderActions(b)}
                                            </td>
                                        </tr>
                                        {expandedId === b.id && (
                                            <tr className="detail-row">
                                                <td colSpan={7}>
                                                    <div className="booking-detail-expand">
                                                        <span><Icon name="user" size={14} /> {b.user?.email || '—'}</span>
                                                        <span><Icon name="moon" size={14} /> {b.nights} ночей</span>
                                                        <span><Icon name="users-group" size={14} /> {b.people_count} осіб</span>
                                                        <span><Icon name="calendar" size={14} /> {b.date_range}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                {sortedBookings.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                                            Бронювань не знайдено
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="admin-mobile-list">
                        {sortedBookings.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                                Бронювань не знайдено
                            </div>
                        )}
                        {sortedBookings.map((b) => (
                            <div key={b.id} className="admin-item-card">
                                <div className="card-main-info">
                                    <div className="card-top-row">
                                        <span className="card-id">#{b.id}</span>
                                        <span className={`table-badge ${b.status?.toLowerCase()}`}>
                                            {STATUS_LABELS[b.status] || b.status}
                                        </span>
                                    </div>
                                    <div className="card-content-row">
                                        <label>Клієнт:</label>
                                        <span>{b.user?.full_name || 'Гість'}</span>
                                    </div>
                                    <div className="card-content-row">
                                        <label>Тур:</label>
                                        <span className="tour-title-cell">{b.tour?.title || 'Видалений тур'}</span>
                                    </div>
                                    <div className="card-content-row">
                                        <label>Дати:</label>
                                        <span>{b.date_range || '—'}</span>
                                    </div>
                                    <div className="card-content-row">
                                        <label>Сума:</label>
                                        <strong>₴ {b.total_price?.toLocaleString() || '—'}</strong>
                                    </div>
                                </div>
                                
                                {expandedId === b.id && (
                                    <div className="card-expanded-info">
                                        <div className="card-content-row">
                                            <label>Email:</label>
                                            <span>{b.user?.email || '—'}</span>
                                        </div>
                                        <div className="card-content-row">
                                            <label>Додатково:</label>
                                            <span>{b.nights} ночей, {b.people_count} осіб</span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="card-footer-actions">
                                    {renderActions(b)}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
};

export default AdminBookings;
