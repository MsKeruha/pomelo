import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import Icon from '../common/Icon';
import Modal from '../common/Modal';
import './AdminManagers.css';

const AdminManagers: React.FC = () => {
    const [managers, setManagers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newManager, setNewManager] = useState({ email: '', full_name: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const fetchManagers = async () => {
        setIsLoading(true);
        try {
            const data = await api.get('/admin/users?role=manager');
            setManagers(data);
        } catch (err) {
            console.error('Failed to fetch managers:', err);
        } finally {
            setTimeout(() => setIsLoading(false), 300);
        }
    };

    useEffect(() => {
        fetchManagers();
    }, []);

    const handleAddManager = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            await api.post('/admin/users', newManager);
            setIsAddModalOpen(false);
            setNewManager({ email: '', full_name: '', password: '' });
            fetchManagers();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Не вдалося створити менеджера');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await api.delete(`/admin/users/${confirmDeleteId}`);
            fetchManagers();
        } catch (err) {
            console.error('Failed to delete manager:', err);
        } finally {
            setConfirmDeleteId(null);
        }
    };

    if (isLoading && managers.length === 0) return <div className="admin-loading">Завантаження...</div>;

    return (
        <div className="admin-managers-container">
            <div className="managers-header">
                <div className="header-info">
                    <h2>Керування персоналом</h2>
                    <p>Повний список менеджерів з доступом до панелі керування Помело.</p>
                </div>
                <button className="btn-new-tour" onClick={() => setIsAddModalOpen(true)}>
                    <Icon name="users" size={18} style={{ marginRight: '8px' }} /> Додати менеджера
                </button>
            </div>

            <div className="managers-table-card">
                <table className="admin-table-modern">
                    <thead>
                        <tr>
                            <th>Спеціаліст</th>
                            <th>Email адреса</th>
                            <th>Статус</th>
                            <th style={{ textAlign: 'center' }}>Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        {managers.map(m => (
                            <tr key={m.id}>
                                <td>
                                    <div className="manager-profile">
                                        <div className="manager-avatar-circle">
                                            {m.full_name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="manager-name">{m.full_name}</span>
                                            <span className="manager-email-sub">{m.role === 'admin' ? 'Адміністратор' : 'Менеджер'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{m.email}</td>
                                <td>
                                    <span className="status-badge-staff">Активний</span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <button 
                                            className="btn-delete-manager"
                                            onClick={() => setConfirmDeleteId(m.id)}
                                            title="Видалити"
                                            disabled={m.role === 'admin'}
                                        >
                                            <Icon name="close" size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                title="Реєстрація спеціаліста"
            >
                <form onSubmit={handleAddManager} className="editor-form">
                    <div className="form-group-admin" style={{ marginBottom: '15px' }}>
                        <label>ПОВНЕ ІМ'Я</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="Олександр Петренко"
                            value={newManager.full_name}
                            onChange={e => setNewManager({...newManager, full_name: e.target.value})}
                        />
                    </div>
                    <div className="form-group-admin" style={{ marginBottom: '15px' }}>
                        <label>EMAIL</label>
                        <input 
                            type="email" 
                            required 
                            placeholder="manager@pomelo.ua"
                            value={newManager.email}
                            onChange={e => setNewManager({...newManager, email: e.target.value})}
                        />
                    </div>
                    <div className="form-group-admin" style={{ marginBottom: '20px' }}>
                        <label>ПАРОЛЬ ДЛЯ ВХОДУ</label>
                        <input 
                            type="password" 
                            required 
                            minLength={6}
                            placeholder="••••••••"
                            value={newManager.password}
                            onChange={e => setNewManager({...newManager, password: e.target.value})}
                        />
                    </div>
                    {error && <p className="editor-error">{error}</p>}
                    <button 
                        type="submit" 
                        className="btn-save-tour" 
                        disabled={isSubmitting}
                        style={{ width: '100%' }}
                    >
                        {isSubmitting ? 'Створення...' : 'Зареєструвати менеджера'}
                    </button>
                    <button 
                        type="button" 
                        className="btn-admin-secondary" 
                        onClick={() => setIsAddModalOpen(false)}
                        style={{ width: '100%', marginTop: '10px' }}
                    >
                        Скасувати
                    </button>
                </form>
            </Modal>

            <Modal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                title="Підтвердження видалення"
                hideFooter={true}
            >
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>⚠️</div>
                    <p style={{ fontSize: '16px', marginBottom: '25px', lineHeight: '1.5' }}>
                        Ви впевнені, що хочете видалити цього менеджера?<br />
                        <span style={{ color: '#EA4335', fontSize: '14px' }}>Цю дію неможливо буде скасувати.</span>
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            className="btn-admin-secondary" 
                            onClick={() => setConfirmDeleteId(null)}
                            style={{ flex: 1 }}
                        >
                            Скасувати
                        </button>
                        <button 
                            className="btn-save-tour" 
                            onClick={handleDelete}
                            style={{ flex: 1, backgroundColor: '#EA4335' }}
                        >
                            Видалити
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminManagers;
