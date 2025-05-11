
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { TeamSelector } from '@/components/Team/TeamSelector';
import { TeamContent } from '@/components/Team/TeamContent';
import { ErrorDisplay } from '@/components/Team/ErrorDisplay';
import { EmptyTeamState } from '@/components/Team/EmptyTeamState';
import { Layout } from '@/components/Layout/Layout';

export default function TeamManagement() {
  const {
    members,
    teams,
    selectedTeamId,
    isLoading,
    isCreatingTeam,
    error,
    setSelectedTeamId,
    handleCreateTeam,
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
  } = useTeamManagement();

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        
        <ErrorDisplay error={error} />
        
        {teams.length > 0 ? (
          <>
            <div className="max-w-xs">
              <TeamSelector 
                teams={teams}
                value={selectedTeamId}
                onChange={setSelectedTeamId}
                placeholder="Select a team to manage"
              />
            </div>
            
            <TeamContent
              selectedTeamId={selectedTeamId}
              members={members}
              teams={teams}
              isLoading={isLoading}
              isCreatingTeam={isCreatingTeam}
              onInviteMember={handleInviteMember}
              onChangeRole={handleChangeRole}
              onRemoveMember={handleRemoveMember}
              onResendInvite={handleResendInvite}
              onCreateTeam={handleCreateTeam}
            />
          </>
        ) : isLoading ? (
          <p>Loading teams...</p>
        ) : (
          <EmptyTeamState
            onCreateTeam={handleCreateTeam}
            isCreatingTeam={isCreatingTeam}
          />
        )}
      </div>
    </Layout>
  );
}
