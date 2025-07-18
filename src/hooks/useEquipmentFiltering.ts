import { useState, useMemo } from 'react';
import { useEquipmentByOrganization, useTeamsByOrganization } from '@/hooks/useSupabaseData';
import { usePermissions } from '@/hooks/usePermissions';

export interface EquipmentFilters {
  search: string;
  status: string;
  manufacturer: string;
  location: string;
  team: string;
  maintenanceDateFrom: string;
  maintenanceDateTo: string;
  installationDateFrom: string;
  installationDateTo: string;
  warrantyExpiring: boolean;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

const initialFilters: EquipmentFilters = {
  search: '',
  status: 'all',
  manufacturer: 'all',
  location: 'all',
  team: 'all',
  maintenanceDateFrom: '',
  maintenanceDateTo: '',
  installationDateFrom: '',
  installationDateTo: '',
  warrantyExpiring: false
};

const initialSort: SortConfig = {
  field: 'name',
  direction: 'asc'
};

export const useEquipmentFiltering = () => {
  const [filters, setFilters] = useState<EquipmentFilters>(initialFilters);
  const [sortConfig, setSortConfig] = useState<SortConfig>(initialSort);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Get equipment data - now filtered by RLS policies based on team membership
  const { data: equipment = [], isLoading } = useEquipmentByOrganization();
  const { data: teams = [] } = useTeamsByOrganization();
  const { canManageOrganization } = usePermissions();

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const manufacturers = [...new Set(equipment.map(item => item.manufacturer))].sort();
    const locations = [...new Set(equipment.map(item => item.location))].sort();
    
    return {
      manufacturers,
      locations,
      teams: teams.map(team => ({ id: team.id, name: team.name }))
    };
  }, [equipment, teams]);

  // Filter and sort equipment
  const filteredAndSortedEquipment = useMemo(() => {
    let filtered = equipment.filter(item => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchMatch = 
          item.name.toLowerCase().includes(searchLower) ||
          item.manufacturer.toLowerCase().includes(searchLower) ||
          item.model.toLowerCase().includes(searchLower) ||
          item.serial_number.toLowerCase().includes(searchLower) ||
          item.location.toLowerCase().includes(searchLower);
        
        if (!searchMatch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }

      // Manufacturer filter
      if (filters.manufacturer !== 'all' && item.manufacturer !== filters.manufacturer) {
        return false;
      }

      // Location filter
      if (filters.location !== 'all' && item.location !== filters.location) {
        return false;
      }

      // Team filter
      if (filters.team !== 'all') {
        if (filters.team === 'unassigned' && item.team_id) {
          return false;
        }
        if (filters.team !== 'unassigned' && item.team_id !== filters.team) {
          return false;
        }
      }

      // Maintenance date range filter
      if (filters.maintenanceDateFrom || filters.maintenanceDateTo) {
        if (!item.last_maintenance) return false;
        
        const maintenanceDate = new Date(item.last_maintenance);
        
        if (filters.maintenanceDateFrom) {
          const fromDate = new Date(filters.maintenanceDateFrom);
          if (maintenanceDate < fromDate) return false;
        }
        
        if (filters.maintenanceDateTo) {
          const toDate = new Date(filters.maintenanceDateTo);
          if (maintenanceDate > toDate) return false;
        }
      }

      // Installation date range filter
      if (filters.installationDateFrom || filters.installationDateTo) {
        const installationDate = new Date(item.installation_date);
        
        if (filters.installationDateFrom) {
          const fromDate = new Date(filters.installationDateFrom);
          if (installationDate < fromDate) return false;
        }
        
        if (filters.installationDateTo) {
          const toDate = new Date(filters.installationDateTo);
          if (installationDate > toDate) return false;
        }
      }

      // Warranty expiring filter
      if (filters.warrantyExpiring) {
        if (!item.warranty_expiration) return false;
        
        const warrantyDate = new Date(item.warranty_expiration);
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        if (warrantyDate > thirtyDaysFromNow) return false;
      }

      return true;
    });

    // Sort equipment
    filtered.sort((a, b) => {
      let aValue: any = a[sortConfig.field as keyof typeof a];
      let bValue: any = b[sortConfig.field as keyof typeof b];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

      // Handle date fields
      if (['installation_date', 'last_maintenance', 'warranty_expiration', 'created_at', 'updated_at'].includes(sortConfig.field)) {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [equipment, filters, sortConfig]);

  // Quick filter presets
  const applyQuickFilter = (type: string) => {
    switch (type) {
      case 'maintenance-due':
        setFilters(prev => ({
          ...prev,
          status: 'maintenance'
        }));
        break;
      case 'warranty-expiring':
        setFilters(prev => ({
          ...prev,
          warrantyExpiring: true
        }));
        break;
      case 'recently-added':
        setSortConfig({
          field: 'created_at',
          direction: 'desc'
        });
        break;
      case 'active-only':
        setFilters(prev => ({
          ...prev,
          status: 'active'
        }));
        break;
    }
  };

  const updateFilter = (key: keyof EquipmentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setSortConfig(initialSort);
  };

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'search' || key === 'maintenanceDateFrom' || key === 'maintenanceDateTo' || 
          key === 'installationDateFrom' || key === 'installationDateTo') {
        return value !== '';
      }
      if (key === 'warrantyExpiring') {
        return value === true;
      }
      return value !== 'all';
    });
  }, [filters]);

  return {
    filters,
    sortConfig,
    showAdvancedFilters,
    filteredAndSortedEquipment,
    filterOptions,
    isLoading,
    hasActiveFilters,
    equipment, // Return raw equipment data
    updateFilter,
    updateSort,
    clearFilters,
    applyQuickFilter,
    setShowAdvancedFilters
  };
};