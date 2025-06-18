
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Shield, Wrench, Users } from 'lucide-react';
import { Equipment } from '@/services/dataService';
import { UserOrganization } from '@/types/organizationContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useUpdateEquipment } from '@/hooks/useSupabaseData';
import InlineEditField from './InlineEditField';
import InlineEditCustomAttributes from './InlineEditCustomAttributes';

interface EquipmentDetailsTabProps {
  equipment: Equipment;
  organization: UserOrganization;
}

const EquipmentDetailsTab: React.FC<EquipmentDetailsTabProps> = ({
  equipment,
  organization,
}) => {
  const { canManageEquipment } = usePermissions();
  const updateEquipmentMutation = useUpdateEquipment();
  
  const hasFleetMapFeature = organization.features.includes('Fleet Map');
  const hasLocation = equipment.lastKnownLocation;
  
  // Check if user can edit this equipment
  const canEdit = canManageEquipment(equipment.id); // In real implementation, you'd pass the team_id

  const handleFieldUpdate = async (field: keyof Equipment, value: string) => {
    await updateEquipmentMutation.mutateAsync({
      equipmentId: equipment.id,
      equipmentData: { [field]: value }
    });
  };

  const handleCustomAttributesUpdate = async (customAttributes: Record<string, string>) => {
    await updateEquipmentMutation.mutateAsync({
      equipmentId: equipment.id,
      equipmentData: { customAttributes }
    });
  };

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'inactive', label: 'Inactive' }
  ];

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
              <InlineEditField
                value={equipment.manufacturer}
                onSave={(value) => handleFieldUpdate('manufacturer', value)}
                canEdit={canEdit}
                className="text-lg"
                placeholder="Enter manufacturer"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Model</div>
              <InlineEditField
                value={equipment.model}
                onSave={(value) => handleFieldUpdate('model', value)}
                canEdit={canEdit}
                className="text-lg"
                placeholder="Enter model"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Serial Number</div>
              <InlineEditField
                value={equipment.serialNumber}
                onSave={(value) => handleFieldUpdate('serialNumber', value)}
                canEdit={canEdit}
                className="text-lg font-mono"
                placeholder="Enter serial number"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              {canEdit ? (
                <InlineEditField
                  value={equipment.status}
                  onSave={(value) => handleFieldUpdate('status', value)}
                  canEdit={canEdit}
                  type="select"
                  selectOptions={statusOptions}
                />
              ) : (
                <Badge variant="outline" className={
                  equipment.status === 'active' ? 'border-green-200 text-green-800' :
                  equipment.status === 'maintenance' ? 'border-yellow-200 text-yellow-800' :
                  'border-red-200 text-red-800'
                }>
                  {equipment.status}
                </Badge>
              )}
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
              <InlineEditField
                value={equipment.installationDate}
                onSave={(value) => handleFieldUpdate('installationDate', value)}
                canEdit={canEdit}
                type="date"
                className="text-lg"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Last Maintenance</div>
              <InlineEditField
                value={equipment.lastMaintenance || ''}
                onSave={(value) => handleFieldUpdate('lastMaintenance', value)}
                canEdit={canEdit}
                type="date"
                className="text-lg"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Warranty Expiration</div>
              <InlineEditField
                value={equipment.warrantyExpiration || ''}
                onSave={(value) => handleFieldUpdate('warrantyExpiration', value)}
                canEdit={canEdit}
                type="date"
                className="text-lg"
              />
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
              <InlineEditField
                value={equipment.location}
                onSave={(value) => handleFieldUpdate('location', value)}
                canEdit={canEdit}
                className="text-lg"
                placeholder="Enter location"
              />
            </div>
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

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <InlineEditField
            value={equipment.notes || ''}
            onSave={(value) => handleFieldUpdate('notes', value)}
            canEdit={canEdit}
            type="textarea"
            placeholder="Add notes about this equipment..."
          />
        </CardContent>
      </Card>

      {/* Custom Attributes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Specifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InlineEditCustomAttributes
            value={equipment.customAttributes || {}}
            onSave={handleCustomAttributesUpdate}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>

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
