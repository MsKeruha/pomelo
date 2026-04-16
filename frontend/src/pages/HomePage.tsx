import React from 'react';
import Hero from '../components/Hero';
import TrendingTours from '../components/TrendingTours';
import CategorySection from '../components/Categories';
import SupportWidget from '../components/SupportWidget';

const HomePage: React.FC = () => {
    return (
        <>
            <Hero />
            <TrendingTours />
            <CategorySection />
            <SupportWidget />
        </>
    );
};

export default HomePage;
