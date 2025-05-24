
import { useState } from 'react';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreVertical, Mail, Shield, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface TeamMemberCardProps {
  member: TeamMember;
  onRemoveMember: (userId: string) => void;
  onChangeRole: (userId: string, role: UserRole) => void;
  onResendInvite: (id: string) => Promise<void>;
  isCurrentUser?: boolean;
  isLastManager?: boolean;
  canChangeRoles?: boolean;
  currentUserRole?: string;
}

export function TeamMemberCard({
  member,
  onRemoveMember,
  onChangeRole,
  onResendInvite,
  isCurrentUser = false,
  isLastManager = false,
  canChangeRoles = false,
  currentUserRole
}: TeamMemberCardProps) {
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleRoleChange = async (newRole: UserRole) => {
    setIsChangingRole(true);
    try {
      await onChangeRole(member.user_id || member.id, newRole);
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleResendInvite = async () => {
    setIsResending(true);
    try {
      await onResendInvite(member.id);
    } finally {
      setIsResending(false);
    }
  };

  // Helper function to get a display name with proper fallback
  const getDisplayName = () => {
    // Priority: display_name > name > email username > 'Unknown User'
    if (member.display_name?.trim()) {
      return member.display_name.trim();
    }
    
    if (member.name?.trim()) {
      return member.name.trim();
    }
    
    if (member.email?.trim()) {
      // Extract username from email as fallback
      const emailUsername = member.email.split('@')[0];
      return emailUsername || 'Unknown User';
    }
    
    return 'Unknown User';
  };

  const getStatusBadge = () => {
    if (member.status === 'pending') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    }
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
  };

  const getRoleBadge = () => {
    const variant = member.role === 'manager' || member.role === 'owner' ? 'default' : 'secondary';
    return <Badge variant={variant} className="capitalize">{member.role}</Badge>;
  };

  const canRemove = canChangeRoles && !isCurrentUser && !isLastManager;
  const canChangeRole = canChangeRoles && !isCurrentUser && member.status !== 'pending';

  return (
    <Card className="p-4">
      <CardContent className="p-0">
        <div className="space-y-3">
          {/* Header with name and actions */}
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-base truncate">
                {getDisplayName()}
                {isCurrentUser && <span className="text-muted-foreground ml-2">(You)</span>}
              </h4>
              <p className="text-sm text-muted-foreground truncate">{member.email || 'No email'}</p>
            </div>
            
            {canChangeRoles && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border shadow-lg">
                  {member.status === 'pending' && (
                    <DropdownMenuItem onClick={handleResendInvite} disabled={isResending}>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Invite
                    </DropdownMenuItem>
                  )}
                  {canRemove && (
                    <DropdownMenuItem 
                      onClick={() => onRemoveMember(member.user_id || member.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Status and Role badges */}
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {getRoleBadge()}
          </div>

          {/* Role selector for active members */}
          {canChangeRole && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Change Role</span>
              </div>
              <Select 
                value={member.role} 
                onValueChange={handleRoleChange}
                disabled={isChangingRole}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg">
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
