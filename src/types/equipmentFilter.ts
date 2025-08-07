export interface Team {
  id: string;
  name: string;
}

export interface FilterOptions {
  manufacturers: string[];
  locations: string[];
  teams: Team[];
}

export interface EquipmentFiltersComponentProps {
  filters: any; // Will be properly typed from useEquipmentFiltering hook
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  onQuickFilter: (preset: string) => void;
  filterOptions: FilterOptions;
  hasActiveFilters: boolean;
}

export interface MobileFiltersProps extends EquipmentFiltersComponentProps {
  activeFilterCount: number;
  showMobileFilters: boolean;
  onShowMobileFiltersChange: (show: boolean) => void;
}