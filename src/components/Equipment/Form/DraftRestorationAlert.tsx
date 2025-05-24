
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

interface DraftRestorationAlertProps {
  onAccept: () => void;
  onReject: () => void;
  lastSaved?: Date;
}

export function DraftRestorationAlert({ 
  onAccept, 
  onReject, 
  lastSaved 
}: DraftRestorationAlertProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <Save className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-blue-800">
          Found unsaved draft from {lastSaved ? formatTime(lastSaved) : 'earlier'}. 
          Would you like to restore it?
        </span>
        <div className="flex gap-2 ml-4">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onAccept}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            Restore
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onReject}
            className="text-blue-600 hover:bg-blue-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
