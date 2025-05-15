
import { ArrowLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EquipmentDetailErrorProps {
  error: Error | null;
  onBackClick: () => void;
}

export function EquipmentDetailError({ error, onBackClick }: EquipmentDetailErrorProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex-1 p-6 space-y-4">
      <div className="flex justify-start">
        <Button variant="ghost" onClick={onBackClick}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error?.message || "The equipment you're looking for doesn't exist or you don't have permission to view it."}
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
  );
}
