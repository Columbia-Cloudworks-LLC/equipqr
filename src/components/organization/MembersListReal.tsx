
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreHorizontal, UserMinus, Shield, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { RealOrganizationMember, useUpdateMemberRole, useRemoveMember } from '@/hooks/useOrganizationMembers';
import { useAuth } from '@/contexts/AuthContext';

interface MembersListRealProps {
  members: RealOrganizationMember[];
  organizationId: string;
  currentUserRole: 'owner' | 'admin' | 'member';
  isLoading?: boolean;
}

const MembersListReal: React.FC<MembersListRealProps> = ({
  members,
  organizationId,
  currentUserRole,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const updateMemberRole = useUpdateMemberRole(organizationId);
  const removeMember = useRemoveMember(organizationId);

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';
  const currentUserId = user?.id;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      default:
        return 'destructive';
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (newRole === 'admin' || newRole === 'member') {
      try {
        await updateMemberRole.mutateAsync({ memberId, newRole });
      } catch (error) {
        console.error('Failed to update member role:', error);
      }
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember.mutateAsync(memberId);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const isLastOwner = (member: RealOrganizationMember) => {
    const owners = members.filter(m => m.role === 'owner' && m.status === 'active');
    return member.role === 'owner' && owners.length === 1;
  };

  const canRemoveMember = (member: RealOrganizationMember) => {
    // Can't remove yourself if you're the last owner
    if (member.id === currentUserId && isLastOwner(member)) {
      return false;
    }
    
    // Owners can remove anyone except themselves if they're the last owner
    if (currentUserRole === 'owner') {
      return true;
    }
    
    // Admins can remove members, but not other admins or owners
    if (currentUserRole === 'admin') {
      return member.role === 'member';
    }
    
    return false;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground">Loading members...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Members ({members.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {member.name}
                    {member.id === currentUserId && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                    {isLastOwner(member) && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <Shield className="h-3 w-3" />
                        <span className="text-xs">Protected</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{member.email}</div>
                  <div className="text-xs text-muted-foreground">
                    Joined {new Date(member.joinedDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant={getStatusBadgeVariant(member.status)}>
                  {member.status}
                </Badge>
                
                {canManageMembers && member.role !== 'owner' && member.id !== currentUserId ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) => handleRoleChange(member.id, value)}
                    disabled={updateMemberRole.isPending}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {member.role}
                  </Badge>
                )}

                {canRemoveMember(member) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={removeMember.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Remove Member
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove <strong>{member.name}</strong> from the organization? 
                          This action cannot be undone and they will lose access to all organization resources.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveMember(member.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove Member
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MembersListReal;
