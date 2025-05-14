
import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Mail, User } from 'lucide-react';
import { getOrganizationMembers, OrganizationMember, updateMemberRole } from '@/services/organization';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/supabase-enums';

interface OrganizationMembersTableProps {
  organizationId: string;
  isOwner: boolean;
}

export function OrganizationMembersTable({ organizationId, isOwner }: OrganizationMembersTableProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchMembers = async () => {
      if (organizationId) {
        setIsLoading(true);
        const data = await getOrganizationMembers(organizationId);
        setMembers(data);
        setIsLoading(false);
      }
    };
    
    fetchMembers();
  }, [organizationId]);
  
  const handleRoleChange = async (memberId: string, role: UserRole) => {
    setUpdatingMemberId(memberId);
    const success = await updateMemberRole(memberId, role);
    
    if (success) {
      setMembers(members.map(member => {
        if (member.id === memberId) {
          return { ...member, role };
        }
        return member;
      }));
    }
    
    setUpdatingMemberId(null);
  };
  
  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'technician':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            {isOwner && <TableHead className="w-[80px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                <TableCell><Skeleton className="h-5 w-[180px]" /></TableCell>
                <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                {isOwner && <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>}
              </TableRow>
            ))
          ) : members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isOwner ? 6 : 5} className="text-center py-4 text-muted-foreground">
                No members found
              </TableCell>
            </TableRow>
          ) : (
            members.map(member => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    {member.name || 'Unnamed User'}
                    {member.user_id === user?.id && (
                      <span className="ml-2 text-xs bg-muted text-muted-foreground rounded px-2 py-0.5">You</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    {member.email}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getRoleBadgeColor(member.role)}>
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={member.status === 'Active' ? 'default' : 'outline'}>
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(member.joined_at).toLocaleDateString()}
                </TableCell>
                {isOwner && (
                  <TableCell>
                    {member.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={updatingMemberId === member.id}
                          >
                            {updatingMemberId === member.id ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.id, 'manager' as UserRole)}
                            disabled={member.role === 'manager'}
                          >
                            Make Manager
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.id, 'technician' as UserRole)}
                            disabled={member.role === 'technician'}
                          >
                            Make Technician
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.id, 'viewer' as UserRole)}
                            disabled={member.role === 'viewer'}
                          >
                            Make Viewer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
