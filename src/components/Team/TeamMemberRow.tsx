
import { useState } from 'react';
import { UserRole } from '@/types/supabase-enums';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CheckIcon, MoreHorizontal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TeamMember } from '@/types';
import { TableCell, TableRow } from '@/components/ui/table';

// Extend the TeamMember type to include additional properties needed by this component
interface ExtendedTeamMember extends TeamMember {
  auth_uid?: string;
  name?: string;
}

interface TeamMemberRowProps {
  member: ExtendedTeamMember;
  canChangeRoles: boolean;
  isCurrentUser: boolean;
  isLastManager: boolean;
  onChangeRole: (userId: string, role: UserRole) => void;
  onRemoveMember: (userId: string) => void;
  onResendInvite?: (id: string) => Promise<void>;
  currentUserRole?: string;
}

// Role configuration for the dropdown
const ROLES = [
  { label: 'Manager', value: 'manager' as UserRole },
  { label: 'Technician', value: 'technician' as UserRole },
  { label: 'Viewer', value: 'viewer' as UserRole }
];

export function TeamMemberRow({
  member,
  canChangeRoles,
  isCurrentUser,
  isLastManager,
  onChangeRole,
  onRemoveMember,
  onResendInvite,
  currentUserRole
}: TeamMemberRowProps) {
  const [isChangingRole, setIsChangingRole] = useState(false);
  
  // Helper to get initials from name or email
  const getInitials = () => {
    if (member.display_name) {
      return member.display_name.substring(0, 2).toUpperCase();
    }
    return member.email.substring(0, 2).toUpperCase();
  };
  
  // Determine if this role can be changed
  const cannotChangeRole = isLastManager && member.role === 'manager' && isCurrentUser;
  
  // Handle role change with loading state
  const handleRoleChange = async (role: UserRole) => {
    if (isChangingRole) return;
    
    try {
      setIsChangingRole(true);
      await onChangeRole(member.auth_uid || member.user_id, role);
    } finally {
      setIsChangingRole(false);
    }
  };
  
  // Handle member removal with confirmation
  const handleRemove = async () => {
    if (window.confirm(`Are you sure you want to remove ${member.display_name || member.name || member.email} from the team?`)) {
      await onRemoveMember(member.auth_uid || member.user_id);
    }
  };

  return (
    <TableRow>
      {/* Name/Avatar Column */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={member.avatar_url} alt={member.display_name || member.email} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold">{member.display_name || member.name || member.email}</span>
            <span className="text-xs text-muted-foreground">{member.email}</span>
          </div>
        </div>
      </TableCell>

      {/* Email Column */}
      <TableCell className="hidden md:table-cell">
        {member.email}
      </TableCell>

      {/* Role Column */}
      <TableCell>
        <Badge variant="secondary">{member.role}</Badge>
      </TableCell>

      {/* Status Column */}
      <TableCell>
        {member.is_active ? 'Active' : 'Inactive'}
      </TableCell>

      {/* Actions Column */}
      <TableCell className="text-right">
        {canChangeRoles && !isCurrentUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ROLES.map(role => (
                <DropdownMenuItem 
                  key={role.value} 
                  onClick={() => handleRoleChange(role.value)}
                  disabled={isChangingRole || cannotChangeRole}
                >
                  {isChangingRole ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      {member.role === role.value && (
                        <CheckIcon className="mr-2 h-4 w-4" />
                      )}
                      <span>{role.label}</span>
                    </>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={handleRemove}>
                Remove Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="text-muted-foreground text-sm">
            {isCurrentUser ? 'You' : 'No actions available'}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}
