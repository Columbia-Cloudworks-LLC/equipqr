
import React from 'react';
import { TeamSelector } from './TeamSelector';
import { TeamMembers } from './TeamMembers';
import { TeamSettings } from './TeamSettings';
import { CreateTeamDialog } from './CreateTeamDialog';
import { useTeamManagementContext } from '@/contexts/TeamManagementContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function TeamManagementView() {
  const {
    teams,
    members,
    pendingInvitations,
    organizationMembers,
    existingTeamMemberIds,
    selectedTeamId,
    selectedOrganization,
    filteredTeams,
    isLoading,
    isLoadingInvitations,
    isCreatingTeam,
    isUpdatingTeam,
    isDeletingTeam,
    isUpgradingRole,
    isRequestingRole,
    isMember,
    currentUserRole,
    canChangeRoles,
    error,
    setSelectedTeamId,
    handleCreateTeam,
    handleUpdateTeam,
    handleDeleteTeam,
    handleAddOrgMember,
    handleInviteMember,
    handleChangeRole,
    handleRemoveMember,
    handleResendInvite,
    handleCancelInvitation,
    handleUpgradeRole,
    handleRequestRoleUpgrade,
    refetchTeamMembers,
    refetchPendingInvitations,
    fetchTeams,
    getTeamEquipmentCount,
    refetchOrgMembers
  } = useTeamManagementContext();

  const selectedTeam = teams.find(team => team.id === selectedTeamId);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your teams and team members for {selectedOrganization?.name}
          </p>
        </div>
        <CreateTeamDialog
          onCreateTeam={handleCreateTeam}
          isCreating={isCreatingTeam}
        />
      </div>

      <TeamSelector
        teams={filteredTeams}
        value={selectedTeamId}
        onChange={setSelectedTeamId}
      />

      {selectedTeam && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTeam.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="members" className="w-full">
              <TabsList>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="members" className="space-y-4">
                <TeamMembers
                  teamId={selectedTeamId}
                  teamName={selectedTeam.name}
                  members={members}
                  pendingInvitations={pendingInvitations}
                  organizationMembers={organizationMembers}
                  existingTeamMemberIds={existingTeamMemberIds}
                  teams={teams}
                  isLoading={isLoading}
                  currentUserRole={currentUserRole}
                  isMember={isMember}
                  canChangeRoles={canChangeRoles}
                  isUpgradingRole={isUpgradingRole}
                  isRequestingRole={isRequestingRole}
                  onAddOrgMember={handleAddOrgMember}
                  onInviteMember={handleInviteMember}
                  onChangeRole={handleChangeRole}
                  onRemoveMember={handleRemoveMember}
                  onUpgradeRole={handleUpgradeRole}
                  onRequestRoleUpgrade={handleRequestRoleUpgrade}
                  onResendInvite={handleResendInvite}
                  onCancelInvitation={handleCancelInvitation}
                />
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <TeamSettings
                  team={selectedTeam}
                  onUpdateTeam={(id, name) => handleUpdateTeam(id, { name })}
                  onDelete={handleDeleteTeam}
                  isUpdating={isUpdatingTeam}
                  isDeleting={isDeletingTeam}
                  currentUserRole={currentUserRole}
                  canChangeRoles={canChangeRoles}
                  getTeamEquipmentCount={getTeamEquipmentCount}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
