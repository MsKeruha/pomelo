import React from 'react';
import Icon from '../components/common/Icon';
import { useSettings } from '../context/SettingsContext';

const MaintenancePage: React.FC = () => {
    const { language } = useSettings();
    
    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--grad-hero)',
            color: 'white',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                padding: '3rem',
                borderRadius: '2rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem',
                maxWidth: '500px'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'var(--pomelo-orange)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 30px rgba(255, 165, 0, 0.4)'
                }}>
                    <Icon name="settings" size={40} style={{ color: 'white' }} />
                </div>
                
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>
                    {language === 'en' ? 'Maintenance Mode' : 'Технічні роботи'}
                </h1>
                
                <p style={{ fontSize: '1.25rem', opacity: 0.9, lineHeight: 1.5 }}>
                    {language === 'en' 
                        ? 'We are currently updating the platform to bring you a better experience. We\'ll be back online very soon!' 
                        : 'Ми оновлюємо платформу, щоб зробити ваш відпочимок ще кращим. Повернемося зовсім скоро!'}
                </p>
                
                <div style={{ marginTop: '1rem', padding: '1rem 2rem', background: 'rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: '0.9rem' }}>
                    <p style={{ margin: 0 }}>Support: <strong>support@pomelo.travel</strong></p>
                </div>

                <button 
                    onClick={() => window.location.hash = 'auth'}
                    style={{
                        marginTop: '1.5rem',
                        background: 'none',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'rgba(255,255,255,0.6)',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        transition: 'all 0.2s',
                        fontWeight: 600
                    }}
                >
                    {language === 'en' ? 'STAFF ACCESS' : 'ВХІД ДЛЯ ПЕРСОНАЛУ'}
                </button>
            </div>
            
            <p style={{ marginTop: '2rem', opacity: 0.6, fontSize: '0.8rem', letterSpacing: '2px' }}>
                POMELO TRAVEL PLATFORM
            </p>
        </div>
    );
};

export default MaintenancePage;
