
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Users, Settings, Crown, User, Trash2 } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTeams, useTeamMutations } from '@/hooks/useTeamManagement';
import { useUnifiedPermissions } from '@/hooks/useUnifiedPermissions';
import TeamForm from '@/components/teams/TeamForm';

const Teams = () => {
  const { currentOrganization, isLoading } = useOrganization();
  const [showForm, setShowForm] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Use teams hook for data
  const { data: teams = [], isLoading: teamsLoading } = useTeams(currentOrganization?.id);
  
  // Team mutations
  const { deleteTeam } = useTeamMutations();
  
  // Check permissions
  const permissions = useUnifiedPermissions();

  if (isLoading || teamsLoading || !currentOrganization) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-48 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'manager':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'technician':
        return <User className="h-4 w-4 text-green-600" />;
      case 'requestor':
        return <User className="h-4 w-4 text-orange-600" />;
      case 'viewer':
        return <User className="h-4 w-4 text-gray-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'technician':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'requestor':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDeleteTeam = (teamId: string) => {
    setDeleteTeamId(teamId);
  };

  const confirmDeleteTeam = () => {
    if (deleteTeamId) {
      deleteTeam.mutate(deleteTeamId);
      setDeleteTeamId(null);
    }
  };

  const selectedTeam = teams.find(team => team.id === deleteTeamId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage teams for {currentOrganization.name}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </div>

      {/* Teams Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    {team.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {team.description}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{team.members.length} members</span>
                </div>
                <div className="text-muted-foreground">
                  {team.member_count} total members
                </div>
              </div>

              {/* Team Members Preview */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Team Members</h4>
                <div className="space-y-2">
                  {team.members.slice(0, 3).map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <Avatar className="h-6 w-6">
                           <AvatarImage src={undefined} />
                           <AvatarFallback className="text-xs">
                             {(member.profiles?.name || 'U').split(' ').map(n => n[0]).join('')}
                           </AvatarFallback>
                         </Avatar>
                         <div>
                           <p className="text-sm font-medium">{member.profiles?.name || 'Unknown'}</p>
                           <p className="text-xs text-muted-foreground">{member.profiles?.email || 'No email'}</p>
                         </div>
                      </div>
                      <Badge className={getRoleColor(member.role)} variant="outline">
                        <div className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          {member.role}
                        </div>
                      </Badge>
                    </div>
                  ))}
                  {team.members.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{team.members.length - 3} more members
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => navigate(`/teams/${team.id}`)}
                >
                  View Details
                </Button>
                {permissions.teams.getPermissions(team.id).canDelete && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteTeam(team.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {teams.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first team for {currentOrganization.name}.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Team Form Modal */}
      <TeamForm 
        open={showForm} 
        onClose={() => setShowForm(false)} 
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTeamId} onOpenChange={() => setDeleteTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the team "{selectedTeam?.name}"? This action cannot be undone and will remove all team assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Teams;
