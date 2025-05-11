
import { useState, useEffect } from 'react';
import { TeamList } from '@/components/Team/TeamList';
import { InviteForm } from '@/components/Team/InviteForm';
import { TeamCreationForm } from '@/components/Team/TeamCreationForm';
import { TeamSelector } from '@/components/Team/TeamSelector';
import { Layout } from '@/components/Layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { 
  getTeams, 
  getTeamMembers,
  getOrganizationMembers,
  inviteMember, 
  changeRole, 
  removeMember, 
  resendInvite, 
  createTeam 
} from '@/services/team';

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teams, setTeams] = useState<{id: string; name: string}[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamMembers(selectedTeamId);
    } else {
      setMembers([]);
    }
  }, [selectedTeamId]);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedTeams = await getTeams();
      
      console.log('Fetched teams:', fetchedTeams);
      
      if (!fetchedTeams || fetchedTeams.length === 0) {
        console.log('No teams found');
        setTeams([]);
        return;
      }
      
      setTeams(fetchedTeams.map(team => ({ id: team.id, name: team.name })));
      
      // Set the first team as selected if available
      if (fetchedTeams.length > 0 && !selectedTeamId) {
        console.log('Setting selected team to:', fetchedTeams[0].id);
        setSelectedTeamId(fetchedTeams[0].id);
      }
    } catch (error: any) {
      console.error('Error in fetchTeams:', error);
      setError('Failed to load your teams. Please try again.');
      toast.error("Error fetching teams", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`Fetching members for team ${teamId}`);
      const data = await getTeamMembers(teamId);
      console.log('Fetched team members:', data);
      setMembers(data || []);
    } catch (error: any) {
      console.error('Error in fetchTeamMembers:', error);
      setError('Failed to load team members. Please try again.');
      toast.error("Error fetching team members", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async (name: string) => {
    try {
      setIsCreatingTeam(true);
      setError(null);
      await createTeam(name);
      toast.success("Team created successfully", {
        description: `Team "${name}" has been created`,
      });
      await fetchTeams();
    } catch (error: any) {
      console.error('Error in handleCreateTeam:', error);
      setError('Failed to create team. Please try again.');
      toast.error("Error creating team", {
        description: error.message,
      });
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleInviteMember = async (email: string, role: UserRole, teamId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await inviteMember(email, role, teamId);
      toast.success("Invitation sent", {
        description: `Invitation email sent to ${email}`,
      });
      if (teamId === selectedTeamId) {
        fetchTeamMembers(selectedTeamId);
      }
    } catch (error: any) {
      console.error('Error in handleInviteMember:', error);
      setError('Failed to send invitation. Please try again.');
      toast.error("Error sending invitation", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRole = async (id: string, role: UserRole, teamId: string) => {
    try {
      setError(null);
      await changeRole(id, role, teamId);
      toast.success("Role updated", {
        description: "Team member role updated successfully",
      });
      if (teamId === selectedTeamId) {
        fetchTeamMembers(selectedTeamId);
      }
    } catch (error: any) {
      console.error('Error in handleChangeRole:', error);
      setError('Failed to update role. Please try again.');
      toast.error("Error updating role", {
        description: error.message,
      });
    }
  };

  const handleRemoveMember = async (id: string, teamId: string) => {
    try {
      setError(null);
      await removeMember(id, teamId);
      toast.success("Member removed", {
        description: "Team member removed successfully",
      });
      if (teamId === selectedTeamId) {
        fetchTeamMembers(selectedTeamId);
      }
    } catch (error: any) {
      console.error('Error in handleRemoveMember:', error);
      setError('Failed to remove team member. Please try again.');
      toast.error("Error removing member", {
        description: error.message,
      });
    }
  };

  const handleResendInvite = async (id: string) => {
    try {
      setError(null);
      await resendInvite(id);
      toast.success("Invitation resent", {
        description: "Invitation email has been resent",
      });
    } catch (error: any) {
      console.error('Error in handleResendInvite:', error);
      setError('Failed to resend invitation. Please try again.');
      toast.error("Error resending invitation", {
        description: error.message,
      });
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
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
            
            <Tabs defaultValue="members" className="w-full">
              <TabsList>
                <TabsTrigger value="members">Team Members</TabsTrigger>
                <TabsTrigger value="invite">Invite People</TabsTrigger>
                <TabsTrigger value="create">Create Team</TabsTrigger>
              </TabsList>
              
              <TabsContent value="members" className="mt-6">
                {selectedTeamId ? (
                  <TeamList
                    members={members}
                    onRemoveMember={handleRemoveMember}
                    onChangeRole={handleChangeRole}
                    onResendInvite={handleResendInvite}
                    teamId={selectedTeamId}
                  />
                ) : (
                  <p>Select a team to view members</p>
                )}
              </TabsContent>
              
              <TabsContent value="invite" className="mt-6 max-w-md">
                <InviteForm 
                  onInvite={handleInviteMember} 
                  isLoading={isLoading}
                  teams={teams}
                />
              </TabsContent>
              
              <TabsContent value="create" className="mt-6 max-w-md">
                <TeamCreationForm 
                  onCreateTeam={handleCreateTeam}
                  isLoading={isCreatingTeam}
                />
              </TabsContent>
            </Tabs>
          </>
        ) : isLoading ? (
          <p>Loading teams...</p>
        ) : (
          <div className="max-w-md">
            <p className="mb-6">Start by creating your first team:</p>
            <TeamCreationForm 
              onCreateTeam={handleCreateTeam}
              isLoading={isCreatingTeam}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
