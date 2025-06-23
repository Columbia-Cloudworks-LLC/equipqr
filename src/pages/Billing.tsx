
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
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
  const { data: slotAvailability } = useSlotAvailability(currentOrganization?.id || '');
  
  // Mock data for storage - in a real app, this would come from your backend
  const [storageUsedGB] = useState(3.2);
  const [fleetMapEnabled, setFleetMapEnabled] = useState(false);

  const isFree = isFreeOrganization(members);

  const handleToggleFleetMap = (enabled: boolean) => {
    if (isFree) {
      toast({
        title: 'Feature Not Available',
        description: 'Fleet Map requires a multi-user organization. Invite team members first.',
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
    // This would integrate with Stripe to purchase slots
    toast({
      title: 'Purchase Initiated',
      description: `Redirecting to checkout for ${quantity} user license slots...`,
    });
    console.log(`Purchase ${quantity} slots for organization:`, currentOrganization?.id);
  };

  const handleUpgradeToMultiUser = () => {
    toast({
      title: 'Invite Team Members',
      description: 'Redirecting to organization page to invite team members...',
    });
    // In a real app, this would navigate to the organization page
    window.location.href = '/organization';
  };

  const handleRefreshSubscription = async () => {
    try {
      await checkSubscription();
      toast({
        title: 'Subscription Status Refreshed',
        description: 'Your subscription status has been updated.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to refresh subscription status.',
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
            {isFree ? 'Free Plan' : 'Slot-Based Billing'}
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
                {isFree ? 'Free Single-User Plan' : 'Slot-Based Multi-User Plan'}
              </div>
              <div className="text-sm text-muted-foreground">
                {isFree 
                  ? 'Perfect for individual users managing their own equipment'
                  : 'Pre-purchase user license slots and pay for monthly add-ons as needed'
                }
              </div>
              {slotAvailability && slotAvailability.total_purchased > 0 && (
                <div className="text-sm font-medium text-primary mt-1">
                  {slotAvailability.available_slots} of {slotAvailability.total_purchased} slots available
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
                  <Badge variant="default" className="mb-2">Active</Badge>
                  <div className="text-xs text-muted-foreground">
                    Slot-based billing model
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slot-Based Billing Overview */}
      <SlotBasedBilling
        storageUsedGB={storageUsedGB}
        fleetMapEnabled={fleetMapEnabled}
        onPurchaseSlots={handlePurchaseSlots}
        onUpgradeToMultiUser={handleUpgradeToMultiUser}
      />

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
