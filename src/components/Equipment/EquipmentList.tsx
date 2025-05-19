
import { Equipment } from '@/types';
import { EquipmentFilters } from './Filters/EquipmentFilters';
import { EquipmentTable } from './Table/EquipmentTable';
import { useEquipmentFilters } from './hooks/useEquipmentFilters';
import { UserOrganization } from '@/services/organization/userOrganizations';

interface EquipmentListProps {
  equipment: Equipment[];
  isLoading?: boolean;
  organizations?: UserOrganization[];
  selectedOrgId?: string;
  onOrganizationChange?: (orgId: string) => void;
  showOrgSelector?: boolean;
}

export function EquipmentList({ 
  equipment, 
  isLoading = false, 
  organizations = [],
  selectedOrgId,
  onOrganizationChange = () => {},
  showOrgSelector = false
}: EquipmentListProps) {
  // Ensure equipment is always an array, even if somehow passed as something else
  const safeEquipment = Array.isArray(equipment) ? equipment : [];
  
  // Use our custom hook to manage filtering logic
  const {
    filterStatus,
    setFilterStatus,
    filterTeam,
    setFilterTeam,
    searchQuery,
    setSearchQuery,
    teams,
    filteredEquipment
  } = useEquipmentFilters(safeEquipment);

  return (
    <div className="space-y-4">
      <EquipmentFilters 
        searchQuery={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filterTeam={filterTeam}
        onTeamChange={setFilterTeam}
        teams={teams}
        organizations={organizations}
        selectedOrgId={selectedOrgId}
        onOrganizationChange={onOrganizationChange}
        showOrgSelector={showOrgSelector}
      />
      
      <EquipmentTable 
        equipment={filteredEquipment}
        isLoading={isLoading}
      />
    </div>
  );
}

export default EquipmentList;
