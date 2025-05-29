
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { StorageUsageCard } from '@/components/Billing/StorageUsageCard';
import { BillingManagement } from '@/components/Billing/BillingManagement';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

function BillingErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>Failed to load billing information: {error.message}</span>
        <Button onClick={resetErrorBoundary} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function OrganizationBillingTab() {
  return (
    <ErrorBoundary
      FallbackComponent={BillingErrorFallback}
      onReset={() => window.location.reload()}
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <StorageUsageCard />
          <div className="space-y-6">
            <BillingManagement />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
