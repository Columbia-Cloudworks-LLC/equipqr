
import { TeamCreationForm } from '@/components/Team/TeamCreationForm';

interface EmptyTeamStateProps {
  onCreateTeam: (name: string) => void;
  isCreatingTeam: boolean;
}

export function EmptyTeamState({ onCreateTeam, isCreatingTeam }: EmptyTeamStateProps) {
  return (
    <div className="max-w-md">
      <p className="mb-6">Start by creating your first team:</p>
      <TeamCreationForm 
        onCreateTeam={onCreateTeam}
        isLoading={isCreatingTeam}
      />
    </div>
  );
}
