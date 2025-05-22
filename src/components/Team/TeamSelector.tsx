
import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TeamSelectorProps {
  teams: any[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hideNoTeamOption?: boolean;
  className?: string;
  disabled?: boolean;
}

export function TeamSelector({ 
  teams, 
  value, 
  onChange, 
  placeholder = "Select a team", 
  hideNoTeamOption = false,
  className = "",
  disabled = false
}: TeamSelectorProps) {
  // Sort teams by name for better UX
  const sortedTeams = React.useMemo(() => {
    return [...teams].sort((a, b) => a.name.localeCompare(b.name));
  }, [teams]);

  return (
    <Select 
      value={value} 
      onValueChange={onChange} 
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {!hideNoTeamOption && <SelectItem value="none">No Team</SelectItem>}
        <SelectGroup>
          <SelectLabel>Teams</SelectLabel>
          {sortedTeams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
