
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface MembershipAlertProps {
  teamName: string;
  role: string | null;
}

export function MembershipAlert({ teamName, role }: MembershipAlertProps) {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        You are not a direct member of "{teamName}". 
        {role && role !== 'viewer' && (
          <span> However, as an organization {role}, you can view and manage this team.</span>
        )}
        {(!role || role === 'viewer') && (
          <span> You may have organization-level access or need to be invited to this team.</span>
        )}
      </AlertDescription>
    </Alert>
  );
}
