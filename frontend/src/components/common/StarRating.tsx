import React from 'react';
import Icon from './Icon';
import './StarRating.css';

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: number;
    showLabel?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ 
    rating, 
    maxRating = 5, 
    size = 16,
    showLabel = false
}) => {
    // Ensure rating is within bounds
    const normalizedRating = Math.max(0, Math.min(rating, maxRating));
    
    return (
        <div className="star-rating-container" style={{ '--star-size': `${size}px` } as React.CSSProperties}>
            <div className="stars-wrapper">
                {/* Background stars (empty) */}
                <div className="stars-bg">
                    {Array.from({ length: maxRating }).map((_, i) => (
                        <Icon 
                            key={`bg-${i}`} 
                            name="star" 
                            size={size} 
                            color="#e2e8f0" 
                            strokeWidth={1.5}
                        />
                    ))}
                </div>
                
                {/* Foreground stars (filled) */}
                <div 
                    className="stars-fg" 
                    style={{ width: `${(normalizedRating / maxRating) * 100}%` }}
                >
                    <div className="stars-fg-inner">
                        {Array.from({ length: maxRating }).map((_, i) => (
                            <Icon 
                                key={`fg-${i}`} 
                                name="star" 
                                size={size} 
                                color="#FFD700" 
                                fill="#FFD700"
                                strokeWidth={1.5}
                            />
                        ))}
                    </div>
                </div>
            </div>
            
            {showLabel && (
                <span className="rating-label">{normalizedRating.toFixed(1)}</span>
            )}
        </div>
    );
};

export default StarRating;
