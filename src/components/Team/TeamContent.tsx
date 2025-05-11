
import { TeamList } from '@/components/Team/TeamList';
import { InviteForm } from '@/components/Team/InviteForm';
import { TeamCreationForm } from '@/components/Team/TeamCreationForm';
import { PendingInvitationsList } from '@/components/Team/PendingInvitationsList';
import { TeamMember } from '@/types';
import { UserRole } from '@/types/supabase-enums';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CircleAlert, ArrowUpToLine } from "lucide-react";
import { useEffect, useState } from 'react';

interface TeamContentProps {
  selectedTeamId: string;
  members: TeamMember[];
  pendingInvitations?: any[];
  teams: { id: string; name: string }[];
  isLoading: boolean;
  isLoadingInvitations?: boolean;
  isCreatingTeam: boolean;
  isRepairingTeam?: boolean;
  isUpgradingRole?: boolean;
  isRequestingRole?: boolean;
  isMember?: boolean;
  currentUserRole?: string;
  canChangeRoles?: boolean;
  onInviteMember: (email: string, role: UserRole, teamId: string) => void;
  onChangeRole: (id: string, role: UserRole, teamId: string) => void;
  onRemoveMember: (id: string, teamId: string) => void;
  onResendInvite: (id: string) => Promise<void>;
  onCancelInvitation?: (id: string) => Promise<void>;
  onCreateTeam: (name: string) => void;
  onRepairTeam?: (teamId: string) => void;
  onUpgradeRole?: (teamId: string) => void;
  onRequestRoleUpgrade?: (teamId: string) => void;
  onFetchPendingInvitations?: () => void;
}

export function TeamContent({
  selectedTeamId,
  members,
  pendingInvitations = [],
  teams,
  isLoading,
  isLoadingInvitations = false,
  isCreatingTeam,
  isRepairingTeam = false,
  isUpgradingRole = false,
  isRequestingRole = false,
  isMember = true,
  currentUserRole,
  canChangeRoles = false,
  onInviteMember,
  onChangeRole,
  onRemoveMember,
  onResendInvite,
  onCancelInvitation = async () => {},
  onCreateTeam,
  onRepairTeam,
  onUpgradeRole,
  onRequestRoleUpgrade,
  onFetchPendingInvitations
}: TeamContentProps) {
  const [activeTab, setActiveTab] = useState('members');

  // Fetch pending invitations only on initial mount and when team changes
  useEffect(() => {
    if (selectedTeamId && onFetchPendingInvitations && isMember && currentUserRole !== 'viewer') {
      onFetchPendingInvitations();
    }
  }, [selectedTeamId, isMember, currentUserRole]);
  
  // Fetch pending invitations when the "Pending Invitations" tab is selected
  useEffect(() => {
    if (activeTab === 'pending' && onFetchPendingInvitations && selectedTeamId) {
      onFetchPendingInvitations();
    }
  }, [activeTab, selectedTeamId]);

  // Handle repair access case
  if (selectedTeamId && !isMember && onRepairTeam) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Issue Detected</AlertTitle>
          <AlertDescription>
            You don't appear to be a member of this team, possibly due to an issue during team creation.
            <div className="mt-4">
              <Button
                onClick={() => onRepairTeam(selectedTeamId)}
                disabled={isRepairingTeam}
                className="flex items-center gap-2"
              >
                <CircleAlert className="h-4 w-4" />
                {isRepairingTeam ? 'Repairing...' : 'Repair Team Membership'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Handle viewer role with upgrade option
  if (selectedTeamId && isMember && currentUserRole === 'viewer') {
    const handleRoleAction = () => {
      if (canChangeRoles && onUpgradeRole) {
        onUpgradeRole(selectedTeamId);
      } else if (onRequestRoleUpgrade) {
        onRequestRoleUpgrade(selectedTeamId);
      }
    };
    
    return (
      <div className="space-y-6">
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Viewer Role Detected</AlertTitle>
          <AlertDescription>
            You currently have view-only access to this team. To manage team members or make changes, you need a manager role.
            <div className="mt-4">
              <Button
                onClick={handleRoleAction}
                disabled={isUpgradingRole || isRequestingRole}
                className="flex items-center gap-2"
              >
                <ArrowUpToLine className="h-4 w-4" />
                {isUpgradingRole || isRequestingRole ? 'Processing...' : 
                 canChangeRoles ? 'Upgrade to Manager Role' : 'Request Manager Role'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="members" className="w-full">
          <TabsList>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="create">Create Team</TabsTrigger>
          </TabsList>
          
          <TabsContent value="members" className="mt-6">
            <TeamList
              members={members}
              onRemoveMember={onRemoveMember}
              onChangeRole={onChangeRole}
              onResendInvite={onResendInvite}
              teamId={selectedTeamId}
              isViewOnly={true}
            />
          </TabsContent>
          
          <TabsContent value="create" className="mt-6 max-w-md">
            <TeamCreationForm 
              onCreateTeam={onCreateTeam}
              isLoading={isCreatingTeam}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <Tabs defaultValue="members" className="w-full" onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="members">Team Members</TabsTrigger>
        <TabsTrigger value="pending">Pending Invitations</TabsTrigger>
        <TabsTrigger value="invite">Invite People</TabsTrigger>
        <TabsTrigger value="create">Create Team</TabsTrigger>
      </TabsList>
      
      <TabsContent value="members" className="mt-6">
        {selectedTeamId ? (
          <TeamList
            members={members}
            onRemoveMember={onRemoveMember}
            onChangeRole={onChangeRole}
            onResendInvite={onResendInvite}
            teamId={selectedTeamId}
          />
        ) : (
          <p>Select a team to view members</p>
        )}
      </TabsContent>
      
      <TabsContent value="pending" className="mt-6">
        {selectedTeamId ? (
          <PendingInvitationsList
            invitations={pendingInvitations}
            onResendInvite={onResendInvite}
            onCancelInvite={onCancelInvitation}
            isLoading={isLoadingInvitations}
          />
        ) : (
          <p>Select a team to view pending invitations</p>
        )}
      </TabsContent>
      
      <TabsContent value="invite" className="mt-6 max-w-md">
        <InviteForm 
          onInvite={onInviteMember} 
          isLoading={isLoading}
          teams={teams}
        />
      </TabsContent>
      
      <TabsContent value="create" className="mt-6 max-w-md">
        <TeamCreationForm 
          onCreateTeam={onCreateTeam}
          isLoading={isCreatingTeam}
        />
      </TabsContent>
    </Tabs>
  );
}
