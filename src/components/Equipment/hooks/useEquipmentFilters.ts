
import { useState, useMemo } from 'react';
import { Equipment } from '@/types';

export function useEquipmentFilters(equipment: Equipment[]) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique teams for filtering with error handling
  const teams = useMemo(() => {
    return [...new Set(equipment
      .filter(item => item?.team_name)
      .map(item => item?.team_name)
    )];
  }, [equipment]);

  // Apply filters with defensive programming
  const filteredEquipment = useMemo(() => {
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
      if (filterTeam === 'no-team') {
        // Special case for no team filter
        matchesTeam = item?.has_no_team || item?.team_id === null;
      } else if (filterTeam !== 'all') {
        matchesTeam = item?.team_name === filterTeam;
      }
      
      return matchesSearch && matchesStatus && matchesTeam;
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
