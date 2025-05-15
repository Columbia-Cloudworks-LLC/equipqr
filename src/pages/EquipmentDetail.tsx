
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { EquipmentCard } from '@/components/Equipment/EquipmentCard';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { getEquipmentById } from '@/services/equipment/equipmentDetailsService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Edit, QrCode, Info, Users, Tags } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { WorkNotes } from '@/components/Equipment/WorkNotes';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttributesList } from '@/components/Equipment/Attributes/AttributesList';

export default function EquipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [canEdit, setCanEdit] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("details");
  
  const {
    data: equipment,
    isLoading,
    error,
    refetch,
    isError
  } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => getEquipmentById(id as string),
    enabled: !!id, // only run query if ID is available
    retry: 1, // Only retry once to avoid too many error messages
  });
  
  useEffect(() => {
    if (error) {
      console.error('Equipment detail error:', error);
      const errorMessage = (error as Error)?.message || 'Unknown error occurred';
      toast.error("Failed to load equipment details", {
        description: errorMessage,
      });
    }

    // Check if user can edit this equipment (based on organization/team)
    if (equipment) {
      setCanEdit(!equipment.is_external_org || equipment.can_edit);
    }
  }, [error, equipment]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 p-6 space-y-4">
          <div className="flex justify-start">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-1/3 bg-gray-200 rounded"></div>
            <div className="h-60 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !equipment) {
    return (
      <Layout>
        <div className="flex-1 p-6 space-y-4">
          <div className="flex justify-start">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {(error as Error)?.message || "The equipment you're looking for doesn't exist or you don't have permission to view it."}
            </AlertDescription>
          </Alert>
          
          <div className="text-center py-12">
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => navigate('/equipment')}
            >
              View All Equipment
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Check if there are any attributes to display
  const hasAttributes = equipment.attributes && equipment.attributes.length > 0;

  return (
    <Layout>
      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
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
        
        {/* Organization & Team Info */}
        {(equipment.org_name || equipment.team_name) && (
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
        )}
        
        <EquipmentCard equipment={equipment} showOrgInfo={false} />

        <Tabs defaultValue="details" className="w-full" onValueChange={setActiveTab}>
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
            </TabsContent>
          )}
          
          <TabsContent value="work-notes">
            <WorkNotes equipmentId={id || ''} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
