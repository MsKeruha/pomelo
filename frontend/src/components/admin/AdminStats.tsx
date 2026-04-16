import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import Icon from '../common/Icon';

const AdminStats: React.FC = () => {
    const [stats, setStats] = useState({
        total_bookings: 0,
        total_users: 0,
        total_revenue: 0,
        active_chats: 0
    });
    const [dailyStats, setDailyStats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [statsData, dailyData] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/stats/monthly')
                ]);
                setStats(statsData);
                setDailyStats(dailyData);
            } catch (error) {
                console.error('Failed to fetch admin stats:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) return <div className="admin-loading">Завантаження показників...</div>;

    const statCards = [
        { label: 'Усього бронювань', value: stats.total_bookings, trend: 'Річна динаміка', color: '#ff6b00', icon: 'calendar' as const },
        { label: 'Виручка', value: `₴ ${stats.total_revenue.toLocaleString()}`, trend: 'Total Revenue', color: '#27ae60', icon: 'dashboard' as const },
        { label: 'Користувачів', value: stats.total_users, trend: 'Активні акаунти', color: '#2d9cdb', icon: 'users' as const },
        { label: 'Активні чати', value: stats.active_chats, trend: 'Live Support', color: '#f2994a', icon: 'message' as const }
    ];

    // Calc max for scaling chart
    const maxVal = Math.max(...dailyStats.map(d => d.val), 5); // at least 5 for scale

    return (
        <div className="admin-stats-wrapper">
            <section className="stats-grid">
                {statCards.map((stat, i) => (
                    <div key={i} className="stat-card-new">
                        <div className="stat-card-header">
                            <div className="stat-icon-circle" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                <Icon name={stat.icon} size={20} />
                            </div>
                            <span className="stat-trend-indicator positive">{stat.trend}</span>
                        </div>
                        <div className="stat-card-body">
                            <span className="stat-label-new">{stat.label}</span>
                            <span className="stat-value-new">{stat.value}</span>
                        </div>
                    </div>
                ))}
            </section>

            <div className="admin-dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                <section className="chart-card">
                    <div className="card-header-flex">
                        <h3 className="card-title">Динаміка бронювань (12 міс)</h3>
                        <div className="chart-legend">
                            <span className="legend-item"><span className="dot" /> Кількість продажів</span>
                        </div>
                    </div>
                    <div className="chart-container-modern" style={{ gap: '8px' }}>
                        {dailyStats.map((d, i) => {
                            const pct = (d.val / maxVal) * 100;
                            return (
                                <div key={i} className="chart-column-group">
                                    <div className="chart-bar-glow" style={{ 
                                        height: `${Math.max(pct, 5)}%`, 
                                        backgroundColor: d.is_current ? '#ff6b00' : '#A8D08D',
                                        boxShadow: d.is_current ? '0 4px 12px rgba(255,107,0,0.2)' : '0 4px 12px rgba(168,208,141,0.2)'
                                    }}>
                                        {d.val > 0 && <span className="bar-label" style={{ 
                                            fontSize: '10px', 
                                            color: d.is_current ? '#ff6b00' : '#27ae60',
                                            top: '-20px'
                                        }}>{d.val}</span>}
                                    </div>
                                    <span className="chart-day" style={{ fontSize: '10px' }}>{d.day}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AdminStats;
