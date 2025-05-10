
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamMember } from '@/types';
import { TeamList } from '@/components/Team/TeamList';
import { InviteForm } from '@/components/Team/InviteForm';
import { toast } from 'sonner';
import { MOCK_TEAM_MEMBERS } from '@/data/mockData';
import { Layout } from '@/components/Layout/Layout';

const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // In a real app, we would fetch data from an API
    setTeamMembers(MOCK_TEAM_MEMBERS);
  }, []);

  const handleInvite = (email: string, role: string) => {
    setIsLoading(true);
    
    // Check if member already exists
    if (teamMembers.some((member) => member.email === email)) {
      toast.error('This email address is already a team member');
      setIsLoading(false);
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      const newMember: TeamMember = {
        id: `member-${Date.now()}`,
        team_id: 'team-1',
        user_id: `user-${Date.now()}`,
        joined_at: new Date().toISOString(),
        name: email.split('@')[0], // Use first part of email as name temporarily
        email,
        role: role,
        status: 'Pending',
      };
      
      setTeamMembers([newMember, ...teamMembers]);
      toast.success('Invitation sent successfully');
      setIsLoading(false);
    }, 1000);
  };

  const handleRemoveMember = (id: string) => {
    // In a real app, we would call an API to remove the member
    const updatedMembers = teamMembers.filter((member) => member.id !== id);
    setTeamMembers(updatedMembers);
    toast.success('Team member removed');
  };

  const handleChangeRole = (id: string, role: string) => {
    // In a real app, we would call an API to change the role
    const updatedMembers = teamMembers.map((member) => {
      if (member.id === id) {
        return { ...member, role: role };
      }
      return member;
    });
    
    setTeamMembers(updatedMembers);
    toast.success('Role updated successfully');
  };

  const handleResendInvite = (id: string) => {
    // In a real app, we would call an API to resend the invitation
    toast.success('Invitation resent successfully');
  };

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage your team members and their access permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeamList
                  members={teamMembers}
                  onRemoveMember={handleRemoveMember}
                  onChangeRole={handleChangeRole}
                  onResendInvite={handleResendInvite}
                />
              </CardContent>
            </Card>
          </div>
          
          <div>
            <InviteForm onInvite={handleInvite} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TeamManagement;
