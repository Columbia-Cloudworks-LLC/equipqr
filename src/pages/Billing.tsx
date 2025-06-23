
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
import RealMemberBilling from '@/components/billing/RealMemberBilling';
import OrganizationBilling from '@/components/billing/OrganizationBilling';
import { useUnifiedOrganization } from '@/contexts/UnifiedOrganizationContext';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from '@/hooks/use-toast';

const Billing = () => {
  const { currentOrganization } = useUnifiedOrganization();
  const { subscriptionData, isLoading, error, checkSubscription } = useSubscription();
  
  // Mock data for storage - in a real app, this would come from your backend
  const [storageUsedGB] = useState(3.2); // Example: 3.2GB used
  const [fleetMapEnabled, setFleetMapEnabled] = useState(false);

  const handleToggleFleetMap = (enabled: boolean) => {
    setFleetMapEnabled(enabled);
    toast({
      title: enabled ? 'Fleet Map Enabled' : 'Fleet Map Disabled',
      description: `Fleet Map has been ${enabled ? 'added to' : 'removed from'} your subscription.`,
    });
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
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            Manage your organization's billing and usage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshSubscription} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant="default">
            {currentOrganization.name}
          </Badge>
        </div>
      </div>

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Current Plan</div>
              <div className="text-sm text-muted-foreground">
                Pay-as-you-go billing based on usage
              </div>
            </div>
            <Badge variant="default">
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Organization Billing Overview */}
      <OrganizationBilling
        storageUsedGB={storageUsedGB}
        fleetMapEnabled={fleetMapEnabled}
        onToggleFleetMap={handleToggleFleetMap}
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
                  First user is free, additional users are $10/month each
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="font-semibold text-lg">Storage</div>
                <div className="text-2xl font-bold text-primary">$0.10</div>
                <div className="text-sm text-muted-foreground">per GB/month</div>
                <div className="text-xs text-muted-foreground mt-2">
                  5GB included free, $0.10/GB for additional storage
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="font-semibold text-lg">Fleet Map</div>
                <div className="text-2xl font-bold text-primary">$10</div>
                <div className="text-sm text-muted-foreground">per month</div>
                <div className="text-xs text-muted-foreground mt-2">
                  Interactive map visualization add-on
                </div>
              </div>
            </div>
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
