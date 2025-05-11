
import { useState } from 'react';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  UserX, 
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TeamMemberRowProps {
  member: TeamMember;
  onRemoveMember: (id: string, teamId: string) => void;
  onChangeRole: (id: string, role: UserRole, teamId: string) => void;
  onResendInvite: (id: string) => void;
  teamId: string;
  isViewOnly: boolean;
  changingRoleFor: string | null;
  removingMember: string | null;
  resendingInvite: string | null;
  setChangingRoleFor: (id: string | null) => void;
  setRemovingMember: (id: string | null) => void;
  setResendingInvite: (id: string | null) => void;
}

export function TeamMemberRow({
  member,
  onRemoveMember,
  onChangeRole,
  onResendInvite,
  teamId,
  isViewOnly,
  changingRoleFor,
  removingMember,
  resendingInvite,
  setChangingRoleFor,
  setRemovingMember,
  setResendingInvite
}: TeamMemberRowProps) {
  
  const handleRoleChange = async (memberId: string, userId: string, newRole: UserRole) => {
    try {
      setChangingRoleFor(memberId);
      await onChangeRole(userId, newRole, teamId);
    } finally {
      setChangingRoleFor(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      setRemovingMember(userId);
      await onRemoveMember(userId, teamId);
    } finally {
      setRemovingMember(null);
    }
  };

  const handleResendInvite = async (id: string) => {
    try {
      setResendingInvite(id);
      await onResendInvite(id);
    } finally {
      setResendingInvite(null);
    }
  };

  return (
    <TableRow key={member.id}>
      <TableCell className="font-medium">
        {member.name || 'Unknown'}
      </TableCell>
      <TableCell>{member.email}</TableCell>
      <TableCell>
        {isViewOnly ? (
          <Badge variant={member.role === 'manager' ? 'default' : 'outline'}>
            {member.role || 'viewer'}
          </Badge>
        ) : (
          <Select 
            defaultValue={member.role || 'viewer'}
            onValueChange={(value) => handleRoleChange(member.id, member.user_id || '', value as UserRole)}
            disabled={changingRoleFor === member.id}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="technician">Technician</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={member.status === 'Active' ? 'default' : 'outline'}>
          {member.status || 'Unknown'}
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
              <DropdownMenuItem 
                onClick={() => handleRemoveMember(member.user_id || '')}
                disabled={removingMember === member.user_id}
                className="flex items-center gap-2"
              >
                <UserX className="h-4 w-4" />
                {removingMember === member.user_id ? 'Removing...' : 'Remove from team'}
              </DropdownMenuItem>
              {member.status === 'Pending' && (
                <DropdownMenuItem 
                  onClick={() => handleResendInvite(member.id)}
                  disabled={resendingInvite === member.id}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {resendingInvite === member.id ? 'Resending...' : 'Resend invitation'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="h-4 w-4" />
                <span className="sr-only">Info</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upgrade to manager role to modify team members</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}
