
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, CreditCard } from 'lucide-react';
import { useUserBilling } from '@/hooks/useUserBilling';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export function NewGracePeriodBanner() {
  const { gracePeriodInfo, isLoading, userRole } = useUserBilling();
  const { selectedOrganization } = useOrganization();
  const [isUpgrading, setIsUpgrading] = React.useState(false);

  // Don't show banner if loading or no grace period
  if (isLoading || !gracePeriodInfo?.has_grace_period || !gracePeriodInfo?.is_active) {
    return null;
  }

  const daysRemaining = gracePeriodInfo.days_remaining || 0;
  const isUrgent = daysRemaining <= 7;
  const isOwner = userRole === 'owner';

  const handleSetupBilling = async () => {
    if (!selectedOrganization) {
      toast.error('No organization selected');
      return;
    }

    if (!isOwner) {
      toast.error('Only organization owners can manage billing');
      return;
    }

    try {
      setIsUpgrading(true);
      
      const { data, error } = await supabase.functions.invoke('create-user-subscription-checkout', {
        body: {
          org_id: selectedOrganization.id
        }
      });

      if (error) {
        console.error('Checkout error:', error);
        toast.error(error.message || 'Failed to start checkout process');
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        toast.error('Failed to create checkout session');
      }

    } catch (err) {
      console.error('Error creating checkout:', err);
      toast.error('Failed to start subscription process');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Alert className={`mb-6 ${isUrgent ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-start gap-3">
        {isUrgent ? (
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
        ) : (
          <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
        )}
        <div className="flex-1">
          <AlertDescription className={isUrgent ? 'text-red-800' : 'text-amber-800'}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold mb-1">
                  {isUrgent ? 'Billing Setup Required' : 'Grace Period Active'}
                </p>
                <p className="text-sm">
                  You have <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> remaining 
                  to set up billing for your equipment tracking. Your organization has {gracePeriodInfo.equipment_count} equipment item{gracePeriodInfo.equipment_count !== 1 ? 's' : ''} that require{gracePeriodInfo.equipment_count === 1 ? 's' : ''} a subscription.
                  {isUrgent && ' After this period, access to equipment features will be restricted.'}
                </p>
              </div>
              {isOwner && (
                <Button 
                  onClick={handleSetupBilling}
                  disabled={isUpgrading}
                  className={`ml-4 ${isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                  size="sm"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isUpgrading ? 'Starting...' : 'Setup Billing'}
                </Button>
              )}
              {!isOwner && (
                <div className="ml-4 text-right">
                  <p className="text-xs font-medium">Contact your organization owner to setup billing</p>
                </div>
              )}
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
