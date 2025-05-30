
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CreditCard, RefreshCw, Info, Building } from 'lucide-react';
import { useUserBilling } from '@/hooks/useUserBilling';

export function UserBillingCard() {
  const { billingInfo, gracePeriodInfo, isLoading, error, userRole, refreshBilling } = useUserBilling();

  const isOwner = userRole === 'owner';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Billing
          </CardTitle>
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

  if (error || !billingInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              {error || 'Unable to load billing information'}
            </p>
            <Button onClick={refreshBilling} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const monthlyAmount = billingInfo.monthly_cost_cents / 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Billing
          </div>
          <div className="flex items-center gap-2">
            {!billingInfo.billing_required && (
              <Badge variant="outline" className="text-xs">
                <Info className="h-3 w-3 mr-1" />
                No Equipment
              </Badge>
            )}
            <Button onClick={refreshBilling} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold">{billingInfo.total_users}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Billable Users</p>
            <p className="text-2xl font-bold text-blue-600">{billingInfo.billable_users}</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Equipment Count</p>
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{billingInfo.equipment_count} items</span>
          </div>
        </div>

        {billingInfo.billing_required ? (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-900">Monthly Cost</h4>
                <p className="text-blue-700 text-sm">
                  {billingInfo.billable_users} billable users × $10.00
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">
                  ${monthlyAmount.toFixed(2)}
                </div>
                <div className="text-xs text-blue-600">per month</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900">Free Tier</h4>
            <p className="text-green-700 text-sm">
              No billing required until you add equipment to your organization.
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Viewers are not charged</p>
          <p>• Billing starts when first equipment is added</p>
          <p>• 30-day grace period for new equipment</p>
        </div>
      </CardContent>
    </Card>
  );
}
