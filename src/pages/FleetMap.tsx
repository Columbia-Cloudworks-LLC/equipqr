import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { FleetMapHeader } from '@/components/FleetMap/FleetMapHeader';
import { FleetMapFilters } from '@/components/FleetMap/FleetMapFilters';
import { FleetMapContent } from '@/components/FleetMap/FleetMapContent';
import { Equipment } from '@/types';
import { useOrganization } from '@/contexts/OrganizationContext';
import { getDisplayLocation } from '@/services/equipment/locationService';
import { useCombinedDashboardData } from '@/hooks/useCombinedDashboardData';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { usePersistedFilters } from '@/hooks/usePersistedFilters';

const FleetMapPage = () => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  
  const { 
    organizations, 
    selectedOrganization, 
    selectOrganization, 
    defaultOrganizationId,
    setDefaultOrganization,
    isLoading: isOrgLoading
  } = useOrganization();
  
  // Use persisted filters for the fleet map
  const { 
    filters, 
    setFilterStatus, 
    setFilterTeam, 
    setFilterSearch,
    setFilterOrganization,
    clearFilters 
  } = usePersistedFilters('fleet-map-filters');
  
  const { 
    equipment,
    teams,
    isEquipmentLoading,
    isOrgReady,
    refetchDashboard
  } = useCombinedDashboardData(selectedOrganization?.id);

  // Initialize organization from URL parameter or filters
  useEffect(() => {
    const urlOrgId = searchParams.get('org');
    
    if (urlOrgId && organizations.length > 0) {
      // URL parameter takes precedence
      const org = organizations.find(o => o.id === urlOrgId);
      if (org && (!selectedOrganization || selectedOrganization.id !== urlOrgId)) {
        selectOrganization(urlOrgId);
        setFilterOrganization(urlOrgId);
      }
    } else if (filters.organization && organizations.length > 0 && !urlOrgId) {
      // Fall back to persisted filter if no URL parameter
      const org = organizations.find(o => o.id === filters.organization);
      if (org && (!selectedOrganization || selectedOrganization.id !== filters.organization)) {
        selectOrganization(filters.organization);
      }
    } else if (selectedOrganization && !filters.organization && !urlOrgId) {
      // Update filters with current selected organization if no URL or filter
      setFilterOrganization(selectedOrganization.id);
    }
  }, [searchParams, filters.organization, organizations, selectedOrganization, selectOrganization, setFilterOrganization]);

  // Filter equipment based on search and filters
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         item.manufacturer?.toLowerCase().includes(filters.search.toLowerCase()) ||
                         item.model?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || item.status.toLowerCase() === filters.status.toLowerCase();
    const matchesTeam = filters.team === 'all' || item.team_id === filters.team;
    
    return matchesSearch && matchesStatus && matchesTeam;
  });

  // Get equipment with location data
  const equipmentWithLocation = filteredEquipment.filter(item => {
    const location = getDisplayLocation(item);
    return location.hasLocation && location.coordinates;
  });

  // Handle organization change with full page reload
  const handleOrganizationChange = (orgId: string) => {
    if (orgId === selectedOrganization?.id) {
      return; // No change needed
    }
    
    // Create new URL with organization parameter
    const currentParams = new URLSearchParams(window.location.search);
    const newParams = new URLSearchParams();
    
    // Keep existing non-organization filters
    if (currentParams.get('status') && currentParams.get('status') !== 'all') {
      newParams.set('status', currentParams.get('status')!);
    }
    if (currentParams.get('team') && currentParams.get('team') !== 'all') {
      newParams.set('team', currentParams.get('team')!);
    }
    if (currentParams.get('search')) {
      newParams.set('search', currentParams.get('search')!);
    }
    
    // Set the new organization
    newParams.set('org', orgId);
    
    // Navigate with full page reload
    const newUrl = `/fleet-map?${newParams.toString()}`;
    window.location.href = newUrl;
  };

  const handleSetDefaultOrg = async (orgId: string) => {
    const success = await setDefaultOrganization(orgId);
    if (success) {
      toast.success('Default organization updated');
    }
    return success;
  };

  const handleRefresh = () => {
    refetchDashboard();
    toast.success('Fleet data refreshed');
  };

  const handleExportData = () => {
    const exportData = equipmentWithLocation.map(item => {
      const location = getDisplayLocation(item);
      return {
        name: item.name,
        status: item.status,
        team: item.team_name || 'Unassigned',
        manufacturer: item.manufacturer || '',
        model: item.model || '',
        latitude: location.coordinates?.lat || '',
        longitude: location.coordinates?.lng || '',
        location_source: location.source,
        last_updated: location.timestamp || item.updated_at
      };
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Status,Team,Manufacturer,Model,Latitude,Longitude,Location Source,Last Updated\n"
      + exportData.map(row => 
          `"${row.name}","${row.status}","${row.team}","${row.manufacturer}","${row.model}",${row.latitude},${row.longitude},"${row.location_source}","${row.last_updated}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fleet-map-data-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Fleet data exported successfully');
  };

  const selectedEquipment = selectedEquipmentId 
    ? filteredEquipment.find(eq => eq.id === selectedEquipmentId)
    : null;

  const isLoading = isOrgLoading || isEquipmentLoading || !isOrgReady;
  const showOrgSelector = organizations.length > 1;

  return (
    <Layout>
      <div className="space-y-4">
        <FleetMapHeader
          equipmentWithLocationCount={equipmentWithLocation.length}
          totalEquipmentCount={filteredEquipment.length}
          showOrgSelector={showOrgSelector}
          organizations={organizations}
          selectedOrgId={selectedOrganization?.id}
          defaultOrgId={defaultOrganizationId}
          onOrganizationChange={handleOrganizationChange}
          onSetDefaultOrg={handleSetDefaultOrg}
          onRefresh={handleRefresh}
          onExportData={handleExportData}
          canExport={equipmentWithLocation.length > 0}
        />

        <FleetMapFilters
          filters={filters}
          teams={teams}
          onFilterStatusChange={setFilterStatus}
          onFilterTeamChange={setFilterTeam}
          onFilterSearchChange={setFilterSearch}
          onClearFilters={clearFilters}
        />

        <FleetMapContent
          isLoading={isLoading}
          filteredEquipment={filteredEquipment}
          equipmentWithLocation={equipmentWithLocation}
          selectedEquipmentId={selectedEquipmentId}
          onEquipmentSelected={setSelectedEquipmentId}
          selectedEquipment={selectedEquipment}
        />
      </div>
    </Layout>
  );
};

export default FleetMapPage;
