
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
import { 
  getTeams, 
  getTeamMembers, 
  inviteMember, 
  changeRole, 
  removeMember, 
  resendInvite, 
  createTeam 
} from '@/services/teamService';

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teams, setTeams] = useState<{id: string; name: string}[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

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
      const fetchedTeams = await getTeams();
      setTeams(fetchedTeams.map(team => ({ id: team.id, name: team.name })));
      
      // Set the first team as selected if available
      if (fetchedTeams.length > 0 && !selectedTeamId) {
        setSelectedTeamId(fetchedTeams[0].id);
      }
    } catch (error: any) {
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
      const data = await getTeamMembers(teamId);
      setMembers(data);
    } catch (error: any) {
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
      await createTeam(name);
      toast.success("Team created successfully", {
        description: `Team "${name}" has been created`,
      });
      await fetchTeams();
    } catch (error: any) {
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
      await inviteMember(email, role, teamId);
      toast.success("Invitation sent", {
        description: `Invitation email sent to ${email}`,
      });
      if (teamId === selectedTeamId) {
        fetchTeamMembers(selectedTeamId);
      }
    } catch (error: any) {
      toast.error("Error sending invitation", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRole = async (id: string, role: UserRole, teamId: string) => {
    try {
      await changeRole(id, role, teamId);
      toast.success("Role updated", {
        description: "Team member role updated successfully",
      });
      if (teamId === selectedTeamId) {
        fetchTeamMembers(selectedTeamId);
      }
    } catch (error: any) {
      toast.error("Error updating role", {
        description: error.message,
      });
    }
  };

  const handleRemoveMember = async (id: string, teamId: string) => {
    try {
      await removeMember(id, teamId);
      toast.success("Member removed", {
        description: "Team member removed successfully",
      });
      if (teamId === selectedTeamId) {
        fetchTeamMembers(selectedTeamId);
      }
    } catch (error: any) {
      toast.error("Error removing member", {
        description: error.message,
      });
    }
  };

  const handleResendInvite = async (id: string) => {
    try {
      await resendInvite(id);
      toast.success("Invitation resent", {
        description: "Invitation email has been resent",
      });
    } catch (error: any) {
      toast.error("Error resending invitation", {
        description: error.message,
      });
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        
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
