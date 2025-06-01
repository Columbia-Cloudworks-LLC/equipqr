
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, Mail, Trash2, RefreshCw, Users } from 'lucide-react';
import { UserRole } from '@/types/supabase-enums';

interface Member {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

interface OrganizationMembersListProps {
  members: Member[];
  pendingInvitations: PendingInvitation[];
  isLoading: boolean;
  userRole: UserRole;
  onRemoveMember: (memberId: string) => Promise<void>;
  onResendInvite: (invitationId: string) => Promise<void>;
  onCancelInvitation: (invitationId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function OrganizationMembersList({
  members,
  pendingInvitations,
  isLoading,
  userRole,
  onRemoveMember,
  onResendInvite,
  onCancelInvitation,
  onRefresh
}: OrganizationMembersListProps) {
  const canManageMembers = userRole === 'owner' || userRole === 'manager';

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const hasMembers = members.length > 0;
  const hasPendingInvitations = pendingInvitations.length > 0;

  if (!hasMembers && !hasPendingInvitations) {
    return (
      <div className="text-center py-8">
        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Members Yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Start building your team by inviting members to your organization.
        </p>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Members */}
      {hasMembers && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Active Members ({members.length})
            </h4>
            <Button onClick={onRefresh} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {member.full_name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{member.full_name || 'Unknown Name'}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="capitalize">
                    {member.role}
                  </Badge>
                  {canManageMembers && member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveMember(member.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Invitations */}
      {hasPendingInvitations && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-4">
            Pending Invitations ({pendingInvitations.length})
          </h4>
          <div className="space-y-2">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Mail className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="capitalize">
                    {invitation.role}
                  </Badge>
                  {canManageMembers && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onResendInvite(invitation.id)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancelInvitation(invitation.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
