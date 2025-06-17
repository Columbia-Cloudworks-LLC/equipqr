
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Shield, Wrench, Users } from 'lucide-react';
import { Equipment } from '@/services/dataService';
import { UserOrganization } from '@/types/organizationContext';
import { usePermissions } from '@/hooks/usePermissions';

interface EquipmentDetailsTabProps {
  equipment: Equipment;
  organization: UserOrganization;
}

const EquipmentDetailsTab: React.FC<EquipmentDetailsTabProps> = ({
  equipment,
  organization,
}) => {
  const { canViewEquipment } = usePermissions();
  const hasFleetMapFeature = organization.features.includes('Fleet Map');
  const hasLocation = equipment.lastKnownLocation;
  
  // Check if user can view this equipment based on team assignment
  const canView = canViewEquipment(equipment.id); // In real implementation, you'd pass the team_id

  if (!canView) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">
          You don't have permission to view this equipment. Contact your team manager or organization admin for access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Equipment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Manufacturer</div>
              <div className="text-lg">{equipment.manufacturer}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Model</div>
              <div className="text-lg">{equipment.model}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Serial Number</div>
              <div className="text-lg font-mono">{equipment.serialNumber}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <Badge variant="outline" className={
                equipment.status === 'active' ? 'border-green-200 text-green-800' :
                equipment.status === 'maintenance' ? 'border-yellow-200 text-yellow-800' :
                'border-red-200 text-red-800'
              }>
                {equipment.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Important Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Installation Date</div>
              <div className="text-lg">
                {new Date(equipment.installationDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Last Maintenance</div>
              <div className="text-lg">
                {new Date(equipment.lastMaintenance).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Warranty Expiration</div>
              <div className="text-lg">
                {new Date(equipment.warrantyExpiration).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Team Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location & Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Current Location</div>
              <div className="text-lg">{equipment.location}</div>
            </div>
            {/* Note: In real implementation, you'd fetch and display team information */}
            <div>
              <div className="text-sm font-medium text-muted-foreground">Assigned Team</div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Team assignment info would be displayed here
                </span>
              </div>
            </div>
            {hasLocation && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">GPS Coordinates</div>
                <div className="text-sm font-mono">
                  {equipment.lastKnownLocation!.latitude.toFixed(4)}, {equipment.lastKnownLocation!.longitude.toFixed(4)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Last updated: {new Date(equipment.lastKnownLocation!.timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom Attributes */}
      {equipment.customAttributes && Object.keys(equipment.customAttributes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Specifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(equipment.customAttributes).map(([key, value]) => (
                <div key={key} className="p-3 border rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">{key}</div>
                  <div className="text-lg">{value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map - Only show if organization has Fleet Map feature and equipment has location */}
      {hasFleetMapFeature && hasLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Equipment Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Interactive map would be displayed here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Location: {equipment.lastKnownLocation!.latitude.toFixed(4)}, {equipment.lastKnownLocation!.longitude.toFixed(4)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EquipmentDetailsTab;
