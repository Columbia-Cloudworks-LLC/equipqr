
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Settings, AlertTriangle } from 'lucide-react';
import { useUserBilling } from '@/hooks/useUserBilling';
import { BillingPortalAccess } from './BillingPortalAccess';

export function UserBillingManagement() {
  const { billingInfo, gracePeriodInfo, isLoading, userRole } = useUserBilling();

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
                Only organization owners can manage billing settings and subscriptions.
                Contact your organization owner to make billing changes.
              </p>
            </div>
          ) : (
            <>
              {!billingInfo?.billing_required ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-green-900">Free Tier Active</h3>
                        <p className="text-green-700 text-sm">
                          Your organization is currently on the free tier. Billing will start automatically when you add your first equipment.
                        </p>
                      </div>
                      <Button variant="outline" disabled className="bg-green-50">
                        <CreditCard className="h-4 w-4 mr-2" />
                        No Billing Required
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Pricing Model</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• $10 per organization member per month</li>
                      <li>• All members are included in billing</li>
                      <li>• 30-day grace period when equipment is first added</li>
                      <li>• Equipment tracking and team collaboration included</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <BillingPortalAccess />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
