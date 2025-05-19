
import { Equipment } from '@/types';
import QRCodeGenerator from '../QRCodeGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Edit } from 'lucide-react';
import { WorkNotes } from '../WorkNotes';
import { AttributesList } from '../Attributes';
import { DeleteEquipmentButton } from './DeleteEquipmentButton'; 

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
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-2">
        <div>
          <h1 className="text-3xl font-bold">{equipment.name}</h1>
          <p className="text-muted-foreground">
            {equipment.manufacturer ? `${equipment.manufacturer} · ` : ''}
            {equipment.model || 'No model'}
            {equipment.serial_number ? ` · ${equipment.serial_number}` : ''}
          </p>
        </div>
        
        <div className="flex gap-2">
          {canEdit && (
            <>
              <Button asChild size="sm">
                <Link to={`/equipment/${id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <DeleteEquipmentButton 
                equipmentId={id} 
                equipmentName={equipment.name}
                canDelete={canEdit} 
              />
            </>
          )}
          <Button asChild variant="outline" size="sm">
            <Link to={`/equipment/${id}/qr`}>
              View QR Code
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="notes">Work Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
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
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p>{equipment.location || 'Not specified'}</p>
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
              
              {equipment.attributes && equipment.attributes.length > 0 && (
                <Card className="mt-4">
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
                    value={`${window.location.origin}/equipment/${id}`}
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
      </Tabs>
    </div>
  );
}
