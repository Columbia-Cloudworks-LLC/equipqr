
import { Loader2 } from 'lucide-react';

export function AuthCheckingState() {
  return (
    <div className="flex-1 p-6">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-2xl font-bold">Checking authentication...</h1>
      </div>
    </div>
  );
}
