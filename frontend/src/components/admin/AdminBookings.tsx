import Icon from '../common/Icon';
import { useSettings } from '../../context/SettingsContext';

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

    const counts: Record<string, number> = {
        all: bookings.length,
        Confirmed: bookings.filter(b => b.status === 'Confirmed').length,
        Pending: bookings.filter(b => b.status === 'Pending').length,
        Cancelled: bookings.filter(b => b.status === 'Cancelled').length,
    };

    return (
        <section className="tours-table-card">
            <div className="card-header">
                <h3 className="card-title">{language === 'en' ? 'Manage Bookings' : 'Управління бронюваннями'}</h3>
                <div className="table-filters">
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
                <div className="admin-table-wrapper">
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
                            {filtered.map((b) => (
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
                                            {/* View details */}
                                            <button
                                                className="action-ic"
                                                title="Деталі"
                                                onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            ><Icon name="eye" size={16} /></button>
                                            {/* Confirm */}
                                            <button
                                                className="action-ic"
                                                title="Підтвердити"
                                                disabled={updatingId === b.id || b.status === 'Confirmed'}
                                                onClick={() => updateStatus(b.id, 'Confirmed')}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                {updatingId === b.id ? <Icon name="clock-loading" size={16} className="spin-anim" /> : <Icon name="check-circle" size={16} />}
                                            </button>
                                            {/* Cancel */}
                                            <button
                                                className="action-ic"
                                                title="Скасувати"
                                                disabled={updatingId === b.id || b.status === 'Cancelled'}
                                                onClick={() => updateStatus(b.id, 'Cancelled')}
                                                style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
                                            ><Icon name="close" size={16} /></button>
                                        </td>
                                    </tr>
                                    {expandedId === b.id && (
                                        <tr className="detail-row">
                                            <td colSpan={7}>
                                                <div className="booking-detail-expand">
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="user" size={14} /> {b.user?.email || '—'}</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="moon" size={14} /> {b.nights} ночей</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="users-group" size={14} /> {b.people_count} осіб</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="calendar" size={14} /> {b.date_range}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                                        Бронювань не знайдено
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export default AdminBookings;
