
import { useState, useMemo, useEffect } from 'react';
import { Equipment } from '@/types';
import { usePersistedFilters } from '@/hooks/usePersistedFilters';

interface PersistedFilters {
  status: string;
  team: string;
  search: string;
  organization?: string;
}

export function usePersistedEquipmentFilters(equipment: Equipment[], persistedFilters?: PersistedFilters) {
  // Use the persisted filters hook for state management
  const { 
    filters, 
    setFilterStatus, 
    setFilterTeam, 
    setFilterSearch 
  } = usePersistedFilters('equipment-filters');
  
  // Override with passed filters if provided (from parent component)
  const activeFilters = persistedFilters || filters;
  
  // Local state for immediate UI updates
  const [localStatus, setLocalStatus] = useState(activeFilters.status);
  const [localTeam, setLocalTeam] = useState(activeFilters.team);
  const [localSearch, setLocalSearch] = useState(activeFilters.search);

  // Sync local state with persisted filters when they change
  useEffect(() => {
    setLocalStatus(activeFilters.status);
    setLocalTeam(activeFilters.team);
    setLocalSearch(activeFilters.search);
  }, [activeFilters.status, activeFilters.team, activeFilters.search]);

  // Log equipment data for debugging
  console.log('usePersistedEquipmentFilters received equipment count:', equipment?.length || 0);

  // Extract unique teams for filtering with error handling
  const teams = useMemo(() => {
    if (!Array.isArray(equipment)) {
      console.warn('usePersistedEquipmentFilters received invalid equipment data:', equipment);
      return [];
    }
    
    return [...new Set(equipment
      .filter(item => item?.team_name)
      .map(item => item?.team_name)
    )];
  }, [equipment]);

  // Count items by team status for debugging
  const itemCounts = useMemo(() => {
    if (!Array.isArray(equipment)) return { total: 0, withTeam: 0, noTeam: 0 };
    
    const withTeam = equipment.filter(item => item?.team_id !== null).length;
    const noTeam = equipment.filter(item => item?.team_id === null).length;
    
    console.log(`Equipment counts - Total: ${equipment.length}, With Team: ${withTeam}, No Team: ${noTeam}`);
    return { total: equipment.length, withTeam, noTeam };
  }, [equipment]);

  // Apply filters with enhanced debugging and robustness
  const filteredEquipment = useMemo(() => {
    console.log('Applying filters - Status:', localStatus, 'Team:', localTeam, 'Search:', localSearch);
    
    if (!Array.isArray(equipment)) {
      console.warn('Cannot filter equipment: equipment data is not an array');
      return [];
    }
    
    return equipment.filter((item) => {
      if (!item) {
        console.warn('Encountered null item while filtering equipment');
        return false;
      }
      
      // Safe string comparisons - protect against undefined values
      const itemName = (item?.name || '').toLowerCase();
      const itemModel = (item?.model || '').toLowerCase();
      const itemSerial = (item?.serial_number || '').toLowerCase();
      const searchLower = localSearch.toLowerCase();
      
      const matchesSearch = 
        itemName.includes(searchLower) ||
        itemModel.includes(searchLower) ||
        itemSerial.includes(searchLower);
        
      const matchesStatus = localStatus === 'all' || item?.status === localStatus;
      
      let matchesTeam = true;
      
      // Enhanced logic for "No Team" filter
      if (localTeam === 'no-team') {
        // Consider an item to be "no team" if either has_no_team is true OR team_id is null
        const hasNoTeamFlag = Boolean(item?.has_no_team);
        const nullTeamId = item?.team_id === null;
        
        // Log details for debugging when filtering for "No Team" items
        console.log(`"No Team" filter - Item "${item.name}" - has_no_team: ${hasNoTeamFlag}, team_id: ${item.team_id === null ? 'null' : item.team_id}`);
        
        matchesTeam = hasNoTeamFlag || nullTeamId;
      } else if (localTeam !== 'all') {
        // For specific team filtering
        matchesTeam = item?.team_name === localTeam;
      }
      
      const matches = matchesSearch && matchesStatus && matchesTeam;
      
      return matches;
    });
  }, [equipment, localSearch, localStatus, localTeam]);

  // Debounced update functions to persist changes
  const updateStatus = (status: string) => {
    setLocalStatus(status);
    if (persistedFilters) {
      // If using passed filters, don't persist automatically
      return;
    }
    setFilterStatus(status);
  };

  const updateTeam = (team: string) => {
    setLocalTeam(team);
    if (persistedFilters) {
      // If using passed filters, don't persist automatically
      return;
    }
    setFilterTeam(team);
  };

  const updateSearch = (search: string) => {
    setLocalSearch(search);
    if (persistedFilters) {
      // If using passed filters, don't persist automatically
      return;
    }
    setFilterSearch(search);
  };

  return {
    filterStatus: localStatus,
    setFilterStatus: updateStatus,
    filterTeam: localTeam,
    setFilterTeam: updateTeam,
    searchQuery: localSearch,
    setSearchQuery: updateSearch,
    teams,
    filteredEquipment,
    equipmentCounts: itemCounts
  };
}
