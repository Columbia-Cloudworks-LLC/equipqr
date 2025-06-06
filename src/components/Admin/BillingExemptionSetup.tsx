
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { setupBillingExemptions } from '@/utils/setupBillingExemptions';
import { toast } from 'sonner';

export function BillingExemptionSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSetupExemptions = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const setupResult = await setupBillingExemptions();
      setResult(setupResult);

      if (setupResult.success) {
        toast.success('Billing exemptions set up successfully!');
      } else {
        toast.error('Failed to set up billing exemptions');
      }
    } catch (error) {
      console.error('Error setting up exemptions:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      toast.error('Failed to set up billing exemptions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Setup Billing Exemptions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Exemptions to be created:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>3-A Equipment (matt@3aequip.com): Partial exemption (first 5 users free)</li>
            <li>Columbia Cloudworks (nicholas.king@columbiacloudworks.com): Full exemption (all billing waived)</li>
          </ul>
        </div>

        <Button 
          onClick={handleSetupExemptions}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Setting up exemptions...
            </>
          ) : (
            'Setup Billing Exemptions'
          )}
        </Button>

        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>
              {result.success ? result.message : `Error: ${result.error}`}
            </AlertDescription>
          </Alert>
        )}

        {result?.success && result.exemptions && (
          <div className="space-y-2">
            <h4 className="font-medium">Setup Results:</h4>
            <div className="text-sm space-y-1">
              <div>✅ 3-A Equipment: {result.exemptions['3aEquipment']?.success ? 'Success' : 'Failed'}</div>
              <div>✅ Columbia Cloudworks: {result.exemptions['columbiaCloudworks']?.success ? 'Success' : 'Failed'}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
