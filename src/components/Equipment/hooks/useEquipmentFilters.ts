
import { useState, useMemo } from 'react';
import { Equipment } from '@/types';

export function useEquipmentFilters(equipment: Equipment[]) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Log equipment data for debugging
  console.log('Equipment data in filters:', equipment);

  // Extract unique teams for filtering with error handling
  const teams = useMemo(() => {
    return [...new Set(equipment
      .filter(item => item?.team_name)
      .map(item => item?.team_name)
    )];
  }, [equipment]);

  // Apply filters with defensive programming
  const filteredEquipment = useMemo(() => {
    console.log('Applying filters - Status:', filterStatus, 'Team:', filterTeam, 'Search:', searchQuery);
    
    return equipment.filter((item) => {
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
      
      // Special handling for No Team filter with more detailed logging
      if (filterTeam === 'no-team') {
        const hasNoTeamFlag = Boolean(item?.has_no_team);
        const nullTeamId = item?.team_id === null;
        
        console.log(`Item "${item.name}" - has_no_team: ${hasNoTeamFlag}, team_id: ${item.team_id}, nullTeamId: ${nullTeamId}`);
        
        // Match if either has_no_team is true OR team_id is null
        matchesTeam = hasNoTeamFlag || nullTeamId;
      } else if (filterTeam !== 'all') {
        matchesTeam = item?.team_name === filterTeam;
      }
      
      const matches = matchesSearch && matchesStatus && matchesTeam;
      
      // Log matching status for debugging
      if (filterTeam === 'no-team' || filterStatus !== 'all') {
        console.log(`Item "${item.name}" matching status: ${matches} (search: ${matchesSearch}, status: ${matchesStatus}, team: ${matchesTeam})`);
      }
      
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
    filteredEquipment
  };
}
