import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { FleetMap as FleetMapComponent } from '@/components/Equipment/FleetMap/FleetMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Map, Search, Filter, RefreshCw, Download, MapPin } from 'lucide-react';
import { Equipment } from '@/types';
import { useOrganization } from '@/contexts/OrganizationContext';
import { OrganizationSelector } from '@/components/Organization/OrganizationSelector';
import { getDisplayLocation } from '@/services/equipment/locationService';
import { useCombinedDashboardData } from '@/hooks/useCombinedDashboardData';
import { toast } from 'sonner';
import { Link, useSearchParams } from 'react-router-dom';
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center gap-2">
            <Map className="h-6 w-6" />
            <h1 className="text-2xl font-bold tracking-tight">Fleet Map</h1>
            <Badge variant="outline">
              {equipmentWithLocation.length} of {filteredEquipment.length} with location
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {showOrgSelector && (
              <OrganizationSelector
                organizations={organizations}
                selectedOrgId={selectedOrganization?.id}
                defaultOrgId={defaultOrganizationId}
                onChange={handleOrganizationChange}
                onSetDefault={handleSetDefaultOrg}
                showSetDefault={true}
                className="w-full sm:w-[250px]"
              />
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportData} disabled={equipmentWithLocation.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Equipment</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, manufacturer, model..."
                    value={filters.search}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Team</label>
                <select
                  value={filters.team}
                  onChange={(e) => setFilterTeam(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="all">All Teams</option>
                  <option value="">Unassigned</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Quick Actions</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="flex-1"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - keeping existing map and sidebar components */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Map */}
          <div className="xl:col-span-3">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="h-[600px] flex items-center justify-center">
                    <div className="text-center">
                      <Map className="h-8 w-8 mx-auto mb-2 animate-pulse text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Loading fleet map...</p>
                    </div>
                  </div>
                ) : filteredEquipment.length === 0 ? (
                  <div className="h-[600px] flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No Equipment Found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {equipment.length === 0 
                          ? "Add equipment to see their locations on the map"
                          : "Try adjusting your filters to see more equipment"
                        }
                      </p>
                      <Button asChild>
                        <Link to="/equipment/new">Add Equipment</Link>
                      </Button>
                    </div>
                  </div>
                ) : equipmentWithLocation.length === 0 ? (
                  <div className="h-[600px] flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No Location Data</h3>
                      <p className="text-sm text-muted-foreground">
                        Equipment locations will appear here when they are scanned with GPS enabled
                      </p>
                    </div>
                  </div>
                ) : (
                  <FleetMapComponent
                    equipment={filteredEquipment}
                    height="600px"
                    selectedEquipmentId={selectedEquipmentId}
                    onEquipmentSelected={setSelectedEquipmentId}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Equipment Details Sidebar */}
          <div className="xl:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Equipment Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedEquipment ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-base mb-2">{selectedEquipment.name}</h3>
                      <Badge variant="outline">{selectedEquipment.status}</Badge>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium">Team:</span>
                        <p className="text-muted-foreground">{selectedEquipment.team_name || 'Unassigned'}</p>
                      </div>
                      
                      {selectedEquipment.manufacturer && (
                        <div>
                          <span className="font-medium">Manufacturer:</span>
                          <p className="text-muted-foreground">{selectedEquipment.manufacturer}</p>
                        </div>
                      )}
                      
                      {selectedEquipment.model && (
                        <div>
                          <span className="font-medium">Model:</span>
                          <p className="text-muted-foreground">{selectedEquipment.model}</p>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium">Location:</span>
                        <p className="text-muted-foreground">
                          {(() => {
                            const location = getDisplayLocation(selectedEquipment);
                            return location.displayText;
                          })()}
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <Button asChild className="w-full" size="sm">
                      <Link to={`/equipment/${selectedEquipment.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click on a map marker to view equipment details
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FleetMapPage;
