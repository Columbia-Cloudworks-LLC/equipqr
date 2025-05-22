
import React, { useState } from 'react';
import { OrganizationMember } from '@/services/organization/types';
import { UserRole } from '@/types/supabase-enums';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { updateMemberRole } from '@/services/organization/membersService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface OrganizationMembersTableProps {
  members: OrganizationMember[];
  isOwner: boolean;
  loading: boolean;
  refreshTrigger?: number;
  setRefreshTrigger?: (trigger: number) => void;
}

export function OrganizationMembersTable({
  members, 
  isOwner, 
  loading, 
  refreshTrigger = 0,
  setRefreshTrigger
}: OrganizationMembersTableProps) {
  const [updatingRole, setUpdatingRole] = useState<Record<string, boolean>>({});

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    setUpdatingRole(prev => ({ ...prev, [memberId]: true }));
    
    try {
      const success = await updateMemberRole(memberId, newRole);
      
      if (success) {
        toast.success('Role updated', {
          description: 'Member role has been updated successfully'
        });
        // Trigger a refresh of the members list if the prop exists
        if (setRefreshTrigger) {
          setRefreshTrigger(refreshTrigger + 1);
        }
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error('Error', {
        description: error.message || 'Failed to update member role'
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            {isOwner && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map(member => (
            <TableRow key={member.id}>
              <TableCell>{member.name || 'No name'}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell className="capitalize">{member.role}</TableCell>
              {isOwner && (
                <TableCell>
                  {member.role === 'owner' ? (
                    <span className="text-muted-foreground">Cannot modify owner</span>
                  ) : (
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleRoleChange(member.id, value as UserRole)}
                      disabled={updatingRole[member.id]}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Change role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default OrganizationMembersTable;
