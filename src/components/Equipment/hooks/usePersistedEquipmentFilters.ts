
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
  
  // Override with passed filters if provided
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

  // Extract unique teams for filtering
  const teams = useMemo(() => {
    if (!Array.isArray(equipment)) {
      return [];
    }
    
    return [...new Set(equipment
      .filter(item => item?.team_name)
      .map(item => item?.team_name)
    )];
  }, [equipment]);

  // Count items by team status
  const itemCounts = useMemo(() => {
    if (!Array.isArray(equipment)) return { total: 0, withTeam: 0, noTeam: 0 };
    
    const withTeam = equipment.filter(item => item?.team_id !== null).length;
    const noTeam = equipment.filter(item => item?.team_id === null).length;
    
    return { total: equipment.length, withTeam, noTeam };
  }, [equipment]);

  // Apply filters
  const filteredEquipment = useMemo(() => {
    if (!Array.isArray(equipment)) {
      return [];
    }
    
    return equipment.filter((item) => {
      if (!item) return false;
      
      // Safe string comparisons
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
      
      if (localTeam === 'no-team') {
        const hasNoTeamFlag = Boolean(item?.has_no_team);
        const nullTeamId = item?.team_id === null;
        matchesTeam = hasNoTeamFlag || nullTeamId;
      } else if (localTeam !== 'all') {
        matchesTeam = item?.team_name === localTeam;
      }
      
      return matchesSearch && matchesStatus && matchesTeam;
    });
  }, [equipment, localSearch, localStatus, localTeam]);

  // Update functions
  const updateStatus = (status: string) => {
    setLocalStatus(status);
    if (!persistedFilters) {
      setFilterStatus(status);
    }
  };

  const updateTeam = (team: string) => {
    setLocalTeam(team);
    if (!persistedFilters) {
      setFilterTeam(team);
    }
  };

  const updateSearch = (search: string) => {
    setLocalSearch(search);
    if (!persistedFilters) {
      setFilterSearch(search);
    }
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
