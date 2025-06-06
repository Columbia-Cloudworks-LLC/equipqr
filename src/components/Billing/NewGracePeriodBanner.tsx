
import React from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, CreditCard } from 'lucide-react';
import { useUserBilling } from '@/hooks/useUserBilling';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

export function NewGracePeriodBanner() {
  const { billingInfo, gracePeriodInfo, isLoading, userRole } = useUserBilling();
  const { selectedOrganization } = useOrganization();
  const [isUpgrading, setIsUpgrading] = React.useState(false);
  const isMobile = useIsMobile();

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

  // Get user count and monthly cost from billing info
  const userCount = billingInfo?.total_users || gracePeriodInfo?.equipment_count || 0;
  const monthlyCost = billingInfo ? (billingInfo.monthly_cost_cents / 100) : 0;
  
  // Format the user text with link
  const userText = isMobile 
    ? `${userCount} user${userCount !== 1 ? 's' : ''}`
    : `${userCount} user${userCount !== 1 ? 's' : ''}`;

  const costText = monthlyCost > 0 ? ` (${monthlyCost.toFixed(2)}$/month)` : '';
  
  const urgentText = isMobile 
    ? 'User access will be restricted after this period.'
    : 'After this period, access to user features will be restricted.';

  return (
    <Alert className={`mb-4 md:mb-6 ${isUrgent ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-start gap-2 md:gap-3">
        {isUrgent ? (
          <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600 mt-1 md:mt-0.5 flex-shrink-0" />
        ) : (
          <Clock className="h-4 w-4 md:h-5 md:w-5 text-amber-600 mt-1 md:mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <AlertDescription className={isUrgent ? 'text-red-800' : 'text-amber-800'}>
            {isMobile ? (
              // Mobile layout: vertical stacking
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-sm mb-1">
                    {isUrgent ? 'Billing Setup Required' : 'Grace Period Active'}
                  </p>
                  <p className="text-xs leading-relaxed">
                    <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> remaining to set up billing. 
                    Your organization has{' '}
                    <Link 
                      to="/organization?tab=members" 
                      className="underline hover:no-underline font-medium"
                    >
                      {userText}
                    </Link>
                    {costText}.
                    {isUrgent && ` ${urgentText}`}
                  </p>
                </div>
                {isOwner ? (
                  <Button 
                    onClick={handleSetupBilling}
                    disabled={isUpgrading}
                    className={`w-full h-9 text-xs ${isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                    size="sm"
                  >
                    <CreditCard className="h-3 w-3 mr-1.5" />
                    {isUpgrading ? 'Starting...' : 'Setup Billing'}
                  </Button>
                ) : (
                  <div className="bg-white/20 rounded-md p-2 mt-2">
                    <p className="text-xs font-medium text-center">Contact your organization owner to setup billing</p>
                  </div>
                )}
              </div>
            ) : (
              // Desktop layout: horizontal
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold mb-1">
                    {isUrgent ? 'Billing Setup Required' : 'Grace Period Active'}
                  </p>
                  <p className="text-sm">
                    You have <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> remaining 
                    to set up billing. Your organization has{' '}
                    <Link 
                      to="/organization?tab=members" 
                      className="underline hover:no-underline font-medium"
                    >
                      {userText}
                    </Link>
                    {costText}.
                    {isUrgent && ` ${urgentText}`}
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
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
