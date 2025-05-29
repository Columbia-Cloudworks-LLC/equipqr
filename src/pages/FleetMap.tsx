
import { useState } from 'react';
import { useEquipment } from '@/hooks/equipment/useEquipmentQuery';
import { useEquipmentFilters } from '@/components/Equipment/hooks/useEquipmentFilters';
import { FleetMapHeader } from '@/components/FleetMap/FleetMapHeader';
import { FleetMapFilters } from '@/components/FleetMap/FleetMapFilters';
import { FleetMapContent } from '@/components/FleetMap/FleetMapContent';
import { FeaturePaywall } from '@/components/Billing/FeaturePaywall';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin } from 'lucide-react';

export default function FleetMap() {
  const { selectedOrganization } = useOrganization();
  const { hasAccess, isLoading: accessLoading, userRole } = useFeatureAccess('fleet_map');
  
  const { data: equipment = [], isLoading: equipmentLoading } = useEquipment(
    selectedOrganization?.id,
    { enabled: !!selectedOrganization && hasAccess }
  );
  
  const {
    filteredEquipment,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    teamFilter,
    setTeamFilter,
    organizationFilter,
    setOrganizationFilter
  } = useEquipmentFilters(equipment);

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const selectedEquipment = filteredEquipment.find(eq => eq.id === selectedEquipmentId) || null;

  // Show loading state while checking access
  if (accessLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Show paywall if user doesn't have access to fleet map
  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <FleetMapHeader />
        </div>
        <FeaturePaywall
          featureKey="fleet_map"
          featureName="Fleet Map"
          description="Get a bird's-eye view of your entire fleet with our interactive map feature"
          benefits={[
            "Interactive map showing all equipment locations",
            "Real-time location updates when equipment is scanned",
            "Filter equipment by status, team, and organization",
            "Detailed equipment information in popup windows",
            "Export location data for reporting"
          ]}
          icon={<MapPin className="h-8 w-8 text-blue-600" />}
          userRole={userRole}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <FleetMapHeader />
      
      <FleetMapFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        teamFilter={teamFilter}
        onTeamChange={setTeamFilter}
        organizationFilter={organizationFilter}
        onOrganizationChange={setOrganizationFilter}
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
  );
}
