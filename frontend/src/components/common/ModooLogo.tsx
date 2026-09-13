import React from 'react';

export const ModooLogo: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="50" fill="#43C1CB" />
    <path
      d="M 0 62 L 22 62 C 30 62 33 34 40 34 C 45 34 47 52 50 52 C 53 52 55 34 60 34 C 67 34 70 62 78 62 L 100 62"
      stroke="white"
      strokeWidth="8"
      strokeLinecap="butt"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);
