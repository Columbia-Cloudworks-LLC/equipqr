
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react';
import { useUnifiedOrganization } from '@/contexts/UnifiedOrganizationContext';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useSlotAvailability } from '@/hooks/useOrganizationSlots';
import { calculateEnhancedBilling, getSlotStatus } from '@/utils/enhancedBillingUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SlotBasedBillingProps {
  storageUsedGB: number;
  fleetMapEnabled: boolean;
  onPurchaseSlots: (quantity: number) => void;
  onUpgradeToMultiUser: () => void;
}

const SlotBasedBilling: React.FC<SlotBasedBillingProps> = ({
  storageUsedGB,
  fleetMapEnabled,
  onPurchaseSlots,
  onUpgradeToMultiUser
}) => {
  const { currentOrganization } = useUnifiedOrganization();
  const { data: members = [] } = useOrganizationMembers(currentOrganization?.id || '');
  const { data: slotAvailability, isLoading } = useSlotAvailability(currentOrganization?.id || '');

  const handlePurchaseLicenses = async (quantity: number) => {
    if (!currentOrganization) {
      toast.error('No organization selected');
      return;
    }

    try {
      toast.loading(`Creating checkout for ${quantity} user license${quantity > 1 ? 's' : ''}...`);
      
      const { data, error } = await supabase.functions.invoke('purchase-user-licenses', {
        body: { 
          quantity, 
          organizationId: currentOrganization.id 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      toast.success('Redirecting to Stripe checkout...');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create checkout';
      console.error('Error creating license checkout:', err);
      toast.error(errorMessage);
    }
  };

  if (isLoading || !slotAvailability) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-48 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const billing = calculateEnhancedBilling(members, slotAvailability, storageUsedGB, fleetMapEnabled);
  const slotStatus = getSlotStatus(slotAvailability, billing.currentUsage.totalSlotsNeeded);
  const isFreeOrg = members.filter(m => m.status === 'active').length === 1;

  const slotUsagePercentage = billing.userSlots.totalPurchased > 0 
    ? (billing.userSlots.slotsUsed / billing.userSlots.totalPurchased) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Slot Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User License Slots
              <Badge variant={slotStatus.variant}>{slotStatus.message}</Badge>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Monthly Value</div>
              <div className="text-lg font-bold">${(billing.userSlots.totalPurchased * 10).toFixed(2)}</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isFreeOrg && (
              <>
                {billing.userSlots.totalPurchased > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Slot Usage</span>
                      <span>{billing.userSlots.slotsUsed} / {billing.userSlots.totalPurchased}</span>
                    </div>
                    <Progress value={slotUsagePercentage} className="h-2" />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold">{billing.userSlots.totalPurchased}</div>
                    <div className="text-sm text-muted-foreground">Licenses Owned</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold">{billing.userSlots.slotsUsed}</div>
                    <div className="text-sm text-muted-foreground">Licenses Used</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold">{billing.userSlots.availableSlots}</div>
                    <div className="text-sm text-muted-foreground">Available</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold">$10</div>
                    <div className="text-sm text-muted-foreground">Per License</div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Current Usage Breakdown</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Active users (excluding owner)</span>
                      <span>{billing.currentUsage.activeUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending invitations</span>
                      <span>{billing.currentUsage.pendingInvitations}</span>
                    </div>
                    <div className="border-t pt-1 mt-2 flex justify-between font-medium">
                      <span>Total licenses needed</span>
                      <span>{billing.currentUsage.totalSlotsNeeded}</span>
                    </div>
                  </div>
                </div>

                {/* Low slots warning */}
                {slotStatus.status === 'low' && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      You're running low on available licenses. Purchase more to continue inviting team members.
                    </AlertDescription>
                  </Alert>
                )}

                {/* No slots warning */}
                {slotStatus.status === 'exhausted' && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      All your licenses are used. Purchase more licenses to invite additional team members.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium">Purchase User Licenses</h4>
                  <p className="text-sm text-muted-foreground">
                    Monthly subscription for user licenses at $10 per license. Cancel anytime.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handlePurchaseLicenses(5)}
                      className="flex-1"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Buy 5 Licenses ($50/mo)
                    </Button>
                    <Button 
                      onClick={() => handlePurchaseLicenses(10)}
                      variant="outline"
                      className="flex-1"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Buy 10 Licenses ($100/mo)
                    </Button>
                  </div>
                  <Button 
                    onClick={() => handlePurchaseLicenses(25)}
                    variant="outline"
                    className="w-full"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buy 25 Licenses ($250/mo)
                  </Button>
                </div>
              </>
            )}

            {isFreeOrg && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-blue-900 mb-1">
                      Upgrade to Multi-User Plan
                    </div>
                    <div className="text-sm text-blue-800 mb-3">
                      Purchase user license subscriptions to enable team collaboration. 
                      Pay monthly per license and invite team members instantly.
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={onUpgradeToMultiUser} size="sm">
                        Start Inviting Members
                      </Button>
                      <Button 
                        onClick={() => handlePurchaseLicenses(5)} 
                        variant="outline" 
                        size="sm"
                      >
                        Buy 5 Licenses ($50/mo)
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estimated Next Billing */}
      {!isFreeOrg && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estimated Next Billing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-2xl font-bold">${billing.estimatedNextBilling.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">
                Monthly recurring charges for user licenses and add-ons
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>User licenses ({billing.userSlots.totalPurchased})</span>
                  <span>${(billing.userSlots.totalPurchased * 10).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage overage</span>
                  <span>${billing.storage.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fleet Map add-on</span>
                  <span>${billing.fleetMap.cost.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Total estimated</span>
                  <span>${billing.estimatedNextBilling.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SlotBasedBilling;
