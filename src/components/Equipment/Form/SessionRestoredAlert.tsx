
import { Info } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export function SessionRestoredAlert() {
  return (
    <Alert className="mb-6 bg-blue-50 border-blue-200">
      <Info className="h-4 w-4" />
      <AlertTitle>Session Restored</AlertTitle>
      <AlertDescription>
        Your session has been restored. You can now continue with your task.
      </AlertDescription>
    </Alert>
  );
}
