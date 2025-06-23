
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, AlertCircle, RefreshCw, UserPlus, Crown } from 'lucide-react';
import RealMemberBilling from '@/components/billing/RealMemberBilling';
import UpdatedOrganizationBilling from '@/components/billing/UpdatedOrganizationBilling';
import { useUnifiedOrganization } from '@/contexts/UnifiedOrganizationContext';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from '@/hooks/use-toast';
import { isFreeOrganization, calculateTotalBilling } from '@/utils/billingUtils';
import { getOrganizationRestrictions } from '@/utils/organizationRestrictions';

const Billing = () => {
  const { currentOrganization } = useUnifiedOrganization();
  const { data: members = [] } = useOrganizationMembers(currentOrganization?.id || '');
  const { subscriptionData, isLoading, error, checkSubscription } = useSubscription();
  
  // Mock data for storage - in a real app, this would come from your backend
  const [storageUsedGB] = useState(3.2);
  const [fleetMapEnabled, setFleetMapEnabled] = useState(false);

  const isFree = isFreeOrganization(members);
  const billing = calculateTotalBilling(members, storageUsedGB, fleetMapEnabled);
  const restrictions = getOrganizationRestrictions(members, fleetMapEnabled);

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
            {isFree ? 'Free Plan' : 'Pay-as-you-go'}
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
                {isFree ? 'Free Single-User Plan' : 'Pay-as-you-go Multi-User Plan'}
              </div>
              <div className="text-sm text-muted-foreground">
                {isFree 
                  ? 'Perfect for individual users managing their own equipment'
                  : 'Flexible billing based on actual usage and team size'
                }
              </div>
              {!isFree && (
                <div className="text-sm font-medium text-primary mt-1">
                  Monthly Total: ${billing.total.toFixed(2)}
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
                    Next billing: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Free Plan Upgrade Prompt */}
      {isFree && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-blue-900 mb-1">
                  Unlock Team Collaboration Features
                </div>
                <div className="text-sm text-blue-800 mb-3">
                  Invite team members to unlock team management, equipment assignment, 
                  image uploads, storage, and premium add-ons like Fleet Map.
                </div>
                <Button onClick={handleUpgradeToMultiUser}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Team Members
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organization Billing Overview */}
      <UpdatedOrganizationBilling
        storageUsedGB={storageUsedGB}
        fleetMapEnabled={fleetMapEnabled}
        onToggleFleetMap={handleToggleFleetMap}
        onUpgradeToMultiUser={handleUpgradeToMultiUser}
      />

      {/* Member Billing Details */}
      <RealMemberBilling />

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="font-semibold text-lg">User Licenses</div>
                <div className="text-2xl font-bold text-primary">$10</div>
                <div className="text-sm text-muted-foreground">per user/month</div>
                <div className="text-xs text-muted-foreground mt-2">
                  First user is always free. Additional active users are $10/month each.
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="font-semibold text-lg">Storage</div>
                <div className="text-2xl font-bold text-primary">$0.10</div>
                <div className="text-sm text-muted-foreground">per GB/month</div>
                <div className="text-xs text-muted-foreground mt-2">
                  5GB included free for multi-user organizations. $0.10/GB for additional storage.
                </div>
              </div>
              
              <div className="p-4 border rounded-lg relative">
                <div className="font-semibold text-lg flex items-center gap-1">
                  Fleet Map 
                  <Crown className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-primary">$10</div>
                <div className="text-sm text-muted-foreground">per month</div>
                <div className="text-xs text-muted-foreground mt-2">
                  Interactive equipment location mapping add-on
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Free Plan:</strong> Perfect for individual users. Includes basic equipment management, 
                work orders, and QR scanning. Upgrade to multi-user to unlock team features, storage, and premium add-ons.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

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
