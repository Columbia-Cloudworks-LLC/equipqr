
import { AppConfig } from '@/config/app';

export function AuthHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold">{AppConfig.name}</h1>
      </div>
      
      <div className="text-sm text-muted-foreground">{AppConfig.version}</div>
    </header>
  );
}
