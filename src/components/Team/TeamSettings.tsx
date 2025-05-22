import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ExternalLink, AlertTriangle, Settings } from 'lucide-react';
import { DeleteTeamButton } from './DeleteTeamButton';
import { EditTeamButton } from './EditTeamButton';
import { Badge } from '../ui/badge';

interface TeamSettingsProps {
  team: any;
  isUpdating: boolean;
  isDeleting: boolean;
  onUpdateTeam: (id: string, name: string) => Promise<any>;
  onDelete: (teamId: string) => Promise<any>;
  currentUserRole?: string;
  getTeamEquipmentCount: (teamId: string) => Promise<number>;
}

export function TeamSettings({
  team,
  isUpdating,
  isDeleting,
  onUpdateTeam,
  onDelete,
  currentUserRole = 'viewer',
  getTeamEquipmentCount
}: TeamSettingsProps) {
  const [equipmentCount, setEquipmentCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  
  // Manager+ can edit team settings
  const canEditTeam = currentUserRole === 'manager' || currentUserRole === 'owner';
  
  // Only load equipment count when user triggers delete action
  const checkEquipmentCount = async () => {
    if (getTeamEquipmentCount && team?.id) {
      setIsLoadingCount(true);
      try {
        const count = await getTeamEquipmentCount(team.id);
        setEquipmentCount(count);
      } catch (error) {
        console.error('Failed to get equipment count:', error);
      } finally {
        setIsLoadingCount(false);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h3 className="text-lg font-medium">Team Settings</h3>
      </div>
      
      <div className="space-y-4">
        {/* Team Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-medium">Team Information</h4>
            {team?.is_external_org && (
              <Badge variant="outline" className="text-xs">
                <ExternalLink className="h-3 w-3 mr-1" /> 
                External
              </Badge>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="team-name">Team Name</Label>
              <div className="flex gap-2">
                <Input 
                  id="team-name" 
                  value={team?.name || ''} 
                  disabled={true} 
                  className="flex-1"
                />
                {canEditTeam && !team?.is_external_org && onUpdateTeam && (
                  <EditTeamButton 
                    teamId={team?.id}
                    teamName={team?.name || ''}
                    onUpdateTeam={onUpdateTeam}
                    isLoading={isUpdating}
                  />
                )}
              </div>
            </div>
            
            {team?.org_name && (
              <div className="space-y-1">
                <Label>Organization</Label>
                <div className="text-sm bg-muted px-3 py-2 rounded-md">
                  {team.org_name}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Danger Zone */}
        {canEditTeam && !team?.is_external_org && (
          <div className="space-y-2 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-destructive flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> Danger Zone
            </h4>
            
            {team?.id && (
              <DeleteTeamButton 
                teamId={team.id}
                teamName={team?.name || ''}
                onDeleteTeam={onDelete}
                isDeleting={isDeleting}
                hasEquipment={!!equipmentCount && equipmentCount > 0}
                equipmentCount={equipmentCount || 0}
                onBeforeDelete={checkEquipmentCount}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
