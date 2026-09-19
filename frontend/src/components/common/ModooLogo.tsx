import React from 'react';

export const ModooLogo: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = '' }) => (
  <img 
    src="/images/logo.jpg" 
    alt="Modoo Logo" 
    style={{ width: size, height: size }}
    className={`object-contain ${className}`}
  />
);
