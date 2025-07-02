
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import EquipmentImagesTab from '@/components/equipment/EquipmentImagesTab';
import EquipmentScansTab from '@/components/equipment/EquipmentScansTab';
import WorkOrderForm from '@/components/work-orders/WorkOrderForm';
import QRCodeDisplay from '@/components/equipment/QRCodeDisplay';
import { useCreateScan } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';

const EquipmentDetails = () => {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentOrganization, isLoading: orgLoading } = useSimpleOrganization();
  const { data: equipment, isLoading: equipmentLoading } = useEquipmentById(equipmentId);
  const createScanMutation = useCreateScan();
  
  const [activeTab, setActiveTab] = useState('details');
  const [isWorkOrderFormOpen, setIsWorkOrderFormOpen] = useState(false);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [scanLogged, setScanLogged] = useState(false);

  const isLoading = orgLoading || equipmentLoading;

  // Detect if this page was accessed via QR code scan
  useEffect(() => {
    const isQRScan = searchParams.get('qr') === 'true';
    
    console.log('Page loaded:', {
      isQRScan,
      equipmentId,
      equipment: !!equipment,
      scanLogged,
      currentOrganization: !!currentOrganization
    });
    
    if (isQRScan && equipment && equipmentId && currentOrganization && !scanLogged) {
      console.log('QR scan detected, logging scan...');
      logScan();
    }
  }, [equipment, equipmentId, currentOrganization, searchParams, scanLogged]);

  const logScan = async () => {
    if (!equipmentId || !currentOrganization || scanLogged) {
      console.log('Scan logging skipped:', {
        equipmentId: !!equipmentId,
        currentOrganization: !!currentOrganization,
        scanLogged
      });
      return;
    }
    
    // Mark as logged immediately to prevent duplicate logs
    setScanLogged(true);
    
    try {
      console.log('Attempting to log scan for equipment:', equipmentId);
      
      // Try to get user's location with consent
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
            console.log('Location obtained, creating scan with location:', location);
            
            try {
              await createScanMutation.mutateAsync({
                equipmentId,
                location,
                notes: 'QR code scan with location'
              });
              console.log('Scan logged successfully with location');
              toast.success('Equipment scanned successfully!');
            } catch (error) {
              console.error('Failed to log scan with location:', error);
              toast.error('Failed to log scan');
            }
          },
          async (error) => {
            console.log('Location access denied or failed:', error.message);
            
            try {
              // Log scan without location
              await createScanMutation.mutateAsync({
                equipmentId,
                notes: 'QR code scan (location denied)'
              });
              console.log('Scan logged successfully without location');
              toast.success('Equipment scanned successfully!');
            } catch (scanError) {
              console.error('Failed to log scan without location:', scanError);
              toast.error('Failed to log scan');
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000 // 5 minutes
          }
        );
      } else {
        console.log('Geolocation not supported, logging scan without location');
        
        try {
          // Log scan without location support
          await createScanMutation.mutateAsync({
            equipmentId,
            notes: 'QR code scan (no location support)'
          });
          console.log('Scan logged successfully without location support');
          toast.success('Equipment scanned successfully!');
        } catch (error) {
          console.error('Failed to log scan without location support:', error);
          toast.error('Failed to log scan');
        }
      }
    } catch (error) {
      console.error('Unexpected error during scan logging:', error);
      toast.error('Failed to log scan');
    }
  };

  const handleCreateWorkOrder = () => {
    setIsWorkOrderFormOpen(true);
  };

  const handleCloseWorkOrderForm = () => {
    setIsWorkOrderFormOpen(false);
  };

  const handleShowQRCode = () => {
    setIsQRCodeOpen(true);
  };

  const handleCloseQRCode = () => {
    setIsQRCodeOpen(false);
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
              {equipment.manufacturer} {equipment.model} • {equipment.serial_number}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(equipment.status)}>
            {equipment.status}
          </Badge>
          <Button size="sm" onClick={handleShowQRCode}>
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
              {equipment.image_url ? (
                <img
                  src={equipment.image_url}
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
                  {equipment.last_maintenance ? 
                    new Date(equipment.last_maintenance).toLocaleDateString() : 
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="scans">Scans</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <EquipmentDetailsTab equipment={equipment} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <EquipmentNotesTab 
            equipmentId={equipment.id} 
            organizationId={currentOrganization.id}
            equipmentTeamId={equipment.team_id || undefined}
          />
        </TabsContent>

        <TabsContent value="work-orders" className="mt-6">
          <EquipmentWorkOrdersTab 
            equipmentId={equipment.id} 
            organizationId={currentOrganization.id}
            onCreateWorkOrder={handleCreateWorkOrder}
          />
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          <EquipmentImagesTab 
            equipmentId={equipment.id} 
            organizationId={currentOrganization.id}
            equipmentTeamId={equipment.team_id || undefined}
            currentDisplayImage={equipment.image_url || undefined}
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

      {/* QR Code Display */}
      <QRCodeDisplay
        open={isQRCodeOpen}
        onClose={handleCloseQRCode}
        equipmentId={equipment.id}
      />
    </div>
  );
};

export default EquipmentDetails;
