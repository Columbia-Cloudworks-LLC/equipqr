
import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { getEquipmentById } from '@/services/equipment/equipmentDetailsService';
import { recordEnhancedScan } from '@/services/equipment/enhancedScanService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { EquipmentDetailLoading } from '@/components/Equipment/Detail/EquipmentDetailLoading';
import { EquipmentDetailError } from '@/components/Equipment/Detail/EquipmentDetailError';
import { EquipmentDetailContent } from '@/components/Equipment/Detail/EquipmentDetailContent';

export default function EquipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [canEdit, setCanEdit] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [scanRecorded, setScanRecorded] = useState(false);
  
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

  // Record scan ONLY when coming from QR code
  useEffect(() => {
    if (equipment && id && !scanRecorded) {
      // Check URL search params for QR source
      const urlParams = new URLSearchParams(location.search);
      const isFromQr = urlParams.get('source') === 'qr';
      
      if (isFromQr) {
        console.log('QR code scan detected, recording scan');
        recordEnhancedScan(id, 'qr_code');
        setScanRecorded(true);
      } else {
        console.log('Direct access detected, no scan recorded');
      }
    }
  }, [equipment, id, scanRecorded, location.search]);

  if (isLoading) {
    return (
      <Layout>
        <EquipmentDetailLoading />
      </Layout>
    );
  }

  if (isError || !equipment) {
    return (
      <Layout>
        <EquipmentDetailError error={error as Error} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-start">
          <Button variant="ghost" asChild>
            <Link to="/equipment">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Equipment
            </Link>
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
