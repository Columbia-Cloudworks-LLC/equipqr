
import { Equipment } from '@/types';
import { EquipmentFilters } from './Filters/EquipmentFilters';
import { EquipmentTable } from './Table/EquipmentTable';
import { useEquipmentFilters } from './hooks/useEquipmentFilters';
import { UserOrganization } from '@/services/organization/userOrganizations';
import { ExportButton } from './ExportButton';
import { MobileFilterDrawer } from './Filters/MobileFilterDrawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { EquipmentCard } from './EquipmentCard';

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
  const isMobile = useIsMobile();
  
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

  // Count active filters
  const activeFilterCount = [
    filterStatus !== 'all' ? 1 : 0,
    filterTeam !== 'all' ? 1 : 0,
    searchQuery ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Desktop filters */}
      {!isMobile && (
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
      )}
      
      {/* Mobile filters */}
      {isMobile && (
        <MobileFilterDrawer
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
          activeFilterCount={activeFilterCount}
        />
      )}
      
      {/* Responsive content - automatically switch based on screen size */}
      {isMobile ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 h-48 animate-pulse bg-muted/30"></div>
            ))
          ) : filteredEquipment.length > 0 ? (
            filteredEquipment.map((item) => (
              <EquipmentCard key={item.id} equipment={item} />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center h-40 border border-dashed rounded-lg">
              <p className="text-muted-foreground">No equipment found matching your filters</p>
            </div>
          )}
        </div>
      ) : (
        <EquipmentTable 
          equipment={filteredEquipment}
          isLoading={isLoading}
        />
      )}
      
      {/* Export Button */}
      <div className="flex justify-end mt-4">
        <ExportButton 
          equipment={filteredEquipment}
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
}

export default EquipmentList;
