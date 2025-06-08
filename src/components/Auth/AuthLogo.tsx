
interface AuthLogoProps {
  className?: string;
}

export function AuthLogo({ className = "" }: AuthLogoProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <img
        src="/lovable-uploads/a832d1f2-91a6-4141-b705-13e272c4b6c3.png"
        alt="EquipQR Logo"
        className="h-12 w-auto sm:h-16 md:h-20 object-contain"
      />
    </div>
  );
}
