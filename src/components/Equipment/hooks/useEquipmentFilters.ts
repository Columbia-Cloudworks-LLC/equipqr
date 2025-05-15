
import { useState, useMemo } from 'react';
import { Equipment } from '@/types';

export function useEquipmentFilters(equipment: Equipment[]) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Log equipment data for debugging
  console.log('useEquipmentFilters received equipment count:', equipment?.length || 0);

  // Extract unique teams for filtering with error handling
  const teams = useMemo(() => {
    if (!Array.isArray(equipment)) {
      console.warn('useEquipmentFilters received invalid equipment data:', equipment);
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
    console.log('Applying filters - Status:', filterStatus, 'Team:', filterTeam, 'Search:', searchQuery);
    
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
      const searchLower = searchQuery.toLowerCase();
      
      const matchesSearch = 
        itemName.includes(searchLower) ||
        itemModel.includes(searchLower) ||
        itemSerial.includes(searchLower);
        
      const matchesStatus = filterStatus === 'all' || item?.status === filterStatus;
      
      let matchesTeam = true;
      
      // Enhanced logic for "No Team" filter
      if (filterTeam === 'no-team') {
        // Consider an item to be "no team" if either has_no_team is true OR team_id is null
        const hasNoTeamFlag = Boolean(item?.has_no_team);
        const nullTeamId = item?.team_id === null;
        
        // Log details for debugging when filtering for "No Team" items
        console.log(`"No Team" filter - Item "${item.name}" - has_no_team: ${hasNoTeamFlag}, team_id: ${item.team_id === null ? 'null' : item.team_id}`);
        
        matchesTeam = hasNoTeamFlag || nullTeamId;
      } else if (filterTeam !== 'all') {
        // For specific team filtering
        matchesTeam = item?.team_name === filterTeam;
      }
      
      const matches = matchesSearch && matchesStatus && matchesTeam;
      
      return matches;
    });
  }, [equipment, searchQuery, filterStatus, filterTeam]);

  return {
    filterStatus,
    setFilterStatus,
    filterTeam,
    setFilterTeam,
    searchQuery,
    setSearchQuery,
    teams,
    filteredEquipment,
    equipmentCounts: itemCounts
  };
}
