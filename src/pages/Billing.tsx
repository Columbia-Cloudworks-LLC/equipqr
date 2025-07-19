
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, AlertCircle, RefreshCw, CheckCircle, Settings, ExternalLink } from 'lucide-react';
import SimplifiedMemberBilling from '@/components/billing/SimplifiedMemberBilling';
import ImageStorageQuota from '@/components/billing/ImageStorageQuota';
import BillingHeader from '@/components/billing/BillingHeader';
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { useSession } from '@/contexts/SessionContext';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from '@/hooks/use-toast';
import { calculateSimplifiedBilling, isFreeOrganization } from '@/utils/simplifiedBillingUtils';
import { useIsMobile } from '@/hooks/use-mobile';

const Billing = () => {
  const { currentOrganization } = useSimpleOrganization();
  const { getCurrentOrganization } = useSession();
  const { data: members = [] } = useOrganizationMembers(currentOrganization?.id || '');
  const { 
    subscriptionData, 
    isSubscribed, 
    subscriptionTier, 
    subscriptionEnd, 
    openCustomerPortal,
    checkSubscription 
  } = useSubscription();
  
  const isMobile = useIsMobile();
  
  // Mock data for storage - in a real app, this would come from your backend
  const [storageUsedGB] = useState(3.2);
  const [fleetMapEnabled, setFleetMapEnabled] = useState(false);

  const billing = calculateSimplifiedBilling(members, storageUsedGB, fleetMapEnabled);
  const isFree = isFreeOrganization(members);

  // Get user role for permission checks
  const sessionOrganization = getCurrentOrganization();
  const userRole = sessionOrganization?.userRole;
  const canManageBilling = ['owner', 'admin'].includes(userRole || '');

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
      
      checkSubscription();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (cancelled === 'true') {
      toast({
        title: 'Payment Cancelled',
        description: 'Your payment setup was cancelled. No charges were made.',
        variant: 'destructive',
      });
      
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast, checkSubscription]);

  const handleManageSubscription = async () => {
    if (!canManageBilling) {
      toast({
        title: 'Permission Denied',
        description: 'Only organization owners and admins can manage subscriptions.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await openCustomerPortal();
      toast({
        title: 'Opening Subscription Management...',
        description: 'Redirecting to Stripe Customer Portal',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open subscription management. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!currentOrganization) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
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
    <div className="p-4 sm:p-6 space-y-6">
      <BillingHeader
        organizationName={currentOrganization.name}
        isFree={isFree}
        isSubscribed={isSubscribed}
        canManageBilling={canManageBilling}
        onManageSubscription={handleManageSubscription}
      />

      {!canManageBilling && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">
                <strong>Limited Access:</strong> Only organization owners and admins can manage billing settings and purchase licenses.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Status Card */}
      {isSubscribed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              Active Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Plan</div>
                <div className="font-medium">{subscriptionTier || 'Active'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Next Billing</div>
                <div className="font-medium">
                  {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                {canManageBilling ? (
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription} 
                    className="w-full"
                    size={isMobile ? "sm" : "default"}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Manage in Stripe
                  </Button>
                ) : (
                  <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                    Contact admin to manage
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member Billing Details */}
      <SimplifiedMemberBilling />

      {/* Image Storage Quota */}
      <ImageStorageQuota />

      {/* Fleet Map Add-on */}
      {!isFree && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Premium Add-ons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-medium">Fleet Map</div>
                <div className="text-sm text-muted-foreground">
                  Visual equipment tracking and location management
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Badge variant={fleetMapEnabled ? 'default' : 'secondary'}>
                  {fleetMapEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
                {isSubscribed && canManageBilling && (
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription}
                    size={isMobile ? "sm" : "default"}
                    className="w-full sm:w-auto"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Manage
                  </Button>
                )}
                {!canManageBilling && (
                  <div className="text-sm text-muted-foreground">
                    Contact admin
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Billing;
