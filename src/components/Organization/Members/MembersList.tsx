
import React, { useState } from 'react';
import { OrganizationMember } from '@/services/organization/types';
import { UserRole } from '@/types/supabase-enums';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { updateMemberRole } from '@/services/organization/membersService';

interface MembersListProps {
  members: OrganizationMember[];
  isOwner: boolean;
  loading: boolean;
}

const MembersList: React.FC<MembersListProps> = ({ members, isOwner, loading }) => {
  const [updatingRole, setUpdatingRole] = useState<Record<string, boolean>>({});

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    setUpdatingRole(prev => ({ ...prev, [memberId]: true }));
    try {
      const success = await updateMemberRole(memberId, newRole);
      
      if (success) {
        toast.success("Role Updated", {
          description: "The member's role has been updated successfully"
        });
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

  if (loading) {
    return <div className="text-center py-8">Loading members...</div>;
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No members found in this organization.
      </div>
    );
  }

  return (
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
  );
};

export default MembersList;
