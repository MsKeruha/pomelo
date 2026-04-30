import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import Icon from '../common/Icon';
import Modal from '../common/Modal';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';

const AdminCategories: React.FC = () => {
    const { user } = useAuth();
    const { language, t, getErrorMessage } = useSettings();
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', message: '' });

    const [form, setForm] = useState({
        name: '',
        name_en: '',
        emoji: 'plane' // Backend still uses 'emoji' field, but we store icon name there
    });

    const AVAILABLE_ICONS = [
        'plane', 'mountain', 'ship', 'beach', 'city', 'lion', 
        'heart', 'star', 'map', 'anchor', 'spa', 'pool', 
        'restaurant', 'gym', 'wifi', 'party', 'sun', 'snow',
        'home', 'users', 'message', 'settings', 'bell', 'clock'
    ];

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const data = await api.get('/categories');
            setCategories(data);
        } catch (err: any) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleOpenModal = (cat?: any) => {
        if (cat) {
            setEditId(cat.id);
            setForm({ name: cat.name, name_en: cat.name_en || '', emoji: cat.emoji || 'plane' });
        } else {
            setEditId(null);
            setForm({ name: '', name_en: '', emoji: 'plane' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        
        if (!form.name.trim()) {
            setFieldErrors({ name: language === 'en' ? 'Name (UA) is required' : 'Назва (UA) обов’язкова' });
            return;
        }

        setIsSaving(true);
        try {
            if (editId) {
                await api.put(`/admin/categories/${editId}`, form);
            } else {
                await api.post('/admin/categories', form);
            }
            fetchCategories();
            setIsModalOpen(false);
        } catch (err: any) {
            setInfoModal({
                isOpen: true,
                title: language === 'en' ? 'Error' : 'Помилка',
                message: getErrorMessage(err)
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        setIsDeleting(true);
        try {
            await api.delete(`/admin/categories/${confirmDeleteId}`);
            setCategories(prev => prev.filter(c => c.id !== confirmDeleteId));
            setConfirmDeleteId(null);
        } catch (err: any) {
            alert(getErrorMessage(err));
        } finally {
            setIsDeleting(false);
        }
    };

    const renderActions = (c: any) => (
        user?.role !== 'manager' ? (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button className="action-ic" onClick={() => handleOpenModal(c)}><Icon name="edit" size={16} /></button>
                <button className="action-ic danger" onClick={() => setConfirmDeleteId(c.id)}><Icon name="trash" size={16} /></button>
            </div>
        ) : (
            <span className="view-only-badge" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{language === 'en' ? 'View only' : 'Лише перегляд'}</span>
        )
    );

    return (
        <section className="admin-categories-section tours-table-card">
            <div className="card-header">
                <h3 className="card-title">{language === 'en' ? 'Manage Categories' : 'Управління категоріями'} ({categories.length})</h3>
                {user?.role !== 'manager' && (
                    <button className="btn-new-tour" onClick={() => handleOpenModal()}>+ {language === 'en' ? 'New Category' : 'Нова категорія'}</button>
                )}
            </div>

            {isLoading ? (
                <div className="table-loading">{t('common.loading')}</div>
            ) : error ? (
                <div className="table-error">{error}</div>
            ) : (
                <>
                    {/* Desktop View */}
                    <div className="admin-table-wrapper admin-desktop">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Icon</th>
                                    <th>{language === 'en' ? 'Name (UK)' : 'Назва (UA)'}</th>
                                    <th>{language === 'en' ? 'Name (EN)' : 'Назва (EN)'}</th>
                                    <th style={{ textAlign: 'center' }}>Дії</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((c) => (
                                    <tr key={c.id}>
                                        <td>
                                            <div style={{ color: 'var(--pomelo-green)', backgroundColor: 'rgba(168, 208, 141, 0.1)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Icon name={c.emoji as any} size={20} />
                                            </div>
                                        </td>
                                        <td>{c.name}</td>
                                        <td>{c.name_en || '—'}</td>
                                        <td className="table-actions">
                                            {renderActions(c)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="admin-mobile-list">
                        {categories.map((c) => (
                            <div key={c.id} className="admin-item-card">
                                <div className="card-top-row">
                                    <div style={{ color: 'var(--pomelo-green)', backgroundColor: 'rgba(168, 208, 141, 0.1)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon name={c.emoji as any} size={20} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {renderActions(c)}
                                    </div>
                                </div>
                                <div className="card-main-info">
                                    <div className="card-content-row">
                                        <label>{language === 'en' ? 'Name (UK):' : 'Назва (UA):'}</label>
                                        <strong>{c.name}</strong>
                                    </div>
                                    <div className="card-content-row">
                                        <label>{language === 'en' ? 'Name (EN):' : 'Назва (EN):'}</label>
                                        <span>{c.name_en || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? (language === 'en' ? 'Edit Category' : 'Редагувати категорію') : (language === 'en' ? 'New Category' : 'Нова категорія')}
                hideFooter={true}
            >
                <form onSubmit={handleSave} className="admin-form-compact">
                    <div className="form-group-admin">
                        <label>{language === 'en' ? 'CHOOSE ICON' : 'ОБЕРІТЬ ІКОНКУ'}</label>
                        <div className="icon-picker-grid" style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(6, 1fr)', 
                            gap: '8px', 
                            marginTop: '8px',
                            maxHeight: '160px',
                            overflowY: 'auto',
                            padding: '8px',
                            border: '1px solid var(--border-divider)',
                            borderRadius: '12px'
                        }}>
                            {AVAILABLE_ICONS.map(iconName => (
                                <div 
                                    key={iconName}
                                    onClick={() => setForm({...form, emoji: iconName})}
                                    style={{
                                        cursor: 'pointer',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        backgroundColor: form.emoji === iconName ? 'rgba(168, 208, 141, 0.2)' : 'transparent',
                                        border: form.emoji === iconName ? '2px solid var(--pomelo-green)' : '2px solid transparent',
                                        color: form.emoji === iconName ? 'var(--pomelo-green)' : 'var(--text-muted)'
                                    }}
                                >
                                    <Icon name={iconName as any} size={20} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={`form-group-admin ${fieldErrors.name ? 'error' : ''}`}>
                        <label>{language === 'en' ? 'Name (Ukrainian)' : 'Назва (Українська)'}</label>
                        <input 
                            value={form.name} 
                            onChange={e => {
                                setForm({...form, name: e.target.value});
                                if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                            }} 
                        />
                        {fieldErrors.name && <span className="field-hint">{fieldErrors.name}</span>}
                    </div>
                    <div className="form-group-admin">
                        <label>{language === 'en' ? 'Name (English)' : 'Назва (Англійська)'}</label>
                        <input value={form.name_en} onChange={e => setForm({...form, name_en: e.target.value})} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>{language === 'en' ? 'Cancel' : 'Скасувати'}</button>
                        <button type="submit" className="btn-save-tour" disabled={isSaving} style={{ flex: 1 }}>
                            {isSaving ? '...' : (language === 'en' ? 'Save' : 'Зберегти')}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                title={language === 'en' ? 'Delete Category' : 'Видалення категорії'}
                hideFooter={true}
            >
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>⚠️</div>
                    <p style={{ fontSize: '16px', marginBottom: '25px', lineHeight: '1.5' }}>
                        {language === 'en' ? (
                            <>Are you sure? This will affect tours in this category.<br /><span style={{ color: '#EA4335', fontSize: '14px' }}>This action cannot be undone.</span></>
                        ) : (
                            <>Ви впевнені? Це вплине на всі тури в цій категорії.<br /><span style={{ color: '#EA4335', fontSize: '14px' }}>Цю дію неможливо скасувати.</span></>
                        )}
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className="btn-admin-secondary"
                            onClick={() => setConfirmDeleteId(null)}
                            style={{ flex: 1 }}
                        >
                            {language === 'en' ? 'Cancel' : 'Скасувати'}
                        </button>
                        <button
                            className="btn-save-tour"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            style={{ flex: 1, backgroundColor: '#EA4335' }}
                        >
                            {isDeleting ? '...' : (language === 'en' ? 'Delete' : 'Видалити')}
                        </button>
                    </div>
                </div>
            </Modal>

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
                        {language === 'en' ? 'Close' : 'Закрити'}
                    </button>
                </div>
            </Modal>
        </section>
    );
};

export default AdminCategories;
