
import { useState } from 'react';

interface AuthLogoProps {
  className?: string;
}

export function AuthLogo({ className = "" }: AuthLogoProps) {
  const [imageError, setImageError] = useState(false);
  
  // Simple function to get current theme from DOM
  const getCurrentTheme = (): boolean => {
    return document.documentElement.classList.contains('dark');
  };
  
  const isDarkMode = getCurrentTheme();
  
  const logoSrc = isDarkMode 
    ? "https://oxeheowbfsshpyldlskb.supabase.co/storage/v1/object/public/equipqr-images/app/EquipQR-Dark-SQ.png"
    : "https://oxeheowbfsshpyldlskb.supabase.co/storage/v1/object/public/equipqr-images/app/EquipQR-Light-SQ.png";

  const handleImageError = () => {
    console.error('Failed to load logo image:', logoSrc);
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  if (imageError) {
    return (
      <div className={`flex justify-center ${className}`}>
        <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xl sm:text-2xl md:text-3xl">EQ</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <img
        src={logoSrc}
        alt="EquipQR Logo"
        className="h-16 w-auto sm:h-20 md:h-24 object-contain"
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
}
