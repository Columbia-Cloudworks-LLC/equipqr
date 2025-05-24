
import { Check, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoSaveIndicatorProps {
  isAutoSaving: boolean;
  lastSaved?: Date | null;
  className?: string;
}

export function AutoSaveIndicator({ 
  isAutoSaving, 
  lastSaved, 
  className 
}: AutoSaveIndicatorProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isAutoSaving) {
    return (
      <div className={cn("flex items-center gap-1 text-sm text-blue-600", className)}>
        <Save className="h-3 w-3 animate-pulse" />
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className={cn("flex items-center gap-1 text-sm text-green-600", className)}>
        <Check className="h-3 w-3" />
        <span>Saved at {formatTime(lastSaved)}</span>
      </div>
    );
  }

  return null;
}
