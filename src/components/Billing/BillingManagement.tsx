
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, AlertTriangle, ExternalLink, Settings } from 'lucide-react';
import { useStorageUsage } from '@/hooks/useStorageUsage';
import { BillingPortalAccess } from './BillingPortalAccess';
import { BillingInvoicesList } from './BillingInvoicesList';

export function BillingManagement() {
  const { billingHistory, isLoading, userRole, isFallback, refreshUsage } = useStorageUsage();

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Billing Management
            </div>
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
              {isFallback ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900">Billing Portal</h3>
                        <p className="text-blue-700 text-sm">
                          Billing management is currently in setup mode. Full billing features will be available soon.
                        </p>
                      </div>
                      <Button variant="outline" disabled className="bg-blue-50">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Coming Soon
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Current Plan: Free Tier</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 5 GB storage included</li>
                      <li>• $0.10 per GB overage</li>
                      <li>• Basic equipment tracking</li>
                      <li>• Team collaboration</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <>
                  <BillingPortalAccess />
                  {billingHistory.length > 0 && (
                    <BillingInvoicesList billingHistory={billingHistory.slice(0, 5)} />
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
