import { useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { EquipmentCard } from '@/components/Equipment/EquipmentCard';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { getEquipmentById } from '@/services/equipmentService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Edit, QrCode } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { WorkNotes } from '@/components/Equipment/WorkNotes';

export default function EquipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const {
    data: equipment,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => getEquipmentById(id as string),
    enabled: !!id, // only run query if ID is available
  });
  
  useEffect(() => {
    if (error) {
      const errorMessage = (error as Error)?.message || 'Unknown error occurred';
      toast.error("Failed to load equipment details", {
        description: errorMessage,
      });
    }
  }, [error]);

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

  if (!equipment) {
    return (
      <Layout>
        <div className="flex-1 p-6 space-y-4">
          <div className="flex justify-start">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Equipment not found</h2>
            <p className="text-muted-foreground mt-2">
              The equipment you're looking for doesn't exist or you don't have permission to view it.
            </p>
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
            <Button asChild>
              <RouterLink to={`/equipment/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </RouterLink>
            </Button>
          </div>
        </div>
        
        <EquipmentCard equipment={equipment} />
        
        <Separator />
        
        {/* Work Notes Section */}
        <WorkNotes equipmentId={id || ''} />
      </div>
    </Layout>
  );
}
