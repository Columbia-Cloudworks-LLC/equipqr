
import { useTheme } from '@/providers/ThemeProvider';
import { useState, useEffect } from 'react';

interface AuthLogoProps {
  className?: string;
}

export function AuthLogo({ className = "" }: AuthLogoProps) {
  const { theme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const checkDarkMode = () => {
      if (theme === 'dark') {
        setIsDarkMode(true);
      } else if (theme === 'light') {
        setIsDarkMode(false);
      } else {
        // System theme
        setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    };

    checkDarkMode();

    // Listen for system theme changes when using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => checkDarkMode();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);
  
  const logoSrc = isDarkMode 
    ? "https://oxeheowbfsshpyldlskb.supabase.co/storage/v1/object/public/equipqr-images/app/EquipQR%20Logo%20Dark%20(ChatGPT).png"
    : "https://oxeheowbfsshpyldlskb.supabase.co/storage/v1/object/public/equipqr-images/app/EquipQR%20Logo%20(ChatGPT).png";

  return (
    <div className={`flex justify-center ${className}`}>
      <img
        src={logoSrc}
        alt="EquipQR Logo"
        className="h-12 w-auto sm:h-16 md:h-20 object-contain"
      />
    </div>
  );
}
