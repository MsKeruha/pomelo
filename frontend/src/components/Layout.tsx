import React from 'react';
import Header from './Header';
import SupportWidget from './SupportWidget';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
}

const Footer: React.FC = () => (
    <footer className="main-footer">
        <p className="footer-text">© 2025 Pomelo — Платформа туристичних послуг</p>
    </footer>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="main-layout">
            <Header />
            <main className="main-content">
                {children}
            </main>
            <Footer />
            <SupportWidget />
        </div>
    );
};

export default Layout;
