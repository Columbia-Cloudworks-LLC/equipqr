
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, AlertTriangle } from 'lucide-react';
import { useStorageUsage } from '@/hooks/useStorageUsage';
import { BillingPortalAccess } from './BillingPortalAccess';
import { BillingInvoicesList } from './BillingInvoicesList';

export function BillingManagement() {
  const { billingHistory, isLoading, error, userRole, refreshUsage } = useStorageUsage();

  const isOwner = userRole === 'owner';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refreshUsage} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Billing Management
            {!isOwner && (
              <Badge variant="secondary" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Owner Only
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isOwner ? (
            <div className="text-center p-6 bg-amber-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <h3 className="font-semibold text-amber-800 mb-2">Access Restricted</h3>
              <p className="text-amber-700 text-sm">
                Only organization owners can manage billing settings and view payment history.
                Contact your organization owner to make billing changes.
              </p>
            </div>
          ) : (
            <>
              <BillingPortalAccess />
              {billingHistory.length > 0 && (
                <BillingInvoicesList billingHistory={billingHistory.slice(0, 5)} />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
