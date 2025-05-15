
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TeamFilterProps {
  value: string;
  onChange: (value: string) => void;
  teams: string[];
}

export function TeamFilter({ value, onChange, teams }: TeamFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Filter by team" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Teams</SelectItem>
        <SelectItem value="no-team">No Team</SelectItem>
        {teams.map(team => (
          <SelectItem key={team} value={team || ''}>
            {team}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
