
import { TeamCreationForm } from '@/components/Team/TeamCreationForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface EmptyTeamStateProps {
  onCreateTeam: (name: string) => void;
  isCreatingTeam: boolean;
  userRole?: string;
  organizationName?: string;
}

export function EmptyTeamState({ 
  onCreateTeam, 
  isCreatingTeam, 
  userRole,
  organizationName
}: EmptyTeamStateProps) {
  // Determine if user can create teams based on role
  const canCreateTeam = userRole === 'owner' || userRole === 'manager' || userRole === 'admin';
  
  return (
    <div className="max-w-md">
      {canCreateTeam ? (
        <>
          <p className="mb-6">Start by creating your first team{organizationName ? ` in ${organizationName}` : ''}:</p>
          <TeamCreationForm 
            onCreateTeam={onCreateTeam}
            isLoading={isCreatingTeam}
          />
        </>
      ) : (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertDescription className="mt-2">
            There are no teams available in {organizationName || 'this organization'}. 
            Only managers and owners can create teams.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
