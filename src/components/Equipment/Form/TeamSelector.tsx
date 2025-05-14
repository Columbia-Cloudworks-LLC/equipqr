
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useState, useEffect } from 'react';

interface Team {
  id: string;
  name: string;
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
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name} {team.is_external && `(${team.org_name || 'External Organization'})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
