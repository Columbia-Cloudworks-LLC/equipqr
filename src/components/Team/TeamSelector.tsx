
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

interface Team {
  id: string;
  name: string;
  org_id?: string;
  org_name?: string;
  is_external_org?: boolean;
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
  // Handle null or undefined values
  const safeValue = value || 'none';
  
  // Group teams by organization if org info is available
  const hasOrgInfo = teams.some(team => team.org_name);
  const mainOrgId = teams.find(team => !team.is_external_org)?.org_id;
  
  let mainOrgTeams: Team[] = [];
  let externalOrgTeams: { [orgId: string]: Team[] } = {};
  
  if (hasOrgInfo) {
    // Separate teams into main org and external orgs
    teams.forEach(team => {
      if (!team.is_external_org || team.org_id === mainOrgId) {
        mainOrgTeams.push(team);
      } else if (team.org_id) {
        if (!externalOrgTeams[team.org_id]) {
          externalOrgTeams[team.org_id] = [];
        }
        externalOrgTeams[team.org_id].push(team);
      }
    });
  }
  
  return (
    <Select value={safeValue} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNoTeam && (
          <SelectItem key="no-team" value="none">No team</SelectItem>
        )}
        
        {hasOrgInfo ? (
          <>
            {/* Main organization teams */}
            <SelectGroup>
              <SelectLabel>My Organization</SelectLabel>
              {mainOrgTeams.map(team => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectGroup>
            
            {/* External organization teams */}
            {Object.entries(externalOrgTeams).map(([orgId, orgTeams]) => (
              <SelectGroup key={orgId}>
                <SelectLabel className="flex items-center">
                  {orgTeams[0]?.org_name || 'External Organization'}
                  <Badge variant="outline" className="ml-2 bg-blue-50 text-xs">External</Badge>
                </SelectLabel>
                {orgTeams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectGroup>
            ))}
          </>
        ) : (
          // Flat list if no org info available
          teams.map(team => (
            <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

export default TeamSelector;
