
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { diagnoseEquipmentService } from '@/services/equipment/equipmentListService';

interface EquipmentFormErrorProps {
  error: Error | unknown;
  onRetry: () => void;
}

export function EquipmentFormError({ error, onRetry }: EquipmentFormErrorProps) {
  const navigate = useNavigate();
  const [diagnosticInfo, setDiagnosticInfo] = React.useState<any>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = React.useState(false);
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isPermissionError = errorMessage.toLowerCase().includes('permission');
  const isAuthError = errorMessage.toLowerCase().includes('auth') || 
                      errorMessage.toLowerCase().includes('log in');
  const isNotFoundError = errorMessage.toLowerCase().includes('not found');
  
  const runDiagnostics = async () => {
    try {
      setIsRunningDiagnostics(true);
      const result = await diagnoseEquipmentService();
      setDiagnosticInfo(result);
    } catch (e) {
      console.error('Error running diagnostics:', e);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Error Loading Equipment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={isPermissionError ? "destructive" : "warning"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to load equipment data</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <h3 className="font-medium">Troubleshooting steps:</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {isAuthError ? (
              <>
                <li>Please verify you are logged in</li>
                <li>Your session may have expired</li>
                <li>Try refreshing the page or logging back in</li>
              </>
            ) : isPermissionError ? (
              <>
                <li>You may not have permission to view this equipment</li>
                <li>Check if you're a member of the team that owns this equipment</li>
                <li>Contact your administrator if you need access</li>
              </>
            ) : isNotFoundError ? (
              <>
                <li>The equipment record may have been deleted</li>
                <li>The equipment ID might be incorrect</li>
                <li>Check the URL and try again</li>
              </>
            ) : (
              <>
                <li>Check your internet connection</li>
                <li>Try refreshing the page</li>
                <li>The server might be experiencing issues</li>
              </>
            )}
          </ul>
        </div>
        
        {diagnosticInfo && (
          <div className="p-3 bg-muted/30 rounded-md text-sm">
            <h4 className="font-medium mb-1">Diagnostic Information</h4>
            <ul className="space-y-1">
              <li>Authentication: {diagnosticInfo.auth ? '✅ Working' : '❌ Failed'}</li>
              <li>Cache System: {diagnosticInfo.cacheClear ? '✅ Working' : '❌ Failed'}</li>
              <li>Data Query: {diagnosticInfo.directQueryWorks ? '✅ Working' : '❌ Failed'}</li>
            </ul>
          </div>
        )}
        
        {!diagnosticInfo && !isRunningDiagnostics && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runDiagnostics}
            className="w-full"
          >
            Run Diagnostics
          </Button>
        )}
        
        {isRunningDiagnostics && (
          <div className="flex items-center justify-center py-2">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span>Running diagnostics...</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/equipment')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Equipment
        </Button>
        <Button onClick={onRetry}>Try Again</Button>
      </CardFooter>
    </Card>
  );
}
