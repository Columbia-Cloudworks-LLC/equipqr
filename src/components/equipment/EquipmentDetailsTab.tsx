import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCode, Calendar, MapPin, Wrench, FileText } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import QRCodeDisplay from "./QRCodeDisplay";
import InlineEditField from "./InlineEditField";
import { useUpdateEquipment } from "@/hooks/useSupabaseData";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

type Equipment = Tables<'equipment'>;

interface EquipmentDetailsTabProps {
  equipment: Equipment;
}

const EquipmentDetailsTab: React.FC<EquipmentDetailsTabProps> = ({ equipment }) => {
  const [showQRCode, setShowQRCode] = React.useState(false);
  const { canManageEquipment } = usePermissions();
  const updateEquipmentMutation = useUpdateEquipment();

  const canEdit = canManageEquipment(equipment.team_id || undefined);

  const handleFieldUpdate = async (field: keyof Equipment, value: string) => {
    try {
      await updateEquipmentMutation.mutateAsync({
        equipmentId: equipment.id,
        equipmentData: { [field]: value }
      });
      toast.success(`${String(field)} updated successfully`);
    } catch (error) {
      console.error(`Error updating ${String(field)}:`, error);
      toast.error(`Failed to update ${String(field)}`);
      throw error; // Re-throw to let InlineEditField handle the error state
    }
  };

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'maintenance', label: 'Under Maintenance' },
    { value: 'inactive', label: 'Inactive' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQRCode(true)}
            className="flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            Show QR Code
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <div className="mt-1">
                <InlineEditField
                  value={equipment.name || ''}
                  onSave={(value) => handleFieldUpdate('name', value)}
                  canEdit={canEdit}
                  placeholder="Enter equipment name"
                  className="text-base"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                {canEdit ? (
                  <InlineEditField
                    value={equipment.status || 'active'}
                    onSave={(value) => handleFieldUpdate('status', value)}
                    canEdit={canEdit}
                    type="select"
                    selectOptions={statusOptions}
                    className="text-base"
                  />
                ) : (
                  <Badge className={getStatusColor(equipment.status || 'active')}>
                    {statusOptions.find(opt => opt.value === equipment.status)?.label || 'Active'}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Manufacturer</label>
              <div className="mt-1">
                <InlineEditField
                  value={equipment.manufacturer || ''}
                  onSave={(value) => handleFieldUpdate('manufacturer', value)}
                  canEdit={canEdit}
                  placeholder="Enter manufacturer"
                  className="text-base"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Model</label>
              <div className="mt-1">
                <InlineEditField
                  value={equipment.model || ''}
                  onSave={(value) => handleFieldUpdate('model', value)}
                  canEdit={canEdit}
                  placeholder="Enter model"
                  className="text-base"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Serial Number</label>
              <div className="mt-1">
                <InlineEditField
                  value={equipment.serial_number || ''}
                  onSave={(value) => handleFieldUpdate('serial_number', value)}
                  canEdit={canEdit}
                  placeholder="Enter serial number"
                  className="text-base"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Location</label>
              <div className="mt-1 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <InlineEditField
                  value={equipment.location || ''}
                  onSave={(value) => handleFieldUpdate('location', value)}
                  canEdit={canEdit}
                  placeholder="Enter location"
                  className="text-base"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Description</label>
            <div className="mt-1">
              <InlineEditField
                value={equipment.notes || ''}
                onSave={(value) => handleFieldUpdate('notes', value)}
                canEdit={canEdit}
                type="textarea"
                placeholder="Enter equipment description"
                className="text-base"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Installation Date</label>
              <div className="mt-1">
                <InlineEditField
                  value={equipment.installation_date || ''}
                  onSave={(value) => handleFieldUpdate('installation_date', value)}
                  canEdit={canEdit}
                  type="date"
                  placeholder="Select installation date"
                  className="text-base"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Warranty Expiration</label>
              <div className="mt-1">
                <InlineEditField
                  value={equipment.warranty_expiration || ''}
                  onSave={(value) => handleFieldUpdate('warranty_expiration', value)}
                  canEdit={canEdit}
                  type="date"
                  placeholder="Select warranty expiration date"
                  className="text-base"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Last Maintenance</label>
              <div className="mt-1">
                <InlineEditField
                  value={equipment.last_maintenance || ''}
                  onSave={(value) => handleFieldUpdate('last_maintenance', value)}
                  canEdit={canEdit}
                  type="date"
                  placeholder="Select last maintenance date"
                  className="text-base"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Created Date</label>
              <div className="mt-1 text-base text-gray-900">
                {equipment.created_at ? format(new Date(equipment.created_at), 'PPP') : 'Not set'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Notes</label>
            <div className="mt-1">
              <InlineEditField
                value={equipment.notes || ''}
                onSave={(value) => handleFieldUpdate('notes', value)}
                canEdit={canEdit}
                type="textarea"
                placeholder="Enter maintenance notes or additional information"
                className="text-base"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <QRCodeDisplay
        open={showQRCode}
        onClose={() => setShowQRCode(false)}
        equipmentId={equipment.id}
      />
    </div>
  );
};

export default EquipmentDetailsTab;
