
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Calendar, Package, QrCode } from 'lucide-react';
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { useEquipmentById } from '@/hooks/useSupabaseData';
import EquipmentDetailsTab from '@/components/equipment/EquipmentDetailsTab';
import EquipmentNotesTab from '@/components/equipment/EquipmentNotesTab';
import EquipmentWorkOrdersTab from '@/components/equipment/EquipmentWorkOrdersTab';
import EquipmentScansTab from '@/components/equipment/EquipmentScansTab';
import WorkOrderForm from '@/components/work-orders/WorkOrderForm';

const EquipmentDetails = () => {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const navigate = useNavigate();
  const { currentOrganization, isLoading: orgLoading } = useSimpleOrganization();
  const { data: equipment, isLoading: equipmentLoading } = useEquipmentById(equipmentId);
  
  const [activeTab, setActiveTab] = useState('details');
  const [isWorkOrderFormOpen, setIsWorkOrderFormOpen] = useState(false);

  const isLoading = orgLoading || equipmentLoading;

  const handleCreateWorkOrder = () => {
    setIsWorkOrderFormOpen(true);
  };

  const handleCloseWorkOrderForm = () => {
    setIsWorkOrderFormOpen(false);
  };

  if (!currentOrganization) {
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/equipment')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Equipment
        </Button>
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Organization Selected</h3>
            <p className="text-muted-foreground">
              Please select an organization to view equipment details.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/equipment')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Equipment
        </Button>
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Equipment not found</h3>
            <p className="text-muted-foreground">
              The equipment you're looking for doesn't exist or you don't have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/equipment')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{equipment.name}</h1>
            <p className="text-muted-foreground">
              {equipment.manufacturer} {equipment.model} • {equipment.serialNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(equipment.status)}>
            {equipment.status}
          </Badge>
          <Button size="sm">
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
        </div>
      </div>

      {/* Equipment Image and Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              {equipment.imageUrl ? (
                <img
                  src={equipment.imageUrl}
                  alt={equipment.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{equipment.location}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Last Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {equipment.lastMaintenance ? 
                    new Date(equipment.lastMaintenance).toLocaleDateString() : 
                    'Not recorded'
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          {equipment.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{equipment.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="scans">Scans</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <EquipmentDetailsTab equipment={equipment} organization={currentOrganization} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <EquipmentNotesTab 
            equipmentId={equipment.id} 
            organizationId={currentOrganization.id}
          />
        </TabsContent>

        <TabsContent value="work-orders" className="mt-6">
          <EquipmentWorkOrdersTab 
            equipmentId={equipment.id} 
            organizationId={currentOrganization.id}
            onCreateWorkOrder={handleCreateWorkOrder}
          />
        </TabsContent>

        <TabsContent value="scans" className="mt-6">
          <EquipmentScansTab 
            equipmentId={equipment.id} 
            organizationId={currentOrganization.id}
          />
        </TabsContent>
      </Tabs>

      {/* Work Order Form */}
      <WorkOrderForm
        open={isWorkOrderFormOpen}
        onClose={handleCloseWorkOrderForm}
        equipmentId={equipmentId}
      />
    </div>
  );
};

export default EquipmentDetails;
