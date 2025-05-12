
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
  is_external?: boolean;
  role?: string;
}

interface TeamSelectorProps {
  teams: Team[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TeamSelector({ teams, value, onChange, placeholder = "Select a team" }: TeamSelectorProps) {
  // Group teams by organization if org_name is present
  const hasOrgInfo = teams.some(team => team.org_name);
  const groupedTeams = hasOrgInfo ? 
    teams.reduce((acc, team) => {
      const orgName = team.org_name || 'Your Organization';
      if (!acc[orgName]) {
        acc[orgName] = [];
      }
      acc[orgName].push(team);
      return acc;
    }, {} as Record<string, Team[]>) :
    { 'All Teams': teams };
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      
      <SelectContent>
        <SelectItem value="none">No team</SelectItem>
        
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
          teams.map(team => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
