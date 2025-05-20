
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { getEquipmentById } from '@/services/equipment/equipmentDetailsService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { EquipmentDetailLoading } from '@/components/Equipment/Detail/EquipmentDetailLoading';
import { EquipmentDetailError } from '@/components/Equipment/Detail/EquipmentDetailError';
import { EquipmentDetailContent } from '@/components/Equipment/Detail/EquipmentDetailContent';

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
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
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

  const handleBackClick = () => navigate(-1);

  if (isLoading) {
    return (
      <Layout>
        <EquipmentDetailLoading onBackClick={handleBackClick} />
      </Layout>
    );
  }

  if (isError || !equipment) {
    return (
      <Layout>
        <EquipmentDetailError error={error as Error} onBackClick={handleBackClick} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-start">
          <Button variant="ghost" onClick={handleBackClick}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <EquipmentDetailContent 
          equipment={equipment}
          id={id || ''}
          canEdit={canEdit}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </Layout>
  );
}
