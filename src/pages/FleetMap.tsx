
import { useState } from 'react';
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
  
  // Fetch equipment data directly for fleet map
  const { data: equipment = [], isLoading: equipmentLoading } = useQuery({
    queryKey: ['fleet-equipment', selectedOrganization?.id],
    queryFn: async () => {
      if (!selectedOrganization?.id) return [];
      
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          team:team_id (name),
          org:org_id (name)
        `)
        .eq('org_id', selectedOrganization.id)
        .is('deleted_at', null);

      if (error) throw error;

      return data?.map(item => ({
        ...item,
        team_name: item.team?.name || null,
        org_name: item.org?.name || 'Unknown Organization'
      })) || [];
    },
    enabled: !!selectedOrganization && hasAccess
  });
  
  const {
    filteredEquipment,
    filterStatus,
    setFilterStatus,
    filterTeam,
    setFilterTeam,
    searchQuery,
    setSearchQuery,
    teams
  } = useEquipmentFilters(equipment);

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const selectedEquipment = filteredEquipment.find(eq => eq.id === selectedEquipmentId) || null;

  // Show loading state while checking access
  if (accessLoading) {
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
    setFilterStatus('all');
    setFilterTeam('all');
    setSearchQuery('');
  };

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
            <p className="text-muted-foreground">View all equipment locations on an interactive map</p>
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
        </div>
      </FeaturePaywall>
    </Layout>
  );
}
