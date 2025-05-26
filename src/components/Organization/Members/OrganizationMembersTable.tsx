import React, { useState } from 'react';
import { OrganizationMember } from '@/services/organization/types';
import { UserRole } from '@/types/supabase-enums';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateMemberRole, removeMember } from '@/services/organization/membersService';
import { RoleInfoTooltip } from '@/components/ui/RoleInfoTooltip';
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
  organizationId: string;
  refreshTrigger?: number;
  setRefreshTrigger?: (trigger: number) => void;
  onMemberRoleUpdate?: (memberId: string, newRole: string) => void;
  onRefreshMembers?: () => Promise<void>;
}

export function OrganizationMembersTable({
  members, 
  isOwner, 
  loading, 
  organizationId,
  refreshTrigger = 0,
  setRefreshTrigger,
  onMemberRoleUpdate,
  onRefreshMembers
}: OrganizationMembersTableProps) {
  const [updatingRole, setUpdatingRole] = useState<Record<string, boolean>>({});
  const [removingMember, setRemovingMember] = useState<Record<string, boolean>>({});

  async function handleRoleChange(memberId: string, newRole: UserRole) {
    setUpdatingRole(prev => ({ ...prev, [memberId]: true }));
    
    // Optimistically update the UI immediately
    if (onMemberRoleUpdate) {
      onMemberRoleUpdate(memberId, newRole);
    }
    
    try {
      const success = await updateMemberRole(memberId, newRole);
      
      if (success) {
        toast.success('Role updated', {
          description: 'Member role has been updated successfully'
        });
        
        // Refresh the data from server to ensure consistency
        if (onRefreshMembers) {
          await onRefreshMembers();
        } else if (setRefreshTrigger) {
          setRefreshTrigger(refreshTrigger + 1);
        }
      } else {
        // If update failed, refresh to revert optimistic update
        if (onRefreshMembers) {
          await onRefreshMembers();
        }
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error('Error', {
        description: error.message || 'Failed to update member role'
      });
      
      // Refresh data to revert optimistic update on error
      if (onRefreshMembers) {
        await onRefreshMembers();
      }
    } finally {
      setUpdatingRole(prev => ({ ...prev, [memberId]: false }));
    }
  }

  async function handleRemoveMember(userId: string) {
    setRemovingMember(prev => ({ ...prev, [userId]: true }));
    
    try {
      const success = await removeMember(organizationId, userId);
      
      if (success) {
        // Refresh the data from server
        if (onRefreshMembers) {
          await onRefreshMembers();
        } else if (setRefreshTrigger) {
          setRefreshTrigger(refreshTrigger + 1);
        }
      }
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error('Error', {
        description: error.message || 'Failed to remove member'
      });
    } finally {
      setRemovingMember(prev => ({ ...prev, [userId]: false }));
    }
  }

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
            <TableHead>
              <div className="flex items-center gap-2">
                Role
                <RoleInfoTooltip type="organization" />
              </div>
            </TableHead>
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
                  <div className="flex items-center gap-2">
                    {member.role === 'owner' ? (
                      <span className="text-muted-foreground">Cannot modify owner</span>
                    ) : (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleRoleChange(member.id, value as UserRole)}
                          disabled={updatingRole[member.id] || removingMember[member.id]}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Change role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updatingRole[member.id] || removingMember[member.id]}
                              className="text-destructive hover:text-destructive"
                            >
                              {removingMember[member.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Organization Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {member.name || member.email} from this organization? 
                                This will also remove them from all teams within the organization. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveMember(member.user_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove Member
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
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
