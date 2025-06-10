
import { useState, useEffect } from 'react';
import { useTheme } from '@/providers/ThemeProvider';

interface AuthLogoProps {
  className?: string;
}

export function AuthLogo({ className = "" }: AuthLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();
  
  // Determine the effective theme (resolve "system" to actual theme)
  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme as 'light' | 'dark';
  };
  
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(getEffectiveTheme());
  
  // Listen for theme changes and system preference changes
  useEffect(() => {
    const updateEffectiveTheme = () => {
      const newTheme = getEffectiveTheme();
      if (newTheme !== effectiveTheme) {
        setEffectiveTheme(newTheme);
        setImageError(false); // Reset error state when theme changes
        setIsLoading(true); // Reset loading state when theme changes
      }
    };
    
    // Update immediately
    updateEffectiveTheme();
    
    // Listen for system theme changes if using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateEffectiveTheme);
      
      return () => {
        mediaQuery.removeEventListener('change', updateEffectiveTheme);
      };
    }
  }, [theme, effectiveTheme]);
  
  const logoSrc = effectiveTheme === 'dark' 
    ? "https://oxeheowbfsshpyldlskb.supabase.co/storage/v1/object/public/equipqr-images/app/EquipQR-Dark-SQ.png"
    : "https://oxeheowbfsshpyldlskb.supabase.co/storage/v1/object/public/equipqr-images/app/EquipQR-Light-SQ.png";

  const handleImageError = () => {
    console.error('Failed to load logo image:', logoSrc);
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    console.log('Logo loaded successfully:', logoSrc);
    setImageError(false);
    setIsLoading(false);
  };

  return (
    <div className={`flex justify-center relative ${className}`}>
      {/* Loading placeholder - shown while loading or on error */}
      <div 
        className={`h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 bg-${imageError ? 'primary' : 'muted'} rounded-lg flex items-center justify-center ${isLoading && !imageError ? 'animate-pulse' : ''} transition-opacity duration-300 ${!isLoading && !imageError ? 'opacity-0 absolute' : 'opacity-100'}`}
      >
        <span className={`${imageError ? 'text-primary-foreground' : 'text-muted-foreground'} font-bold text-xl sm:text-2xl md:text-3xl`}>
          EQ
        </span>
      </div>
      
      {/* Actual logo image - always rendered so handlers can fire */}
      <img
        src={logoSrc}
        alt="EquipQR Logo"
        className={`h-16 w-auto sm:h-20 md:h-24 object-contain transition-opacity duration-300 ${isLoading || imageError ? 'opacity-0' : 'opacity-100'}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
}
