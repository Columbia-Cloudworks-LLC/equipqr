
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import RealMemberBilling from '@/components/billing/RealMemberBilling';
import SlotBasedBilling from '@/components/billing/SlotBasedBilling';
import EnhancedInvitationManagement from '@/components/organization/EnhancedInvitationManagement';
import { useUnifiedOrganization } from '@/contexts/UnifiedOrganizationContext';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useSubscription } from '@/hooks/useSubscription';
import { useSlotAvailability } from '@/hooks/useOrganizationSlots';
import { toast } from '@/hooks/use-toast';
import { isFreeOrganization } from '@/utils/billingUtils';

const Billing = () => {
  const { currentOrganization } = useUnifiedOrganization();
  const { data: members = [] } = useOrganizationMembers(currentOrganization?.id || '');
  const { subscriptionData, isLoading, error, checkSubscription } = useSubscription();
  const { data: slotAvailability, refetch: refetchSlots } = useSlotAvailability(currentOrganization?.id || '');
  
  // Mock data for storage - in a real app, this would come from your backend
  const [storageUsedGB] = useState(3.2);
  const [fleetMapEnabled, setFleetMapEnabled] = useState(false);

  const isFree = isFreeOrganization(members);

  // Handle success/cancel URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const cancelled = urlParams.get('cancelled');
    const sessionId = urlParams.get('session_id');

    if (success === 'true') {
      toast({
        title: 'Payment Successful!',
        description: 'Your user licenses have been activated. You can now invite team members.',
        variant: 'default',
      });
      
      // Refresh slot data after successful purchase
      setTimeout(() => {
        refetchSlots();
      }, 2000);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (cancelled === 'true') {
      toast({
        title: 'Payment Cancelled',
        description: 'Your payment was cancelled. No charges were made.',
        variant: 'destructive',
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refetchSlots, toast]);

  const handleToggleFleetMap = (enabled: boolean) => {
    if (isFree) {
      toast({
        title: 'Feature Not Available',
        description: 'Fleet Map requires a multi-user organization. Purchase user licenses first.',
        variant: 'destructive',
      });
      return;
    }

    setFleetMapEnabled(enabled);
    toast({
      title: enabled ? 'Fleet Map Enabled' : 'Fleet Map Disabled',
      description: `Fleet Map has been ${enabled ? 'added to' : 'removed from'} your subscription.`,
    });
  };

  const handlePurchaseSlots = (quantity: number) => {
    // This is now handled directly in SlotBasedBilling component
    toast({
      title: 'Redirecting to Checkout',
      description: `Opening Stripe checkout for ${quantity} user license${quantity > 1 ? 's' : ''}...`,
    });
  };

  const handleUpgradeToMultiUser = () => {
    toast({
      title: 'Ready to Upgrade',
      description: 'Purchase user licenses below to start inviting team members.',
    });
    // Scroll to purchase section
    const element = document.querySelector('[data-testid="slot-based-billing"]');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRefreshSubscription = async () => {
    try {
      await checkSubscription();
      await refetchSlots();
      toast({
        title: 'Status Refreshed',
        description: 'Your billing status has been updated.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to refresh billing status.',
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
          <Button variant="outline" size="sm" onClick={handleRefreshSubscription} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant={isFree ? 'secondary' : 'default'}>
            {isFree ? 'Free Plan' : 'User License Plan'}
          </Badge>
        </div>
      </div>

      {/* Plan Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-lg">
                {isFree ? 'Free Single-User Plan' : 'User License Subscription Plan'}
              </div>
              <div className="text-sm text-muted-foreground">
                {isFree 
                  ? 'Perfect for individual users managing their own equipment'
                  : 'Monthly subscription for user licenses at $10 per license per month'
                }
              </div>
              {slotAvailability && slotAvailability.total_purchased > 0 && (
                <div className="text-sm font-medium text-primary mt-1">
                  {slotAvailability.available_slots} of {slotAvailability.total_purchased} licenses available
                </div>
              )}
            </div>
            <div className="text-right">
              {isFree ? (
                <div>
                  <Badge variant="secondary" className="mb-2">Free Forever</Badge>
                  <div className="text-xs text-muted-foreground">
                    No billing required
                  </div>
                </div>
              ) : (
                <div>
                  <Badge variant="default" className="mb-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active Licenses
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    Monthly subscription model
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User License Management */}
      <div data-testid="slot-based-billing">
        <SlotBasedBilling
          storageUsedGB={storageUsedGB}
          fleetMapEnabled={fleetMapEnabled}
          onPurchaseSlots={handlePurchaseSlots}
          onUpgradeToMultiUser={handleUpgradeToMultiUser}
        />
      </div>

      {/* Enhanced Invitation Management */}
      {!isFree && (
        <EnhancedInvitationManagement onPurchaseSlots={handlePurchaseSlots} />
      )}

      {/* Member Billing Details */}
      <RealMemberBilling />

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800 text-sm">
              Error: {error}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Billing;
