
import { useState, useEffect } from 'react';
import { FleetMapFilters } from '@/components/FleetMap/FleetMapFilters';
import { FleetMapContent } from '@/components/FleetMap/FleetMapContent';
import { FeaturePaywall } from '@/components/Billing/FeaturePaywall';
import { GracePeriodBanner } from '@/components/Billing/GracePeriodBanner';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useEquipmentFilters } from '@/components/Equipment/hooks/useEquipmentFilters';
import { Layout } from '@/components/Layout/Layout';

export default function FleetMap() {
  const { selectedOrganization } = useOrganization();
  const { hasAccess, isLoading: accessLoading } = useFeatureAccess('fleet_map');
  
  console.log('FleetMap page - Selected organization:', selectedOrganization?.id);
  console.log('FleetMap page - Has access:', hasAccess, 'Loading access:', accessLoading);
  
  // Fetch equipment data directly for fleet map with enhanced logging
  const { data: equipment = [], isLoading: equipmentLoading, error: equipmentError } = useQuery({
    queryKey: ['fleet-equipment', selectedOrganization?.id],
    queryFn: async () => {
      if (!selectedOrganization?.id) {
        console.log('FleetMap - No organization selected, returning empty array');
        return [];
      }
      
      console.log('FleetMap - Fetching equipment for org:', selectedOrganization.id);
      
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          team:team_id (name),
          org:org_id (name)
        `)
        .eq('org_id', selectedOrganization.id)
        .is('deleted_at', null);

      if (error) {
        console.error('FleetMap - Equipment fetch error:', error);
        throw error;
      }

      const processedData = data?.map(item => ({
        ...item,
        team_name: item.team?.name || null,
        org_name: item.org?.name || 'Unknown Organization'
      })) || [];

      console.log('FleetMap - Fetched equipment data:', {
        count: processedData.length,
        withTeams: processedData.filter(item => item.team_name).length,
        withoutTeams: processedData.filter(item => !item.team_name).length
      });

      return processedData;
    },
    enabled: !!selectedOrganization && hasAccess,
    retry: 3,
    retryDelay: 1000
  });
  
  const {
    filteredEquipment,
    filterStatus,
    setFilterStatus,
    filterTeam,
    setFilterTeam,
    searchQuery,
    setSearchQuery,
    teams,
    equipmentCounts
  } = useEquipmentFilters(equipment);

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const selectedEquipment = filteredEquipment.find(eq => eq.id === selectedEquipmentId) || null;

  // Log equipment loading and error states
  useEffect(() => {
    if (equipmentLoading) {
      console.log('FleetMap - Equipment loading...');
    } else if (equipmentError) {
      console.error('FleetMap - Equipment error:', equipmentError);
    } else if (equipment) {
      console.log('FleetMap - Equipment loaded successfully:', equipment.length, 'items');
    }
  }, [equipmentLoading, equipmentError, equipment]);

  // Log filter changes
  useEffect(() => {
    console.log('FleetMap - Filter state changed:', {
      status: filterStatus,
      team: filterTeam,
      search: searchQuery,
      resultCount: filteredEquipment.length,
      totalCount: equipment.length
    });
  }, [filterStatus, filterTeam, searchQuery, filteredEquipment.length, equipment.length]);

  // Show loading state while checking access
  if (accessLoading) {
    console.log('FleetMap - Showing access loading state');
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  const handleClearFilters = () => {
    console.log('FleetMap - Clearing all filters');
    setFilterStatus('all');
    setFilterTeam('all');
    setSearchQuery('');
  };

  // Enhanced error display
  if (equipmentError) {
    console.error('FleetMap - Rendering error state:', equipmentError);
    return (
      <Layout>
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Fleet Map</h1>
            <p className="text-muted-foreground">View all equipment locations on an interactive map</p>
          </div>
          
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Error Loading Equipment</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {equipmentError instanceof Error ? equipmentError.message : 'Failed to load equipment data'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <FeaturePaywall
        featureKey="fleet_map"
        featureName="Fleet Map"
      >
        <div className="space-y-6">
          <GracePeriodBanner />
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Fleet Map</h1>
            <p className="text-muted-foreground">
              View all equipment locations on an interactive map
              {equipmentCounts.total > 0 && (
                <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                  {filteredEquipment.length} of {equipmentCounts.total} items
                </span>
              )}
            </p>
          </div>
          
          <FleetMapFilters
            filters={{
              search: searchQuery,
              status: filterStatus,
              team: filterTeam
            }}
            teams={teams.map(name => ({ id: name, name }))}
            onFilterSearchChange={setSearchQuery}
            onFilterStatusChange={setFilterStatus}
            onFilterTeamChange={setFilterTeam}
            onClearFilters={handleClearFilters}
          />

          <FleetMapContent
            isLoading={equipmentLoading}
            filteredEquipment={filteredEquipment}
            equipmentWithLocation={filteredEquipment}
            selectedEquipmentId={selectedEquipmentId}
            onEquipmentSelected={setSelectedEquipmentId}
            selectedEquipment={selectedEquipment}
          />
          
          {/* Debug information (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-muted rounded-lg text-xs">
              <div className="font-medium mb-2">Debug Information:</div>
              <div>Total Equipment: {equipmentCounts.total}</div>
              <div>Filtered Equipment: {filteredEquipment.length}</div>
              <div>With Teams: {equipmentCounts.withTeam}</div>
              <div>Without Teams: {equipmentCounts.noTeam}</div>
              <div>Available Teams: {teams.join(', ') || 'None'}</div>
              <div>Current Filters: Status={filterStatus}, Team={filterTeam}, Search="{searchQuery}"</div>
            </div>
          )}
        </div>
      </FeaturePaywall>
    </Layout>
  );
}
