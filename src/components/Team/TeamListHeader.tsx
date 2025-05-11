
import { AlertTriangle } from 'lucide-react';

interface TeamListHeaderProps {
  isViewOnly: boolean;
}

export function TeamListHeader({ isViewOnly }: TeamListHeaderProps) {
  if (!isViewOnly) return null;
  
  return (
    <div className="bg-amber-50 p-4 border-b flex items-center gap-2 text-amber-800">
      <AlertTriangle className="h-4 w-4" />
      <span className="text-sm">You are in view-only mode. You need a manager role to make changes.</span>
    </div>
  );
}
