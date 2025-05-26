
import { SearchField } from './SearchField';
import { StatusFilter } from './StatusFilter';
import { TeamFilter } from './TeamFilter';

interface EquipmentFiltersProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filterStatus: string;
  onStatusChange: (status: string) => void;
  filterTeam: string;
  onTeamChange: (team: string) => void;
  teams: string[];
}

export function EquipmentFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterTeam,
  onTeamChange,
  teams
}: EquipmentFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <SearchField 
        value={searchQuery}
        onChange={onSearchChange}
      />
      <StatusFilter 
        value={filterStatus}
        onChange={onStatusChange}
      />
      <TeamFilter 
        value={filterTeam}
        onChange={onTeamChange}
        teams={teams}
      />
    </div>
  );
}
