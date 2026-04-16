import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import Icon from '../common/Icon';
import Modal from '../common/Modal';
import { useSettings } from '../../context/SettingsContext';

const AdminCategories: React.FC = () => {
    const { language, t, getErrorMessage } = useSettings();
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [form, setForm] = useState({
        name: '',
        name_en: '',
        emoji: '🍊'
    });

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
            setForm({ name: cat.name, name_en: cat.name_en || '', emoji: cat.emoji || '🍊' });
        } else {
            setEditId(null);
            setForm({ name: '', name_en: '', emoji: '🍊' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
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
            alert(getErrorMessage(err));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(language === 'en' ? 'Are you sure? All related tours might have issues.' : 'Ви впевнені? Це може вплинути на відображення турів у цій категорії.')) return;
        try {
            await api.delete(`/admin/categories/${id}`);
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            alert(getErrorMessage(err));
        }
    };

    return (
        <section className="admin-categories-section">
            <div className="card-header">
                <h3 className="card-title">{language === 'en' ? 'Manage Categories' : 'Управління категоріями'} ({categories.length})</h3>
                <button className="btn-new-tour" onClick={() => handleOpenModal()}>+ {language === 'en' ? 'New Category' : 'Нова категорія'}</button>
            </div>

            {isLoading ? (
                <div className="table-loading">{t('common.loading')}</div>
            ) : error ? (
                <div className="table-error">{error}</div>
            ) : (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Emoji</th>
                                <th>{language === 'en' ? 'Name (UK)' : 'Назва (UA)'}</th>
                                <th>{language === 'en' ? 'Name (EN)' : 'Назва (EN)'}</th>
                                <th>Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((c) => (
                                <tr key={c.id}>
                                    <td style={{ fontSize: '1.5rem' }}>{c.emoji}</td>
                                    <td>{c.name}</td>
                                    <td>{c.name_en || '—'}</td>
                                    <td className="table-actions">
                                        <button className="action-ic" onClick={() => handleOpenModal(c)}><Icon name="edit" size={16} /></button>
                                        <button className="action-ic danger" onClick={() => handleDelete(c.id)}><Icon name="trash" size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? (language === 'en' ? 'Edit Category' : 'Редагувати категорію') : (language === 'en' ? 'New Category' : 'Нова категорія')}
                hideFooter={true}
            >
                <form onSubmit={handleSave} className="admin-form-compact">
                    <div className="form-group-admin">
                        <label>EMOJI</label>
                        <input value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} placeholder="🏖" />
                    </div>
                    <div className="form-group-admin">
                        <label>{language === 'en' ? 'Name (Ukrainian)' : 'Назва (Українська)'}</label>
                        <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
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
        </section>
    );
};

export default AdminCategories;
