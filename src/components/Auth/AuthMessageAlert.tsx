
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Mail } from 'lucide-react';

interface AuthMessageAlertProps {
  message: string | undefined;
  isInvitation?: boolean;
}

export function AuthMessageAlert({ message, isInvitation }: AuthMessageAlertProps) {
  if (!message) return null;
  
  return (
    <Alert className="mb-4">
      {isInvitation ? (
        <Info className="h-4 w-4 mr-2" />
      ) : (
        <Mail className="h-4 w-4 mr-2" />
      )}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
