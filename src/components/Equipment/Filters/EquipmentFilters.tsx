import { SearchField } from './SearchField';
import { StatusFilter } from './StatusFilter';
import { TeamFilter } from './TeamFilter';
import { OrganizationFilter } from './OrganizationFilter';
import { UserOrganization } from '@/services/organization/userOrganizations';

interface EquipmentFiltersProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterTeam: string;
  onTeamChange: (value: string) => void;
  teams: string[];
  organizations: UserOrganization[];
  selectedOrgId?: string;
  onOrganizationChange: (orgId: string) => void;
  showOrgSelector: boolean;
  isMobile?: boolean;
}

export function EquipmentFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterTeam,
  onTeamChange,
  teams,
  organizations,
  selectedOrgId,
  onOrganizationChange,
  showOrgSelector,
  isMobile = false
}: EquipmentFiltersProps) {
  // For mobile, we use a stacked layout
  if (isMobile) {
    return (
      <div className="flex flex-col space-y-4">
        <SearchField value={searchQuery} onChange={onSearchChange} />
        
        {showOrgSelector && (
          <OrganizationFilter 
            organizations={organizations} 
            selectedOrgId={selectedOrgId} 
            onChange={onOrganizationChange} 
            className="w-full"
          />
        )}
        
        <StatusFilter value={filterStatus} onChange={onStatusChange} className="w-full" />
        
        <TeamFilter 
          value={filterTeam} 
          onChange={onTeamChange} 
          teams={teams}
          className="w-full" 
        />
      </div>
    );
  }
  
  // For desktop, keep the existing layout
  return (
    <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
      <div className="w-full md:w-auto">
        <SearchField value={searchQuery} onChange={onSearchChange} />
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {showOrgSelector && (
          <OrganizationFilter 
            organizations={organizations} 
            selectedOrgId={selectedOrgId} 
            onChange={onOrganizationChange} 
          />
        )}
        
        <StatusFilter value={filterStatus} onChange={onStatusChange} />
        
        <TeamFilter 
          value={filterTeam} 
          onChange={onTeamChange} 
          teams={teams} 
        />
      </div>
    </div>
  );
}
