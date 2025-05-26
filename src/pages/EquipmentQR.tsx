
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Smartphone } from 'lucide-react';
import QRCodeGenerator from '@/components/Equipment/QRCodeGenerator';
import { getEquipmentById } from '@/services/equipment/equipmentDetailsService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    enabled: !!id,
  });
  
  useEffect(() => {
    if (error) {
      const errorMessage = (error as Error)?.message || 'Unknown error occurred';
      toast.error("Failed to load equipment details", {
        description: errorMessage,
      });
    }
  }, [error]);

  const getEquipmentQrUrl = () => {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    return `${baseUrl}/equipment/${id}?source=qr`;
  };

  const handlePrint = () => {
    window.print();
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
    <>
      {/* Screen layout with navigation */}
      <div className="screen-only">
        <Layout>
          <div className="flex-1">
            <div className="p-6 space-y-6">
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
                    Scan this code to view equipment details and log access
                  </p>
                </div>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Smartphone className="mr-2 h-5 w-5" />
                      Audit & Check-in Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h3 className="font-medium">For Field Technicians:</h3>
                      <ol className="list-decimal ml-6 mt-2 space-y-2">
                        <li>Scan the QR code when arriving at equipment location</li>
                        <li>Your device information and location will be logged automatically</li>
                        <li>This creates an audit trail proving you were on-site</li>
                        <li>Managers can verify attendance through scan history</li>
                      </ol>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Scanning Instructions:</h3>
                      <p className="mt-1 text-sm">
                        Open your device's camera app, point at the QR code, and tap the notification.
                        The scan will be recorded with timestamp, device info, and location data for audit purposes.
                      </p>
                      <Button 
                        onClick={handlePrint}
                        variant="outline" 
                        size="sm"
                        className="mt-3"
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Print QR Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Layout>
      </div>

      {/* Print-only layout */}
      <div className="print-only">
        <div className="print-header">
          <h1 className="print-title">{equipment.name}</h1>
        </div>
        
        <div className="print-qr-section">
          <QRCodeGenerator 
            value={getEquipmentQrUrl()}
            equipmentName={equipment.name}
            className="print-qr-code"
          />
        </div>
        
        <div className="print-instructions">
          <h2 className="print-section-title">Audit & Check-in Instructions</h2>
          
          <div className="print-section">
            <h3 className="print-subsection-title">For Field Technicians:</h3>
            <ol className="print-list">
              <li>Scan the QR code when arriving at equipment location</li>
              <li>Your device information and location will be logged automatically</li>
              <li>This creates an audit trail proving you were on-site</li>
              <li>Managers can verify attendance through scan history</li>
            </ol>
          </div>
          
          <div className="print-section">
            <h3 className="print-subsection-title">Scanning Instructions:</h3>
            <p className="print-text">
              Open your device's camera app, point at the QR code, and tap the notification.
              The scan will be recorded with timestamp, device info, and location data for audit purposes.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
