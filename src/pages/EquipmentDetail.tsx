
import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { getEquipmentById } from '@/services/equipment/equipmentDetailsService';
import { recordEnhancedScan } from '@/services/equipment/enhancedScanService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { EquipmentDetailLoading } from '@/components/Equipment/Detail/EquipmentDetailLoading';
import { EquipmentDetailError } from '@/components/Equipment/Detail/EquipmentDetailError';
import { EquipmentDetailContent } from '@/components/Equipment/Detail/EquipmentDetailContent';

export default function EquipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [canEdit, setCanEdit] = useState(true);
  const [scanRecorded, setScanRecorded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const {
    data: equipment,
    isLoading,
    error,
    refetch,
    isError
  } = useQuery({
    queryKey: ['equipment', id, retryCount],
    queryFn: () => getEquipmentById(id as string),
    enabled: !!id,
    retry: (failureCount, error) => {
      // Only retry on specific errors, not on access denied
      const errorMessage = (error as Error)?.message || '';
      if (errorMessage.includes('access denied') || errorMessage.includes('not found')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 5,
  });
  
  useEffect(() => {
    if (error) {
      console.error('Equipment detail error:', error);
      const errorMessage = (error as Error)?.message || 'Unknown error occurred';
      
      // Don't show toast for access denied errors as they're expected
      if (!errorMessage.toLowerCase().includes('access denied')) {
        toast.error("Failed to load equipment details", {
          description: errorMessage,
        });
      }
    }

    // Check if user can edit this equipment (based on organization/team)
    if (equipment) {
      setCanEdit(equipment.canEdit || false);
    }
  }, [error, equipment]);

  // Record scan ONLY when coming from QR code AND equipment data is successfully loaded
  useEffect(() => {
    if (equipment && id && !scanRecorded && !isError) {
      // Check URL search params for QR source
      const urlParams = new URLSearchParams(location.search);
      const isFromQr = urlParams.get('source') === 'qr';
      
      if (isFromQr) {
        console.log('QR code scan detected for authorized equipment access, recording scan');
        // Since getEquipmentById() succeeded, we know the user has access to this equipment
        recordEnhancedScan(id, 'qr_code');
        setScanRecorded(true);
      } else {
        console.log('Direct access detected, no scan recorded');
      }
    }
  }, [equipment, id, scanRecorded, location.search, isError]);

  const handleRetry = () => {
    setRetryCount(prevCount => prevCount + 1);
    refetch();
  };

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
        <div className="flex-1 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <Button variant="ghost" asChild>
              <Link to="/equipment">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Equipment
              </Link>
            </Button>
            
            <Button variant="outline" onClick={handleRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
          
          <EquipmentDetailError error={error as Error} />
        </div>
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
          canEdit={canEdit}
          canDelete={canEdit}
        />
      </div>
    </Layout>
  );
}
