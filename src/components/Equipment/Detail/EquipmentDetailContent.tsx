
import { Equipment } from '@/types';
import QRCodeGenerator from '../QRCodeGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Edit } from 'lucide-react';
import { WorkNotes } from '../WorkNotes';
import { AttributesList } from '../Attributes';
import { ScanHistory } from '../ScanHistory/ScanHistory';
import { DeleteEquipmentButton } from './DeleteEquipmentButton';
import { DuplicateEquipmentButton } from './DuplicateEquipmentButton';
import { LocationDisplay } from './LocationDisplay';
import { toggleLocationOverride } from '@/services/equipment/locationService';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface EquipmentDetailContentProps {
  equipment: Equipment;
  id: string;
  canEdit: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function EquipmentDetailContent({
  equipment,
  id,
  canEdit,
  activeTab,
  setActiveTab
}: EquipmentDetailContentProps) {
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const queryClient = useQueryClient();

  // Generate QR URL with source tracking parameter
  const getQrUrl = () => {
    return `${window.location.origin}/equipment/${id}?source=qr`;
  };

  const handleLocationOverrideToggle = async () => {
    setIsUpdatingLocation(true);
    try {
      const success = await toggleLocationOverride(
        id, 
        !equipment.location_override
      );
      
      if (success) {
        // Refresh the equipment data
        queryClient.invalidateQueries({ queryKey: ['equipment', id] });
      }
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleViewOnMap = () => {
    if (equipment.last_scan_latitude && equipment.last_scan_longitude) {
      // Switch to scan history tab and highlight map
      setActiveTab('scan-history');
      // The LocationMap component will automatically show the location
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold break-words">{equipment.name}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {equipment.manufacturer ? `${equipment.manufacturer} · ` : ''}
            {equipment.model || 'No model'}
            {equipment.serial_number ? ` · ${equipment.serial_number}` : ''}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 lg:flex-nowrap lg:shrink-0">
          {canEdit && (
            <>
              <Button asChild size="sm" className="flex-1 sm:flex-none">
                <Link to={`/equipment/${id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                  <span className="sm:hidden">Edit</span>
                </Link>
              </Button>
              <DuplicateEquipmentButton 
                equipmentId={id}
                equipmentName={equipment.name}
                canDuplicate={canEdit}
              />
              <DeleteEquipmentButton 
                equipmentId={id} 
                equipmentName={equipment.name}
                canDelete={canEdit} 
              />
            </>
          )}
          <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Link to={`/equipment/${id}/qr`}>
              <span className="hidden sm:inline">View QR Code</span>
              <span className="sm:hidden">QR</span>
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="notes">Work Notes</TabsTrigger>
          <TabsTrigger value="scan-history">Scan History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Equipment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <p>{equipment.status}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Install Date</p>
                      <p>{equipment.install_date || 'Not specified'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Warranty Expiration</p>
                      <p>{equipment.warranty_expiration || 'Not specified'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Team</p>
                      <p>{equipment.team_name || 'Not assigned'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Organization</p>
                      <p>{equipment.org_name || 'Unknown'}</p>
                    </div>
                  </div>

                  {equipment.notes && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
                      <p className="whitespace-pre-wrap">{equipment.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <LocationDisplay
                equipment={equipment}
                onViewOnMap={handleViewOnMap}
                onToggleOverride={canEdit ? handleLocationOverrideToggle : undefined}
                canEdit={canEdit}
              />
              
              {equipment.attributes && equipment.attributes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Attributes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AttributesList 
                      attributes={equipment.attributes}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>QR Code</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <QRCodeGenerator
                    value={getQrUrl()}
                    equipmentName={equipment.name}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="notes">
          <WorkNotes equipmentId={id} />
        </TabsContent>
        
        <TabsContent value="scan-history">
          <ScanHistory equipmentId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
