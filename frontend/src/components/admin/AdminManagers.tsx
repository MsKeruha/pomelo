import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import Icon from '../common/Icon';
import Modal from '../common/Modal';
import './AdminManagers.css';

const AdminManagers: React.FC = () => {
    const [managers, setManagers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newManager, setNewManager] = useState({ email: '', full_name: '', password: '', role: 'manager' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
        
        // Manual validation
        setFieldErrors({});
        const errors: Record<string, string> = {};
        
        if (!newManager.full_name.trim()) errors.full_name = 'Ім’я обов’язкове';
        if (!newManager.email.trim()) errors.email = 'Email обов’язковий';
        else if (!newManager.email.includes('@')) errors.email = 'Невірний формат email';
        if (!newManager.password) errors.password = 'Пароль обов’язковий';
        else if (newManager.password.length < 6) errors.password = 'Мінімум 6 символів';

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            await api.post('/admin/users', newManager);
            setIsAddModalOpen(false);
            setNewManager({ email: '', full_name: '', password: '', role: 'manager' });
            fetchManagers();
        } catch (err: any) {
            setError(err.message || 'Не вдалося створити менеджера');
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
                    <Icon name="users" size={18} /> Додати менеджера
                </button>
            </div>

            {/* Desktop table */}
            <div className="managers-table-card managers-desktop">
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

            {/* Mobile cards */}
            <div className="managers-mobile">
                {managers.map(m => (
                    <div key={m.id} className="manager-mobile-card">
                        <div className="manager-mobile-top">
                            <div className="manager-avatar-circle">
                                {m.full_name[0].toUpperCase()}
                            </div>
                            <div className="manager-mobile-info">
                                <span className="manager-name">{m.full_name}</span>
                                <span className="manager-email-sub">{m.role === 'admin' ? 'Адміністратор' : 'Менеджер'}</span>
                                <span className="manager-mobile-email">{m.email}</span>
                            </div>
                        </div>
                        <div className="manager-mobile-bottom">
                            <span className="status-badge-staff">Активний</span>
                            <button
                                className="btn-delete-manager"
                                onClick={() => setConfirmDeleteId(m.id)}
                                title="Видалити"
                                disabled={m.role === 'admin'}
                            >
                                <Icon name="close" size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {managers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                        Менеджерів не знайдено
                    </div>
                )}
            </div>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Реєстрація спеціаліста"
                hideFooter={true}
            >
                <form onSubmit={handleAddManager} className="editor-form">
                    <div className="admin-editor-form">
                    <div className={`form-group ${fieldErrors.full_name ? 'error' : ''}`}>
                        <label>ПОВНЕ ІМ'Я</label>
                        <input
                            type="text"
                            placeholder="Олексій Менеджер"
                            value={newManager.full_name}
                            onChange={e => {
                                setNewManager({...newManager, full_name: e.target.value});
                                if (fieldErrors.full_name) setFieldErrors(prev => ({ ...prev, full_name: '' }));
                            }}
                        />
                        {fieldErrors.full_name && <span className="field-hint">{fieldErrors.full_name}</span>}
                    </div>

                    <div className={`form-group ${fieldErrors.email ? 'error' : ''}`}>
                        <label>EMAIL</label>
                        <input
                            type="text"
                            placeholder="manager@pomelo.ua"
                            value={newManager.email}
                            onChange={e => {
                                setNewManager({...newManager, email: e.target.value});
                                if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                            }}
                        />
                        {fieldErrors.email && <span className="field-hint">{fieldErrors.email}</span>}
                    </div>

                    <div className={`form-group ${fieldErrors.password ? 'error' : ''}`}>
                        <label>ПАРОЛЬ</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={newManager.password}
                            onChange={e => {
                                setNewManager({...newManager, password: e.target.value});
                                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                            }}
                        />
                        {fieldErrors.password && <span className="field-hint">{fieldErrors.password}</span>}
                    </div>

                    <div className="form-group">
                        <label>РОЛЬ</label>
                        <select 
                            value={newManager.role} 
                            onChange={e => setNewManager({...newManager, role: e.target.value})}
                            style={{ 
                                width: '100%', 
                                padding: '12px', 
                                borderRadius: '8px', 
                                border: '1px solid #e0e0e0',
                                background: 'white',
                                outline: 'none'
                            }}
                        >
                            <option value="manager">Менеджер</option>
                            <option value="admin">Адміністратор</option>
                        </select>
                    </div>
                    {error && <p className="editor-error">{error}</p>}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            className="btn-admin-secondary"
                            onClick={() => setIsAddModalOpen(false)}
                            style={{ flex: 1 }}
                        >
                            Скасувати
                        </button>
                        <button
                            type="submit"
                            className="btn-save-tour"
                            disabled={isSubmitting}
                            style={{ flex: 1 }}
                        >
                            {isSubmitting ? 'Створення...' : 'Зареєструвати'}
                        </button>
                    </div>
                </div>
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
