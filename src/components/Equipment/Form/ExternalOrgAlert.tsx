
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ExternalOrgAlert() {
  return (
    <Alert className="bg-blue-50 border-blue-200">
      <Info className="h-4 w-4" />
      <AlertDescription>
        You are creating equipment for an external organization where you have management access.
      </AlertDescription>
    </Alert>
  );
}
