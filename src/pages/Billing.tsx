
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, AlertCircle, RefreshCw, CheckCircle, Settings, ExternalLink } from 'lucide-react';
import SimplifiedMemberBilling from '@/components/billing/SimplifiedMemberBilling';
import ImageStorageQuota from '@/components/billing/ImageStorageQuota';
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { useSession } from '@/contexts/SessionContext';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from '@/hooks/use-toast';
import { calculateSimplifiedBilling, isFreeOrganization } from '@/utils/simplifiedBillingUtils';

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
    purchaseUserLicenses,
    checkSubscription 
  } = useSubscription();
  
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
      
      // Refresh subscription data
      checkSubscription();
      
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

  const handlePurchaseLicenses = async (quantity: number) => {
    if (!currentOrganization) return;

    if (!canManageBilling) {
      toast({
        title: 'Permission Denied',
        description: 'Only organization owners and admins can purchase licenses.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await purchaseUserLicenses(quantity, currentOrganization.id);
      toast({
        title: 'Redirecting to Checkout...',
        description: `Purchasing ${quantity} user licenses`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initiate license purchase. Please try again.',
        variant: 'destructive',
      });
    }
  };

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
          {isSubscribed && canManageBilling && (
            <Button variant="outline" onClick={handleManageSubscription}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Subscription
            </Button>
          )}
        </div>
      </div>

      {!canManageBilling && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
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
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Active Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                {canManageBilling ? (
                  <Button variant="outline" onClick={handleManageSubscription} className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Manage in Stripe
                  </Button>
                ) : (
                  <div className="text-sm text-muted-foreground">
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

      {/* User License Management */}
      {canManageBilling && (
        <Card>
          <CardHeader>
            <CardTitle>User License Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Additional User Licenses</div>
                  <div className="text-sm text-muted-foreground">
                    Purchase additional licenses for team members ($10/month per license)
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handlePurchaseLicenses(1)}
                    disabled={!currentOrganization}
                  >
                    Buy 1 License
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handlePurchaseLicenses(5)}
                    disabled={!currentOrganization}
                  >
                    Buy 5 Licenses
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                {isSubscribed && canManageBilling && (
                  <Button variant="outline" onClick={handleManageSubscription}>
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
