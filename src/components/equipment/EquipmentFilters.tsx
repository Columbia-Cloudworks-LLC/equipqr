import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileEquipmentFilters } from './MobileEquipmentFilters';
import { DesktopEquipmentFilters } from './DesktopEquipmentFilters';
import { EquipmentFilters as EquipmentFiltersType } from '@/hooks/useEquipmentFiltering';
import { EquipmentFiltersComponentProps } from '@/types/equipmentFilter';

export function EquipmentFilters({
  filters,
  onFilterChange,
  onClearFilters,
  onQuickFilter,
  filterOptions,
  hasActiveFilters
}: EquipmentFiltersComponentProps) {
  const isMobile = useIsMobile();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.manufacturer !== 'all') count++;
    if (filters.location !== 'all') count++;
    if (filters.team !== 'all') count++;
    if (filters.maintenanceDateFrom || filters.maintenanceDateTo) count++;
    if (filters.installationDateFrom || filters.installationDateTo) count++;
    if (filters.warrantyExpiring) count++;
    return count;
  };

  if (isMobile) {
    return (
      <MobileEquipmentFilters
        filters={filters}
        activeFilterCount={getActiveFilterCount()}
        showMobileFilters={showMobileFilters}
        onShowMobileFiltersChange={setShowMobileFilters}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        onQuickFilter={onQuickFilter}
        filterOptions={filterOptions}
      />
    );
  }

  return (
    <DesktopEquipmentFilters
      filters={filters}
      onFilterChange={onFilterChange}
      onClearFilters={onClearFilters}
      filterOptions={filterOptions}
    />
  );
}