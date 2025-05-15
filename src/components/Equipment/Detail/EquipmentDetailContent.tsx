
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Edit, QrCode, Info, Users, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EquipmentCard } from '@/components/Equipment/EquipmentCard';
import { AttributesList } from '@/components/Equipment/Attributes/AttributesList';
import { WorkNotes } from '@/components/Equipment/WorkNotes';
import { Equipment } from '@/types';

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
  // Check if there are any attributes to display
  const hasAttributes = equipment.attributes && equipment.attributes.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <RouterLink to={`/equipment/${id}/qr`}>
              <QrCode className="mr-2 h-4 w-4" />
              QR Code
            </RouterLink>
          </Button>
          {canEdit ? (
            <Button asChild>
              <RouterLink to={`/equipment/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </RouterLink>
            </Button>
          ) : (
            <Button variant="ghost" disabled title="You don't have permission to edit this equipment">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>
      
      {equipment.is_external_org && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>External Organization Equipment</AlertTitle>
          <AlertDescription>
            This equipment is shared from another organization.
            {!canEdit && " You have view-only access."}
          </AlertDescription>
        </Alert>
      )}
      
      <AccessInformationCard equipment={equipment} canEdit={canEdit} />
      
      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          {hasAttributes && (
            <TabsTrigger value="quick-hits" className="flex items-center">
              <Tags className="mr-2 h-4 w-4" />
              Quick Hits 
              {hasAttributes && <Badge className="ml-2">{equipment.attributes?.length}</Badge>}
            </TabsTrigger>
          )}
          <TabsTrigger value="work-notes">Work Notes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <EquipmentCard equipment={equipment} showOrgInfo={false} />
        </TabsContent>
        
        {hasAttributes && (
          <TabsContent value="quick-hits">
            <AttributesCard equipment={equipment} />
          </TabsContent>
        )}
        
        <TabsContent value="work-notes">
          <WorkNotes equipmentId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Access Information Card Component
function AccessInformationCard({ equipment, canEdit }: { equipment: Equipment, canEdit: boolean }) {
  if (!equipment.org_name && !equipment.team_name) return null;
  
  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-base flex items-center">
          <Users className="mr-2 h-4 w-4" />
          Access Information
        </CardTitle>
      </CardHeader>
      <CardContent className="py-0">
        <div className="grid grid-cols-2 gap-4">
          {equipment.org_name && (
            <div>
              <p className="text-sm font-medium">Organization</p>
              <p className="text-sm text-muted-foreground">
                {equipment.org_name}
                {equipment.is_external_org && (
                  <Badge variant="outline" className="ml-2 text-xs bg-blue-50">
                    External
                  </Badge>
                )}
              </p>
            </div>
          )}
          {equipment.team_name && (
            <div>
              <p className="text-sm font-medium">Team</p>
              <p className="text-sm text-muted-foreground">{equipment.team_name}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium">Access Level</p>
            <p className="text-sm text-muted-foreground">
              {canEdit ? 'Edit Access' : 'View Only'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Attributes Card Component
function AttributesCard({ equipment }: { equipment: Equipment }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Tags className="mr-2 h-5 w-5" />
          Custom Attributes
        </CardTitle>
        <CardDescription>
          Quick reference information for this {equipment.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AttributesList attributes={equipment.attributes || []} />
      </CardContent>
    </Card>
  );
}
