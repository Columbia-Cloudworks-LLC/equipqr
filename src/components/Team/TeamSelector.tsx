
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Team {
  id: string;
  name: string;
}

interface TeamSelectorProps {
  teams: Team[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowNoTeam?: boolean;
}

export function TeamSelector({ 
  teams, 
  value, 
  onChange, 
  placeholder = "Select a team",
  allowNoTeam = true
}: TeamSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNoTeam && (
          <SelectItem key="no-team" value="none">No team</SelectItem>
        )}
        {teams.map(team => (
          <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default TeamSelector;
