import React from 'react';
import './NotFoundPage.css';
import Icon from '../components/common/Icon';
import { useSettings } from '../context/SettingsContext';

const NotFoundPage: React.FC = () => {
    const { t } = useSettings();
    return (
        <div className="notfound-container">
            <div className="nf-content">
                <h1 className="nf-error-code">404</h1>
                <h2 className="nf-title">{t('nf.title')}</h2>
                <p className="nf-text">
                    {t('nf.text')}
                </p>
                <div className="nf-actions">
                    <button className="btn-nf-home" onClick={() => window.location.hash = 'home'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        {t('nf.back_home')} <Icon name="beach" size={20} />
                    </button>
                    <button className="btn-nf-search" onClick={() => window.location.hash = 'search'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        {t('nf.search_tours')} <Icon name="plane" size={20} />
                    </button>
                </div>
            </div>
            
            <div className="nf-bg-elements">
                <div className="nf-circle c-1"></div>
                <div className="nf-circle c-2"></div>
            </div>
        </div>
    );
};

export default NotFoundPage;
