
import React from 'react';
import { useTheme } from 'next-themes';

interface IconProps {
  variant?: 'default' | 'white' | 'black' | 'grayscale';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Icon: React.FC<IconProps> = ({ 
  variant = 'default', 
  size = 'md', 
  className = '' 
}) => {
  const { theme, systemTheme } = useTheme();
  
  // Determine the current theme
  const currentTheme = theme === 'system' ? systemTheme : theme;
  
  // Select icon variant based on theme if variant is 'default'
  const getIconVariant = () => {
    if (variant !== 'default') return variant;
    return currentTheme === 'dark' ? 'white' : 'black';
  };
  
  const iconVariant = getIconVariant();
  
  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };
  
  return (
    <img
      src={`/eqr-icons/${iconVariant}.png`}
      alt="EquipQR"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default Icon;
