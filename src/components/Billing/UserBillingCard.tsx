
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, DollarSign, Shield, Info } from 'lucide-react';
import { useUserBilling } from '@/hooks/useUserBilling';

export function UserBillingCard() {
  const { billingInfo, isLoading, error } = useUserBilling();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Billing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!billingInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>No billing information available.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const monthlyCost = billingInfo.monthly_cost_cents / 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Billing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {billingInfo.exemption_applied && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {billingInfo.exemption_details?.type === 'organization' ? (
                billingInfo.exemption_details.exemption_type === 'full' ? 
                  'Your organization has a full billing exemption.' :
                  `Your organization has a partial billing exemption (${billingInfo.exemption_details.free_user_count} free users).`
              ) : (
                `${billingInfo.exemption_details?.exempt_users || 0} users have individual billing exemptions.`
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{billingInfo.total_users}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{billingInfo.billable_users}</div>
            <div className="text-sm text-muted-foreground">Billable Users</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Monthly Cost:</span>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-lg font-bold">${monthlyCost.toFixed(2)}</span>
            {billingInfo.exemption_applied && (
              <Badge variant="secondary" className="ml-2">
                <Shield className="h-3 w-3 mr-1" />
                Exempted
              </Badge>
            )}
          </div>
        </div>

        {!billingInfo.billing_required && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Billing will be activated when you add your first equipment.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
