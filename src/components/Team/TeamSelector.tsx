
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Team {
  id: string;
  name: string;
  org_name?: string;
  is_external_org?: boolean;
  access_type?: string;
}

interface TeamSelectorProps {
  teams: Team[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TeamSelector({
  teams,
  value,
  onChange,
  placeholder = "Select team",
  disabled = false,
}: TeamSelectorProps) {
  return (
    <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {teams.length > 0 ? (
          <>
            <SelectGroup>
              <SelectLabel>Your Teams</SelectLabel>
              {teams
                .filter(team => !team.is_external_org)
                .map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
            </SelectGroup>
            
            {/* Add external teams in separate group */}
            {teams.some(team => team.is_external_org) && (
              <SelectGroup>
                <SelectLabel>External Teams</SelectLabel>
                {teams
                  .filter(team => team.is_external_org)
                  .map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        {team.name}
                        <Badge variant="outline" className="ml-1 text-xs">
                          {team.org_name || 'External'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
              </SelectGroup>
            )}
          </>
        ) : (
          <SelectItem value="none" disabled>
            No teams available
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
