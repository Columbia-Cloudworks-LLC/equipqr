
import { useState, useEffect } from 'react';
import { TeamList } from '@/components/Team/TeamList';
import { InviteForm } from '@/components/Team/InviteForm';
import { Layout } from '@/components/Layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import { getTeamMembers, inviteMember, changeRole, removeMember, resendInvite } from '@/services/teamService';

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      const data = await getTeamMembers();
      setMembers(data);
    } catch (error: any) {
      toast({
        title: "Error fetching team members",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async (email: string, role: string) => {
    try {
      await inviteMember(email, role);
      toast({
        title: "Invitation sent",
        description: `Invitation email sent to ${email}`,
      });
      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: "Error sending invitation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleChangeRole = async (id: string, role: UserRole) => {
    try {
      await changeRole(id, role);
      toast({
        title: "Role updated",
        description: "Team member role updated successfully",
      });
      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (id: string) => {
    try {
      await removeMember(id);
      toast({
        title: "Member removed",
        description: "Team member removed successfully",
      });
      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleResendInvite = async (id: string) => {
    try {
      await resendInvite(id);
      toast({
        title: "Invitation resent",
        description: "Invitation email has been resent",
      });
    } catch (error: any) {
      toast({
        title: "Error resending invitation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        
        <Tabs defaultValue="members" className="w-full">
          <TabsList>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="invite">Invite People</TabsTrigger>
          </TabsList>
          
          <TabsContent value="members" className="mt-6">
            <TeamList
              members={members}
              onRemoveMember={handleRemoveMember}
              onChangeRole={handleChangeRole}
              onResendInvite={handleResendInvite}
            />
          </TabsContent>
          
          <TabsContent value="invite" className="mt-6 max-w-md">
            <InviteForm onInvite={handleInviteMember} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
