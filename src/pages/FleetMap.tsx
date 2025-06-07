
import { useState } from 'react';
import { FleetMapFilters } from '@/components/FleetMap/FleetMapFilters';
import { FleetMapContent } from '@/components/FleetMap/FleetMapContent';
import { FeaturePaywall } from '@/components/Billing/FeaturePaywall';
import { GracePeriodBanner } from '@/components/Billing/GracePeriodBanner';
import { useEnhancedFeatureAccess } from '@/hooks/useEnhancedFeatureAccess';
import { useOrganization } from '@/contexts/OrganizationContext';
import { OrganizationTransitionLoader, OrganizationTransitionSkeleton } from '@/components/Organization/OrganizationTransitionLoader';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useEquipmentFilters } from '@/components/Equipment/hooks/useEquipmentFilters';
import { Layout } from '@/components/Layout/Layout';
import { useFeatureFlag } from '@/hooks/useAppConfig';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function FleetMap() {
  const { selectedOrganization, isReady: orgContextReady } = useOrganization();
  const fleetMapFeature = useFeatureFlag('fleetMap');
  const { 
    hasAccess, 
    isLoading: accessLoading, 
    isOrgTransitioning,
    error: accessError
  } = useEnhancedFeatureAccess('fleet_map');
  
  // Equipment query - only fetch if we have access
  const { data: equipment = [], isLoading: equipmentLoading, error: equipmentError } = useQuery({
    queryKey: ['fleet-equipment', selectedOrganization?.id],
    queryFn: async () => {
      if (!selectedOrganization?.id) {
        return [];
      }
      
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
        throw error;
      }

      return data?.map(item => ({
        ...item,
        team_name: item.team?.name || null,
        org_name: item.org?.name || 'Unknown Organization'
      })) || [];
    },
    enabled: !!selectedOrganization && hasAccess && orgContextReady && fleetMapFeature.enabled,
    retry: 3,
    retryDelay: 1000
  });
  
  // Equipment filters
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

  const handleClearFilters = () => {
    setFilterStatus('all');
    setFilterTeam('all');
    setSearchQuery('');
  };

  // Check if feature is enabled at the configuration level
  if (!fleetMapFeature.enabled) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Fleet Map</h1>
            <p className="text-muted-foreground">View all equipment locations on an interactive map</p>
          </div>
          
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              The Fleet Map feature is currently disabled. Please contact your administrator for more information.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }
  
  // Show organization transition loading state
  if (isOrgTransitioning || !orgContextReady) {
    return (
      <Layout>
        <OrganizationTransitionSkeleton />
      </Layout>
    );
  }
  
  // Show loading state while checking access
  if (accessLoading) {
    return (
      <Layout>
        <OrganizationTransitionLoader 
          message="Checking Fleet Map access..."
          showCard={false}
        />
      </Layout>
    );
  }

  // Show access error if there's an issue checking permissions
  if (accessError) {
    console.error('Fleet Map access error:', accessError);
    return (
      <Layout>
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Fleet Map</h1>
            <p className="text-muted-foreground">View all equipment locations on an interactive map</p>
          </div>
          
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              Error checking Fleet Map access. Please try refreshing the page or contact support if the issue persists.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  // If no access, show paywall with navigation preserved
  if (!hasAccess) {
    return (
      <Layout>
        <FeaturePaywall
          featureKey="fleet_map"
          featureName="Fleet Map"
        >
          <div /> {/* Empty div as children are required but not used when no access */}
        </FeaturePaywall>
      </Layout>
    );
  }

  // Equipment error state for authenticated users with access
  if (equipmentError) {
    return (
      <Layout>
        <div className="space-y-6">
          <GracePeriodBanner />
          
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

  // Main Fleet Map interface - user has access and navigation is preserved
  return (
    <Layout>
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
          selectedEquipmentId={selectedEquipmentId}
          onEquipmentSelected={setSelectedEquipmentId}
          selectedEquipment={selectedEquipment}
        />
      </div>
    </Layout>
  );
}
