
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

interface TeamListProps {
  members: TeamMember[];
  onRemoveMember: (id: string, teamId: string) => void;
  onChangeRole: (id: string, role: UserRole, teamId: string) => void;
  onResendInvite: (id: string) => void;
  teamId: string;
}

export function TeamList({ members, onRemoveMember, onChangeRole, onResendInvite, teamId }: TeamListProps) {
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'technician': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length > 0 ? (
            members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(member.name || '')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {member.status === 'Active' ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getRoleColor(member.role || '')}>
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {member.status === 'Active' ? (
                    <time dateTime={member.joined_at}>
                      {new Date(member.joined_at).toLocaleDateString()}
                    </time>
                  ) : (
                    'Not joined yet'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onChangeRole(member.id, 'manager', teamId)}>
                        Change to Manager
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onChangeRole(member.id, 'technician', teamId)}>
                        Change to Technician
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onChangeRole(member.id, 'viewer', teamId)}>
                        Change to Viewer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {member.status === 'Pending' && (
                        <DropdownMenuItem onClick={() => onResendInvite(member.id)}>
                          Resend Invitation
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => onRemoveMember(member.id, teamId)}
                      >
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                No team members found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default TeamList;
