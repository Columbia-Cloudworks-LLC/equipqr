
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Mail, Trash2, UserCheck, Shield, Crown } from 'lucide-react';
import { UserRole } from '@/types/supabase-enums';
import { TeamMember } from '@/types';
import { useState } from 'react';

interface UnifiedMember extends TeamMember {
  status: 'active' | 'pending';
  invitation_id?: string;
  invitation_email?: string;
  invitation_role?: string;
  is_org_manager?: boolean;
  org_role?: string;
}

interface TeamMemberCardProps {
  member: UnifiedMember;
  onRemoveMember: (userId: string) => void;
  onChangeRole: (userId: string, role: UserRole) => void;
  onResendInvite: (id: string) => Promise<void>;
  isCurrentUser: boolean;
  isLastManager: boolean;
  canChangeRoles: boolean;
  currentUserRole?: string;
}

export function TeamMemberCard({
  member,
  onRemoveMember,
  onChangeRole,
  onResendInvite,
  isCurrentUser,
  isLastManager,
  canChangeRoles,
  currentUserRole
}: TeamMemberCardProps) {
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleRemove = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      if (member.status === 'pending' && member.invitation_id) {
        await onRemoveMember(member.invitation_id);
      } else {
        await onRemoveMember(member.user_id);
      }
    } finally {
      setIsRemoving(false);
    }
  };

  const handleResendInvite = async () => {
    if (isResending || !member.invitation_id) return;
    setIsResending(true);
    try {
      await onResendInvite(member.invitation_id);
    } finally {
      setIsResending(false);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (isChangingRole || member.status === 'pending') return;
    setIsChangingRole(true);
    try {
      await onChangeRole(member.auth_uid, newRole);
    } finally {
      setIsChangingRole(false);
    }
  };

  const getStatusBadge = () => {
    if (member.status === 'pending') {
      return <Badge variant="secondary">Invitation Pending</Badge>;
    }
    
    if (member.is_org_manager) {
      if (member.org_role === 'owner') {
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <Crown className="w-3 h-3 mr-1" />
            Organization Owner
          </Badge>
        );
      }
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Shield className="w-3 h-3 mr-1" />
          Organization Manager
        </Badge>
      );
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      owner: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800', 
      technician: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={roleColors[role] || roleColors.viewer}>
        {role}
      </Badge>
    );
  };

  // Organization managers should not have their team roles changed
  const isOrgManager = member.is_org_manager && ['owner', 'manager'].includes(member.org_role || '');
  
  const canRemove = canChangeRoles && !isLastManager && 
    (member.status === 'pending' || (!isCurrentUser && !isOrgManager));

  const canChangeRole = canChangeRoles && member.status === 'active' && 
    !isLastManager && !isCurrentUser && !isOrgManager;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium truncate">
                {member.display_name || member.email?.split('@')[0] || 'Unknown'}
              </h3>
              {member.status === 'pending' && (
                <span className="text-xs text-muted-foreground">
                  (Invited)
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate mb-2">
              {member.email || member.invitation_email || 'N/A'}
            </p>
            {isOrgManager && (
              <p className="text-xs text-blue-600 font-medium mb-2">
                Manages via organization
              </p>
            )}
            <div className="flex items-center gap-2 mb-3">
              {getRoleBadge(member.role)}
              {getStatusBadge()}
            </div>
            
            {member.status === 'pending' && canChangeRoles && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendInvite}
                disabled={isResending}
                className="w-full mb-2"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isResending ? 'Sending...' : 'Resend Invitation'}
              </Button>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canChangeRole && (
                <>
                  <DropdownMenuItem 
                    onClick={() => handleRoleChange('manager' as UserRole)}
                    disabled={isChangingRole || member.role === 'manager'}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Make Manager
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleRoleChange('technician' as UserRole)}
                    disabled={isChangingRole || member.role === 'technician'}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Make Technician
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleRoleChange('viewer' as UserRole)}
                    disabled={isChangingRole || member.role === 'viewer'}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Make Viewer
                  </DropdownMenuItem>
                </>
              )}
              {isOrgManager && (
                <DropdownMenuItem disabled>
                  <Shield className="mr-2 h-4 w-4" />
                  Organization role cannot be changed here
                </DropdownMenuItem>
              )}
              {canRemove && (
                <DropdownMenuItem 
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {member.status === 'pending' ? 'Cancel Invitation' : 'Remove Member'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
