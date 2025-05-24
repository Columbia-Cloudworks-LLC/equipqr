
import { ArrowLeft, Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EquipmentDetailErrorProps {
  error: Error | null;
}

export function EquipmentDetailError({ error }: EquipmentDetailErrorProps) {
  const navigate = useNavigate();
  
  // Determine error type to show appropriate message and icon
  const errorMessage = error?.message || "The equipment you're looking for doesn't exist or you don't have permission to view it.";
  const isPermissionError = errorMessage.toLowerCase().includes('permission') || 
                            errorMessage.toLowerCase().includes('access');
  const isNotFoundError = errorMessage.toLowerCase().includes('not found') ||
                          errorMessage.toLowerCase().includes("doesn't exist");
  
  // Choose appropriate icon based on error type
  const ErrorIcon = isPermissionError ? AlertTriangle : 
                    isNotFoundError ? AlertOctagon : Info;
  
  // Select appropriate variant based on error type
  const alertVariant = isPermissionError ? "destructive" : "warning";
  
  // More helpful subtitle based on error type
  let subtitle = "";
  if (isPermissionError) {
    subtitle = "You don't have the necessary permissions to access this equipment.";
  } else if (isNotFoundError) {
    subtitle = "The equipment record may have been deleted or doesn't exist.";
  } else {
    subtitle = "There was a problem retrieving the equipment details.";
  }
  
  return (
    <div className="flex-1 p-6 space-y-4">
      <div className="flex justify-start">
        <Button variant="ghost" asChild>
          <Link to="/equipment">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Equipment
          </Link>
        </Button>
      </div>
      
      <Alert variant={alertVariant}>
        <ErrorIcon className="h-4 w-4" />
        <AlertTitle>Error Loading Equipment</AlertTitle>
        <AlertDescription>
          {errorMessage}
        </AlertDescription>
      </Alert>
      
      <div className="p-4 bg-muted/30 rounded-lg">
        <h3 className="font-medium mb-2">What happened?</h3>
        <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>
        
        <h3 className="font-medium mb-2">What can you do?</h3>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>Check if you're a member of the team that owns this equipment</li>
          <li>Verify your organization has access to this equipment</li>
          <li>Ask your administrator to grant you the necessary permissions</li>
          <li>Try refreshing the page</li>
        </ul>
      </div>
      
      <div className="flex gap-2 justify-center py-4">
        <Button 
          variant="default" 
          onClick={() => navigate('/equipment')}
        >
          View All Equipment
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
      </div>
    </div>
  );
}
