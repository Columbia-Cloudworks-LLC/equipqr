
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import SimplifiedMemberBilling from '@/components/billing/SimplifiedMemberBilling';
import ImageStorageQuota from '@/components/billing/ImageStorageQuota';
import ManageSubscriptionButton from '@/components/billing/ManageSubscriptionButton';
import { useUnifiedOrganization } from '@/contexts/UnifiedOrganizationContext';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from '@/hooks/use-toast';
import { calculateSimplifiedBilling, isFreeOrganization } from '@/utils/simplifiedBillingUtils';

const Billing = () => {
  const { currentOrganization } = useUnifiedOrganization();
  const { data: members = [] } = useOrganizationMembers(currentOrganization?.id || '');
  const { subscriptionData, isSubscribed, subscriptionTier, subscriptionEnd } = useSubscription();
  
  // Mock data for storage - in a real app, this would come from your backend
  const [storageUsedGB] = useState(3.2);
  const [fleetMapEnabled, setFleetMapEnabled] = useState(false);

  const billing = calculateSimplifiedBilling(members, storageUsedGB, fleetMapEnabled);
  const isFree = isFreeOrganization(members);

  // Handle success/cancel URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const cancelled = urlParams.get('cancelled');

    if (success === 'true') {
      toast({
        title: 'Payment Successful!',
        description: 'Your payment method has been updated. Team members you invite will be billed automatically.',
        variant: 'default',
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (cancelled === 'true') {
      toast({
        title: 'Payment Cancelled',
        description: 'Your payment setup was cancelled. No charges were made.',
        variant: 'destructive',
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);



  if (!currentOrganization) {
    return (
      <div className="space-y-6">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Please select an organization to view billing information.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Usage</h1>
          <p className="text-muted-foreground">
            Manage your organization's billing and usage for {currentOrganization.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isFree ? 'secondary' : 'default'}>
            {isFree ? 'Free Plan' : 'Pay-as-you-go'}
          </Badge>
          {!isFree && <ManageSubscriptionButton size="sm" />}
        </div>
      </div>

      {/* Member Billing Details */}
      <SimplifiedMemberBilling />

      {/* Image Storage Quota */}
      <ImageStorageQuota />

      {/* Fleet Map Add-on */}
      {!isFree && (
        <Card>
          <CardHeader>
            <CardTitle>Premium Add-ons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Fleet Map</div>
                <div className="text-sm text-muted-foreground">
                  Visual equipment tracking and location management
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={fleetMapEnabled ? 'default' : 'secondary'}>
                  {fleetMapEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <ManageSubscriptionButton size="sm">
                  {fleetMapEnabled ? 'Manage Add-ons' : 'Add Fleet Map'}
                </ManageSubscriptionButton>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Billing;
