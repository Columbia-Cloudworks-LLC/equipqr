
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Team {
  id: string;
  name: string;
  org_name?: string;
  org_id?: string;
  is_external?: boolean;
  role?: string;
  deleted_at?: string | null;
}

interface TeamSelectorProps {
  teams: Team[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hideNoTeamOption?: boolean;
}

export function TeamSelector({ 
  teams, 
  value, 
  onChange, 
  placeholder = "Select a team",
  hideNoTeamOption = false
}: TeamSelectorProps) {
  // Ensure we only work with non-deleted teams
  const validTeams = teams.filter(team => !team.deleted_at);
  
  // Group teams by organization if org_name is present
  const hasOrgInfo = validTeams.some(team => team.org_name);
  const groupedTeams = hasOrgInfo ? 
    validTeams.reduce((acc, team) => {
      const orgName = team.org_name || 'Your Organization';
      if (!acc[orgName]) {
        acc[orgName] = [];
      }
      acc[orgName].push(team);
      return acc;
    }, {} as Record<string, Team[]>) :
    { 'All Teams': validTeams };
  
  // If no teams are available or the selected team no longer exists,
  // trigger onChange with the first valid team or empty string
  useEffect(() => {
    if (validTeams.length > 0) {
      const teamExists = validTeams.some(team => team.id === value);
      if (!teamExists && value) {
        onChange(validTeams[0].id);
      }
    } else if (value) {
      onChange('');
    }
  }, [validTeams, value, onChange]);
  
  // If there are no valid teams to select, return null
  if (validTeams.length === 0) {
    return null;
  }
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      
      <SelectContent>
        {!hideNoTeamOption && (
          <SelectItem value="none">No team</SelectItem>
        )}
        
        {hasOrgInfo ? (
          Object.entries(groupedTeams).map(([orgName, orgTeams]) => (
            <SelectGroup key={orgName}>
              <SelectLabel>{orgName}</SelectLabel>
              {orgTeams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  <div className="flex items-center">
                    {team.name}
                    {team.is_external && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="ml-2 px-1 py-0 text-[10px] h-4 bg-blue-50">
                              External
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">From {team.org_name}</p>
                            {team.role && <p className="text-xs">Role: {team.role}</p>}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))
        ) : (
          validTeams.map(team => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

import { useEffect } from 'react';
