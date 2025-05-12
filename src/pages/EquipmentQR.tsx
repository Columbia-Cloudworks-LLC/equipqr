
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import QRCodeGenerator from '@/components/Equipment/QRCodeGenerator';
import { getEquipmentById } from '@/services/equipment/equipmentDetailsService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function EquipmentQR() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: equipment,
    isLoading,
    error
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

  // Generate the full URL for the equipment
  const getEquipmentQrUrl = () => {
    // Use window.location to dynamically build the URL
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    return `${baseUrl}/equipment/${id}`;
  };

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
        </div>
        
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-center mb-6">{equipment.name} - QR Code</h1>
          
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <QRCodeGenerator 
              value={getEquipmentQrUrl()}
              equipmentName={equipment.name}
              className="mb-4"
            />
            
            <p className="text-center text-sm text-muted-foreground mt-2">
              Scan this code to view equipment details
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
