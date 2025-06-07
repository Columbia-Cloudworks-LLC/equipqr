
import { useState, useMemo } from 'react';
import { Equipment } from '@/types';

export function useEquipmentFilters(equipment: Equipment[]) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Enhanced logging for debugging
  console.log('useEquipmentFilters - Input equipment count:', equipment?.length || 0);
  console.log('useEquipmentFilters - Current filters:', { filterStatus, filterTeam, searchQuery });

  // Extract unique teams with enhanced error handling and logging
  const teams = useMemo(() => {
    if (!Array.isArray(equipment)) {
      console.warn('useEquipmentFilters - Invalid equipment data (not array):', equipment);
      return [];
    }
    
    const uniqueTeams = [...new Set(equipment
      .filter(item => item?.team_name)
      .map(item => item?.team_name)
    )];
    
    console.log('useEquipmentFilters - Extracted unique teams:', uniqueTeams);
    return uniqueTeams;
  }, [equipment]);

  // Enhanced equipment analysis for debugging
  const equipmentAnalysis = useMemo(() => {
    if (!Array.isArray(equipment)) {
      return { total: 0, withTeam: 0, noTeam: 0, teamBreakdown: {} };
    }
    
    const withTeam = equipment.filter(item => item?.team_name).length;
    const noTeam = equipment.filter(item => !item?.team_name).length;
    
    // Create team breakdown
    const teamBreakdown = equipment.reduce((acc, item) => {
      const teamName = item?.team_name || 'No Team';
      acc[teamName] = (acc[teamName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const analysis = {
      total: equipment.length,
      withTeam,
      noTeam,
      teamBreakdown
    };
    
    console.log('useEquipmentFilters - Equipment analysis:', analysis);
    return analysis;
  }, [equipment]);

  // Enhanced filtering with comprehensive logging
  const filteredEquipment = useMemo(() => {
    console.log('useEquipmentFilters - Starting filter application...');
    
    if (!Array.isArray(equipment)) {
      console.warn('useEquipmentFilters - Cannot filter: equipment data is not an array');
      return [];
    }
    
    const filtered = equipment.filter((item, index) => {
      if (!item) {
        console.warn(`useEquipmentFilters - Null item at index ${index}`);
        return false;
      }
      
      // Search filter with safe string handling
      const itemName = (item?.name || '').toLowerCase();
      const itemModel = (item?.model || '').toLowerCase();
      const itemSerial = (item?.serial_number || '').toLowerCase();
      const itemManufacturer = (item?.manufacturer || '').toLowerCase();
      const searchLower = searchQuery.toLowerCase();
      
      const matchesSearch = !searchQuery || 
        itemName.includes(searchLower) ||
        itemModel.includes(searchLower) ||
        itemSerial.includes(searchLower) ||
        itemManufacturer.includes(searchLower);
        
      // Status filter
      const matchesStatus = filterStatus === 'all' || item?.status === filterStatus;
      
      // Enhanced team filter logic
      let matchesTeam = true;
      
      if (filterTeam === 'no-team') {
        // "No Team" means equipment without a team assignment
        const hasNoTeam = !item?.team_name;
        matchesTeam = hasNoTeam;
        
        if (searchQuery || filterStatus !== 'all') {
          // Only log for specific cases to avoid spam
          console.log(`useEquipmentFilters - "No Team" filter for "${item.name}": team_name="${item.team_name}", matches=${matchesTeam}`);
        }
      } else if (filterTeam !== 'all') {
        // Specific team filter - match by team name
        matchesTeam = item?.team_name === filterTeam;
        
        if (searchQuery || filterStatus !== 'all') {
          // Only log for specific cases to avoid spam
          console.log(`useEquipmentFilters - Team filter for "${item.name}": team_name="${item.team_name}", filterTeam="${filterTeam}", matches=${matchesTeam}`);
        }
      }
      
      const finalMatch = matchesSearch && matchesStatus && matchesTeam;
      
      // Log detailed filter results for first few items or when debugging specific cases
      if (index < 3 || (!finalMatch && (searchQuery || filterStatus !== 'all' || filterTeam !== 'all'))) {
        console.log(`useEquipmentFilters - Item "${item.name}" filter results:`, {
          search: { query: searchQuery, matches: matchesSearch },
          status: { filter: filterStatus, value: item?.status, matches: matchesStatus },
          team: { filter: filterTeam, value: item?.team_name, matches: matchesTeam },
          finalMatch
        });
      }
      
      return finalMatch;
    });

    console.log(`useEquipmentFilters - Filter results: ${filtered.length} out of ${equipment.length} items match`);
    
    // Log summary of filtered results by team
    const filteredTeamBreakdown = filtered.reduce((acc, item) => {
      const teamName = item?.team_name || 'No Team';
      acc[teamName] = (acc[teamName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('useEquipmentFilters - Filtered equipment team breakdown:', filteredTeamBreakdown);
    
    return filtered;
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
    equipmentCounts: equipmentAnalysis
  };
}
