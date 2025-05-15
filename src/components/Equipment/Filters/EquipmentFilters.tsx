
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { SearchField } from './SearchField';
import { StatusFilter } from './StatusFilter';
import { TeamFilter } from './TeamFilter';
import { OrganizationFilter } from './OrganizationFilter';

interface Organization {
  id: string;
  name: string;
  role?: string;
  is_primary?: boolean;
}

interface EquipmentFiltersProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterTeam: string;
  onTeamChange: (value: string) => void;
  teams: string[];
  organizations: Organization[];
  selectedOrgId?: string;
  onOrganizationChange: (orgId: string) => void;
  showOrgSelector: boolean;
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
  showOrgSelector
}: EquipmentFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
      <SearchField value={searchQuery} onChange={onSearchChange} />
      
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
        
        <Button asChild>
          <Link to="/equipment/new">
            <Package className="mr-2 h-4 w-4" />
            Add Equipment
          </Link>
        </Button>
      </div>
    </div>
  );
}
