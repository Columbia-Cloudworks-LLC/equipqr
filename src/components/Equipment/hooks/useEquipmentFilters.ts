
import { useState, useMemo } from 'react';
import { Equipment } from '@/types';
import { DataConfig } from '@/config/app';

export function useEquipmentFilters(equipment: Equipment[]) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique teams
  const teams = useMemo(() => {
    if (!Array.isArray(equipment)) {
      return [];
    }
    
    return [...new Set(equipment
      .filter(item => item?.team_name)
      .map(item => item?.team_name)
    )];
  }, [equipment]);

  // Equipment analysis for debugging
  const equipmentAnalysis = useMemo(() => {
    if (!Array.isArray(equipment)) {
      return { total: 0, withTeam: 0, noTeam: 0, teamBreakdown: {} };
    }
    
    const withTeam = equipment.filter(item => item?.team_name).length;
    const noTeam = equipment.filter(item => !item?.team_name).length;
    
    const teamBreakdown = equipment.reduce((acc, item) => {
      const teamName = item?.team_name || 'No Team';
      acc[teamName] = (acc[teamName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: equipment.length,
      withTeam,
      noTeam,
      teamBreakdown,
      maxAttributes: DataConfig.equipment.maxAttributesPerItem
    };
  }, [equipment]);

  // Apply filters with enhanced search capabilities
  const filteredEquipment = useMemo(() => {
    if (!Array.isArray(equipment)) {
      return [];
    }
    
    return equipment.filter((item) => {
      if (!item) return false;
      
      // Enhanced search filter with multiple fields
      const itemName = (item?.name || '').toLowerCase();
      const itemModel = (item?.model || '').toLowerCase();
      const itemSerial = (item?.serial_number || '').toLowerCase();
      const itemManufacturer = (item?.manufacturer || '').toLowerCase();
      const itemLocation = (item?.location || '').toLowerCase();
      const searchLower = searchQuery.toLowerCase();
      
      const matchesSearch = !searchQuery || 
        itemName.includes(searchLower) ||
        itemModel.includes(searchLower) ||
        itemSerial.includes(searchLower) ||
        itemManufacturer.includes(searchLower) ||
        itemLocation.includes(searchLower);
        
      // Status filter
      const matchesStatus = filterStatus === 'all' || item?.status === filterStatus;
      
      // Team filter
      let matchesTeam = true;
      
      if (filterTeam === 'no-team') {
        matchesTeam = !item?.team_name;
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
    filteredEquipment,
    equipmentCounts: equipmentAnalysis
  };
}
