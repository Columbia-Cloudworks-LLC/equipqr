

interface AuthLogoProps {
  className?: string;
}

export function AuthLogo({ className = "" }: AuthLogoProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <img
        src="/lovable-uploads/afa201e0-740c-45c5-af6e-4489ff30089d.png"
        alt="EquipQR Logo"
        className="h-12 w-auto sm:h-16 md:h-20 object-contain"
      />
    </div>
  );
}

