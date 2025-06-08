
interface AuthLogoProps {
  className?: string;
}

export function AuthLogo({ className = "" }: AuthLogoProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <img
        src="https://oxeheowbfsshpyldlskb.supabase.co/storage/v1/object/public/equipqr-images/app/EquipQR%20Logo%20(ChatGPT).png"
        alt="EquipQR Logo"
        className="h-12 w-auto sm:h-16 md:h-20 object-contain"
      />
    </div>
  );
}
