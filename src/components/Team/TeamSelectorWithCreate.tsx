
import { TeamSelector } from "./TeamSelector";
import { CreateTeamButton } from "./CreateTeamButton";
import { Team } from '@/services/team';

interface TeamSelectorWithCreateProps {
  teams: Team[];
  selectedTeamId: string;
  onSelectTeam: (teamId: string) => void;
  onCreateTeam: (name: string) => Promise<any>;
  isCreatingTeam: boolean;
  isChangingOrg: boolean;
  showCreateButton: boolean;
}

export function TeamSelectorWithCreate({
  teams,
  selectedTeamId,
  onSelectTeam,
  onCreateTeam,
  isCreatingTeam,
  isChangingOrg,
  showCreateButton
}: TeamSelectorWithCreateProps) {
  return (
    <div className="flex items-center">
      <div className="max-w-xs flex-1">
        <TeamSelector 
          teams={teams}
          value={selectedTeamId}
          onChange={onSelectTeam}
          placeholder="Select a team to manage"
          hideNoTeamOption={true}
          disabled={isChangingOrg}
        />
      </div>
      
      {showCreateButton && (
        <CreateTeamButton 
          onCreateTeam={onCreateTeam}
          isCreating={isCreatingTeam}
          disabled={isChangingOrg}
        />
      )}
    </div>
  );
}
