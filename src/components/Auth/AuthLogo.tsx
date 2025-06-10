
import { useTheme } from '@/providers/ThemeProvider';

interface AuthLogoProps {
  className?: string;
}

export function AuthLogo({ className = "" }: AuthLogoProps) {
  const { theme } = useTheme();
  
  // Determine if we should use dark mode image
  const isDarkMode = theme === 'dark' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
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
