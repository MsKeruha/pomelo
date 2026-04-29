import React, { useState } from 'react';
import './AuthPage.css';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { api } from '../api/client';
import Modal from '../components/common/Modal';

const AuthPage: React.FC = () => {
    const { language, t, getErrorMessage } = useSettings();
    const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resetCode, setResetCode] = useState('');
    const [newResetPassword, setNewResetPassword] = useState('');
    
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
                if (password.length < 6 || password.length > 30) {
                    setModalInfo({
                        isOpen: true,
                        title: t('auth.error_title', 'Помилка'),
                        message: language === 'en' ? 'Password must be between 6 and 30 characters.' : 'Пароль має бути від 6 до 30 символів.',
                        type: 'error'
                    });
                    setIsLoading(false);
                    return;
                }
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
            } else if (mode === 'login') {
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
            } else if (mode === 'forgot') {
                await api.post('/auth/forgot-password', { email });
                setModalInfo({
                    isOpen: true,
                    title: t('auth.reset_sent_title', 'Код надіслано'),
                    message: t('auth.reset_sent_msg', 'Ми надіслали код для скидання на ваш email. (Демо: 1234)'),
                    type: 'success'
                });
                setMode('reset');
            } else if (mode === 'reset') {
                if (newResetPassword.length < 6 || newResetPassword.length > 30) {
                    setModalInfo({
                        isOpen: true,
                        title: t('auth.error_title', 'Помилка'),
                        message: language === 'en' ? 'Password must be between 6 and 30 characters.' : 'Пароль має бути від 6 до 30 символів.',
                        type: 'error'
                    });
                    setIsLoading(false);
                    return;
                }
                await api.post('/auth/reset-password', { 
                    email, 
                    code: resetCode, 
                    new_password: newResetPassword 
                });
                setModalInfo({
                    isOpen: true,
                    title: t('auth.reset_success_title', 'Пароль змінено'),
                    message: t('auth.reset_success_msg', 'Ви успішно змінили пароль. Тепер можете увійти.'),
                    type: 'success'
                });
                setMode('login');
            }
        } catch (err: any) {
            setModalInfo({
                isOpen: true,
                title: t('auth.error_title', 'Помилка'),
                message: getErrorMessage(err, t('auth.error_msg', 'Сталася непередбачена помилка. Спробуйте ще раз.')),
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
                        {mode === 'login' ? t('auth.welcome_back', 'З поверненням!') : 
                         mode === 'register' ? t('auth.create_account', 'Створити акаунт') :
                         mode === 'forgot' ? t('auth.reset_password', 'Відновити пароль') :
                         t('auth.enter_new_password', 'Створити новий пароль')}
                    </h1>
                    <p className="auth-subtitle">
                        {mode === 'login' ? t('auth.login_subtitle', 'Увійдіть, щоб керувати своїми мандрівками') : 
                         mode === 'register' ? t('auth.register_subtitle', 'Приєднуйтесь до спільноти Pomelo Travel') :
                         t('auth.recovery_subtitle', 'Введіть дані для відновлення доступу')}
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {(mode === 'login' || mode === 'register' || mode === 'forgot' || mode === 'reset') && (
                        <div className="form-group">
                            <label>{t('auth.email', 'EMAIL')}</label>
                            <input 
                                type="email" 
                                placeholder="example@email.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                                disabled={mode === 'reset'}
                            />
                        </div>
                    )}
                    
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

                    {(mode === 'login' || mode === 'register') && (
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
                    )}

                    {mode === 'reset' && (
                        <>
                            <div className="form-group">
                                <label>{t('auth.reset_code', 'КОД З EMAIL')}</label>
                                <input 
                                    type="text" 
                                    placeholder="1234" 
                                    value={resetCode}
                                    onChange={(e) => setResetCode(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('auth.new_password', 'НОВИЙ ПАРОЛЬ')}</label>
                                <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={newResetPassword}
                                    onChange={(e) => setNewResetPassword(e.target.value)}
                                    required 
                                />
                            </div>
                        </>
                    )}

                    {mode === 'login' && (
                        <div className="form-footer-links">
                            <label className="checkbox-item">
                                <input type="checkbox" />
                                <span>{t('auth.remember_me', "Запам'ятати мене")}</span>
                            </label>
                            <button type="button" className="btn-toggle-link forgot-password" onClick={() => setMode('forgot')}>
                                {t('auth.forgot_password', 'Забули пароль?')}
                            </button>
                        </div>
                    )}

                    <button type="submit" className="btn-auth-submit" disabled={isLoading}>
                        {isLoading ? (language === 'en' ? 'Loading...' : 'Завантаження...') : 
                         mode === 'login' ? t('auth.login_btn', 'Увійти') : 
                         mode === 'register' ? t('auth.register_btn', 'Зареєструватися') :
                         mode === 'forgot' ? t('auth.send_code', 'Надіслати код') :
                         t('auth.reset_password_btn', 'Змінити пароль')}
                    </button>
                </form>

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
