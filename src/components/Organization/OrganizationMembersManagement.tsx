import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { OrganizationMember } from '@/services/organization/types';
import { getOrganizationMembers, updateMemberRole } from '@/services/organization';
import { UserRole } from '@/types/supabase-enums';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import OrganizationInvitation from './OrganizationInvitation';
import PendingOrganizationInvitations from './PendingOrganizationInvitations';

interface OrganizationMembersManagementProps {
  organizationId: string;
  userRole?: UserRole;
}

const OrganizationMembersManagement: React.FC<OrganizationMembersManagementProps> = ({ 
  organizationId, 
  userRole = 'viewer' 
}) => {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<Record<string, boolean>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('members');

  const isOwner = userRole === 'owner';

  // Fetch organization members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!organizationId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const membersData = await getOrganizationMembers(organizationId);
        setMembers(membersData);
      } catch (error: any) {
        console.error('Error fetching organization members:', error);
        setError('Failed to load organization members. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [organizationId, refreshTrigger]);

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    setUpdatingRole(prev => ({ ...prev, [memberId]: true }));
    try {
      const success = await updateMemberRole(memberId, newRole);
      
      if (success) {
        toast.success("Role Updated", {
          description: "The member's role has been updated successfully"
        });
        
        // Update local state for immediate UI update
        setMembers(prev => 
          prev.map(member => 
            member.id === memberId ? { ...member, role: newRole } : member
          )
        );
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error("Update Failed", {
        description: error.message || "Failed to update the member's role"
      });
    } finally {
      setUpdatingRole(prev => ({ ...prev, [memberId]: false }));
    }
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleInviteSent = () => {
    setActiveTab('invitations');
    refreshData();
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Organization Members</CardTitle>
            <Button variant="ghost" size="sm" onClick={refreshData}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-md">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Organization Members</CardTitle>
          <Button variant="ghost" size="sm" onClick={refreshData}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
        <CardDescription>
          Manage members and send invitations to your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="invite" disabled={!isOwner}>Invite</TabsTrigger>
          </TabsList>
          
          <TabsContent value="members">
            {loading ? (
              <div className="text-center py-8">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No members found in this organization.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Role</th>
                      {isOwner && <th className="text-left py-3 px-4">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => (
                      <tr key={member.id} className="border-b last:border-0">
                        <td className="py-3 px-4">{member.name || 'No name'}</td>
                        <td className="py-3 px-4">{member.email}</td>
                        <td className="py-3 px-4 capitalize">{member.role}</td>
                        {isOwner && (
                          <td className="py-3 px-4">
                            <Select
                              value={member.role}
                              onValueChange={(value) => handleRoleChange(member.id, value as UserRole)}
                              disabled={updatingRole[member.id]}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Change role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="technician">Technician</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="invitations">
            <PendingOrganizationInvitations 
              organizationId={organizationId} 
              refreshTrigger={refreshTrigger}
            />
          </TabsContent>
          
          <TabsContent value="invite">
            <OrganizationInvitation 
              organizationId={organizationId}
              onInviteSent={handleInviteSent}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OrganizationMembersManagement;
