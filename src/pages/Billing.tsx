
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Users, Crown, AlertCircle } from 'lucide-react';
import StripeSetup from '@/components/billing/StripeSetup';
import MemberBilling from '@/components/billing/MemberBilling';
import PremiumFeaturesBilling from '@/components/billing/PremiumFeaturesBilling';
import { mockOrganization, mockMembers } from '@/data/mockOrganization';
import { OrganizationMember } from '@/types/organization';
import { toast } from '@/hooks/use-toast';

const Billing = () => {
  const [organization, setOrganization] = useState(mockOrganization);
  const [members, setMembers] = useState<OrganizationMember[]>(mockMembers);
  const [stripeConnected, setStripeConnected] = useState(false);

  const activeMembersCount = members.filter(member => member.status === 'active').length;
  const membersCost = activeMembersCount * 10; // $10 per active member

  const handleStripeSetup = () => {
    setStripeConnected(true);
    toast({
      title: 'Stripe Connected',
      description: 'Your Stripe account has been successfully connected.',
    });
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers(prev => prev.filter(member => member.id !== memberId));
    toast({
      title: 'Member Removed',
      description: 'Member has been removed from billing.',
    });
  };

  const handleFeatureToggle = (featureId: string, enabled: boolean) => {
    toast({
      title: enabled ? 'Feature Enabled' : 'Feature Disabled',
      description: `Feature has been ${enabled ? 'added to' : 'removed from'} your billing.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            Manage your organization's billing and subscriptions
          </p>
        </div>
        <Badge variant={stripeConnected ? 'default' : 'secondary'}>
          {stripeConnected ? 'Stripe Connected' : 'Setup Required'}
        </Badge>
      </div>

      {/* Billing Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">${membersCost}</div>
              <div className="text-sm text-muted-foreground">Monthly Member Cost</div>
              <div className="text-xs text-muted-foreground mt-1">
                {activeMembersCount} active members × $10
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">$0</div>
              <div className="text-sm text-muted-foreground">Premium Features</div>
              <div className="text-xs text-muted-foreground mt-1">
                No premium features enabled
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">${membersCost}</div>
              <div className="text-sm text-muted-foreground">Total Monthly</div>
              <div className="text-xs text-muted-foreground mt-1">
                Next billing: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Setup */}
      <StripeSetup 
        isConnected={stripeConnected}
        onSetup={handleStripeSetup}
      />

      {/* Member Billing */}
      <MemberBilling
        members={members}
        onRemoveMember={handleRemoveMember}
      />

      {/* Premium Features */}
      <PremiumFeaturesBilling
        organization={organization}
        onFeatureToggle={handleFeatureToggle}
      />

      {!stripeConnected && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Connect your Stripe account to enable billing and subscription management.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Billing;
