
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useState, useEffect } from 'react';

interface Team {
  id: string;
  name: string;
  org_id: string;
  org_name?: string;
  is_external?: boolean;
  role?: string;
}

interface TeamSelectorProps {
  teams: Team[];
  value: string | null;
  onChange: (value: string) => void;
  showExternalTeamAlert?: boolean;
}

export function EnhancedTeamSelector({ teams, value, onChange, showExternalTeamAlert = true }: TeamSelectorProps) {
  const [selectedTeamIsExternal, setSelectedTeamIsExternal] = useState(false);
  const [teamsGroupedByOrg, setTeamsGroupedByOrg] = useState<{[key: string]: Team[]}>({});
  
  // Group teams by organization
  useEffect(() => {
    const groupedTeams: {[key: string]: Team[]} = {};
    
    teams.forEach(team => {
      const orgId = team.org_id;
      if (!groupedTeams[orgId]) {
        groupedTeams[orgId] = [];
      }
      groupedTeams[orgId].push(team);
    });
    
    setTeamsGroupedByOrg(groupedTeams);
  }, [teams]);
  
  // Check if selected team is external
  useEffect(() => {
    if (value && value !== 'none') {
      const selectedTeam = teams.find(t => t.id === value);
      setSelectedTeamIsExternal(Boolean(selectedTeam?.is_external));
    } else {
      setSelectedTeamIsExternal(false);
    }
  }, [value, teams]);
  
  const handleTeamChange = (newValue: string) => {
    onChange(newValue);
  };
  
  return (
    <>
      {selectedTeamIsExternal && showExternalTeamAlert && (
        <Alert className="bg-blue-50 border-blue-200 mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>External Team Selected</AlertTitle>
          <AlertDescription>
            This equipment will be added to an external organization's team.
          </AlertDescription>
        </Alert>
      )}
      
      <Select 
        value={value || 'none'} 
        onValueChange={handleTeamChange}
      >
        <SelectTrigger id="team_id">
          <SelectValue placeholder="Select team (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Team</SelectItem>
          
          {/* Group teams by organization */}
          {Object.entries(teamsGroupedByOrg).map(([orgId, orgTeams]) => {
            // Use the first team to get org information
            const orgName = orgTeams[0]?.org_name || 'Unknown Organization';
            const isExternal = orgTeams[0]?.is_external;
            
            return (
              <div key={orgId} className="pt-1 first:pt-0">
                {Object.keys(teamsGroupedByOrg).length > 1 && (
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/30">
                    {orgName} {isExternal && "(External)"}
                  </div>
                )}
                
                {orgTeams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </div>
            );
          })}
        </SelectContent>
      </Select>
    </>
  );
}
