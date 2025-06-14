import React from 'react';

const SkeletonLoader = ({ lines = 3, className = '' }) => {
    return (
        <div className={`space-y-4 animate-pulse ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-300 rounded w-full"></div>
            ))}
        </div>
    );
};

export default SkeletonLoader;
