
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

  // Generate the full URL for the equipment with QR tracking
  const getEquipmentQrUrl = () => {
    // Use window.location to dynamically build the URL with QR source parameter
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
          <div className="flex justify-start no-print">
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
          <div className="flex justify-start no-print">
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
      <div className="flex-1 layout-content">
        {/* Screen-only navigation and content */}
        <div className="no-print p-6 space-y-6">
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

        {/* Print-only optimized layout */}
        <div className="qr-print-container" style={{ display: 'none' }}>
          <h1 className="qr-print-title">{equipment.name}</h1>
          <div className="qr-print-code">
            <QRCodeGenerator 
              value={getEquipmentQrUrl()}
              equipmentName={equipment.name}
              className=""
            />
          </div>
          <p className="qr-print-instructions">
            Scan this QR code to view equipment details and log maintenance visits
          </p>
        </div>
      </div>
    </Layout>
  );
}
