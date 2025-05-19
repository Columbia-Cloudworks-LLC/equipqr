
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { UserRole } from '@/types/supabase-enums';
import { 
  MoreHorizontal, 
  UserX, 
  Shield, 
  Mail,
  User,
  UserCog
} from 'lucide-react';
import { TeamMember } from '@/types';
import { Badge } from '@/components/ui/badge';

interface TeamMemberRowProps {
  member: TeamMember;
  onRemoveMember: (id: string, teamId: string) => void;
  onChangeRole: (id: string, role: UserRole, teamId: string) => void;
  onResendInvite: (id: string) => void;
  teamId: string;
  isViewOnly?: boolean;
  changingRoleFor: string | null;
  removingMember: string | null;
  resendingInvite: string | null;
  setChangingRoleFor: (id: string | null) => void;
  setRemovingMember: (id: string | null) => void;
  setResendingInvite: (id: string | null) => void;
  currentUserRole?: string;
}

export function TeamMemberRow({ 
  member, 
  onRemoveMember, 
  onChangeRole, 
  onResendInvite,
  teamId,
  isViewOnly = false,
  changingRoleFor,
  removingMember,
  resendingInvite,
  setChangingRoleFor,
  setRemovingMember,
  setResendingInvite,
  currentUserRole
}: TeamMemberRowProps) {
  const isCurrentUserManager = currentUserRole === 'manager' || currentUserRole === 'owner';
  const isChangeInProgress = changingRoleFor === member.id;
  const isRemoveInProgress = removingMember === member.id;
  const isResendInProgress = resendingInvite === member.id;
  
  // Disable removing the last manager
  const isLastManager = member.role === 'manager' && 
                       currentUserRole === 'manager' &&
                       member.auth_uid === localStorage.getItem('current_user_auth_id');
  
  // Format member name, showing "You" indicator for current user
  const isCurrentUser = member.auth_uid === localStorage.getItem('current_user_auth_id');
  const memberName = member.name || 'Unknown';
  
  const handleChangeRole = async (role: UserRole) => {
    try {
      setChangingRoleFor(member.id);
      await onChangeRole(member.id, role, teamId);
      toast.success(`Role changed to ${role}`);
    } catch (error: any) {
      toast.error('Failed to change role', {
        description: error.message
      });
    } finally {
      setChangingRoleFor(null);
    }
  };
  
  const handleRemoveMember = async () => {
    try {
      setRemovingMember(member.id);
      await onRemoveMember(member.id, teamId);
      toast.success('Member removed from team');
    } catch (error: any) {
      toast.error('Failed to remove member', {
        description: error.message
      });
    } finally {
      setRemovingMember(null);
    }
  };
  
  const handleResendInvite = async () => {
    try {
      setResendingInvite(member.id);
      await onResendInvite(member.id);
      toast.success('Invitation resent');
    } catch (error: any) {
      toast.error('Failed to resend invitation', {
        description: error.message
      });
    } finally {
      setResendingInvite(null);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-1">
          {memberName}
          {isCurrentUser && (
            <Badge variant="outline" size="sm" className="ml-1 text-xs">
              You
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>{member.email}</TableCell>
      <TableCell>
        <Badge variant={member.role === 'manager' ? 'default' : 'outline'}>
          {member.role}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
          Active
        </Badge>
      </TableCell>
      <TableCell>
        {!isViewOnly ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isCurrentUserManager && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isChangeInProgress} className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {isChangeInProgress ? 'Changing role...' : 'Change Role'}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={member.role} onValueChange={(value: any) => handleChangeRole(value)}>
                      <DropdownMenuRadioItem value="manager" className="flex items-center gap-2">
                        <UserCog className="h-4 w-4" />
                        Manager
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="technician" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Technician
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="viewer" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Viewer
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              
              {isCurrentUserManager && member.status === 'pending' && (
                <DropdownMenuItem 
                  onClick={handleResendInvite}
                  disabled={isResendInProgress}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {isResendInProgress ? 'Sending...' : 'Resend Invitation'}
                </DropdownMenuItem>
              )}
              
              {isCurrentUserManager && !isLastManager && (
                <DropdownMenuItem 
                  onClick={handleRemoveMember}
                  disabled={isRemoveInProgress || isLastManager}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <UserX className="h-4 w-4" />
                  {isRemoveInProgress ? 'Removing...' : 'Remove Member'}
                </DropdownMenuItem>
              )}
              
              {isLastManager && (
                <DropdownMenuItem disabled className="text-gray-400 opacity-50 flex items-center gap-2">
                  <UserX className="h-4 w-4" />
                  Cannot remove last manager
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="text-gray-400 text-sm italic">No actions available</span>
        )}
      </TableCell>
    </TableRow>
  );
}
