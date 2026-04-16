import React, { useState } from 'react';
import './AuthPage.css';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { api } from '../api/client';
import Modal from '../components/common/Modal';

const AuthPage: React.FC = () => {
    const { language, t } = useSettings();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Modal state for feedback
    const [modalInfo, setModalInfo] = useState({ 
        isOpen: false, 
        title: '', 
        message: '', 
        type: 'info' as 'info' | 'error' | 'success' 
    });
    
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (mode === 'register') {
                await api.post('/register', { 
                    email, 
                    password, 
                    full_name: fullName 
                });
                setModalInfo({
                    isOpen: true,
                    title: t('auth.success_title', 'Реєстрація успішна!'),
                    message: t('auth.success_msg', 'Тепер ви можете увійти у свій акаунт.'),
                    type: 'success'
                });
                setMode('login');
            } else {
                const formData = new FormData();
                formData.append('username', email);
                formData.append('password', password);
                
                const data = await api.login(formData);
                await login(data.access_token);
                // Decode role from JWT payload to redirect correctly
                try {
                    const payload = JSON.parse(atob(data.access_token.split('.')[1]));
                    if (payload.role === 'admin' || payload.role === 'manager') {
                        window.location.hash = 'admin';
                    } else {
                        window.location.hash = 'dashboard';
                    }
                } catch {
                    window.location.hash = 'dashboard';
                }
            }
        } catch (err: any) {
            let errorMsg = t('auth.error_msg', 'Сталася непередбачена помилка. Спробуйте ще раз.');
            let errorTitle = t('auth.error_title', 'Помилка авторизації');

            if (err.message === 'Incorrect email or password') {
                errorMsg = t('auth.error_forbidden_msg', 'Неправильна пошта або пароль. Перевірте дані та спробуйте знову.');
                errorTitle = t('auth.error_forbidden_title', 'Доступ заборонено');
            } else if (err.message.includes('already registered')) {
                errorMsg = t('auth.error_exists', 'Користувач з таким email вже існує.');
            }

            setModalInfo({
                isOpen: true,
                title: errorTitle,
                message: errorMsg,
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">
                        {mode === 'login' ? t('auth.welcome_back', 'З поверненням!') : t('auth.create_account', 'Створити акаунт')}
                    </h1>
                    <p className="auth-subtitle">
                        {mode === 'login' 
                            ? t('auth.login_subtitle', 'Увійдіть, щоб керувати своїми мандрівками') 
                            : t('auth.register_subtitle', 'Приєднуйтесь до спільноти Pomelo Travel')}
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div className="form-group">
                            <label>{t('auth.full_name', "ПОВНЕ ІМ'Я")}</label>
                            <input 
                                type="text" 
                                placeholder={t('auth.name_placeholder', "Ваше ім'я (наприклад, Іван Іванов)")} 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required 
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label>{t('auth.email', 'EMAIL')}</label>
                        <input 
                            type="email" 
                            placeholder="example@email.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('auth.password', 'ПАРОЛЬ')}</label>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                    </div>

                    {mode === 'login' && (
                        <div className="form-footer-links">
                            <label className="checkbox-item">
                                <input type="checkbox" />
                                <span>{t('auth.remember_me', "Запам'ятати мене")}</span>
                            </label>
                            <a href="#" className="forgot-password">{t('auth.forgot_password', 'Забули пароль?')}</a>
                        </div>
                    )}

                    <button type="submit" className="btn-auth-submit" disabled={isLoading}>
                        {isLoading ? (language === 'en' ? 'Loading...' : 'Завантаження...') : (mode === 'login' ? t('auth.login_btn', 'Увійти') : t('auth.register_btn', 'Зареєструватися'))}
                    </button>
                </form>

                <div className="auth-social-separator">
                    <span>{t('auth.or_login_via', 'або увійдіть через')}</span>
                </div>

                <div className="social-grid">
                    <button className="btn-social google">
                        <span className="social-icon">G</span> Google
                    </button>
                    <button className="btn-social facebook">
                        <span className="social-icon">f</span> Facebook
                    </button>
                </div>

                <div className="auth-toggle">
                    {mode === 'login' ? (
                        <>
                            {t('auth.no_account', 'Немає акаунту?')}{' '}
                            <button className="btn-toggle-link" onClick={() => setMode('register')}>
                                {t('auth.create_account', 'Створити акаунт')}
                            </button>
                        </>
                    ) : (
                        <>
                            {t('auth.have_account', 'Вже маєте акаунт?')}{' '}
                            <button className="btn-toggle-link" onClick={() => setMode('login')}>
                                {t('auth.login_link', 'Увійти в систему')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <Modal 
                isOpen={modalInfo.isOpen} 
                onClose={() => setModalInfo({ ...modalInfo, isOpen: false })}
                title={modalInfo.title}
                type={modalInfo.type}
            >
                {modalInfo.message}
            </Modal>

            <div className="auth-decorative">
                <div className="d-circle d-1"></div>
                <div className="d-circle d-2"></div>
                <div className="d-circle d-3"></div>
            </div>
        </div>
    );
};

export default AuthPage;
