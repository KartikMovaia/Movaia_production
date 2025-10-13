// src/components/common/LoadingSpinner.tsx

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'neutral';
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'primary',
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'border-primary-200 border-t-primary-600',
    white: 'border-white/30 border-t-white',
    neutral: 'border-neutral-200 border-t-neutral-600'
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-400 blur-2xl opacity-20 animate-pulse"></div>
            <div className={`relative ${sizeClasses.xl} ${colorClasses.primary} border-4 rounded-full animate-spin`}></div>
          </div>
          <p className="text-neutral-600 font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center">
      <div className={`${sizeClasses[size]} ${colorClasses[color]} border-3 rounded-full animate-spin`}></div>
    </div>
  );
};

export default LoadingSpinner;