
import React from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, CreditCard, Shield } from 'lucide-react';
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

  // Don't show banner if loading, no grace period, or has active subscription
  if (isLoading || 
      !gracePeriodInfo?.has_grace_period || 
      !gracePeriodInfo?.is_active ||
      billingInfo?.has_active_subscription) {
    return null;
  }

  // Don't show if billing is not required (no equipment or no billable users)
  if (!billingInfo?.billing_required) {
    return null;
  }

  const daysRemaining = gracePeriodInfo.days_remaining || 0;
  const isUrgent = daysRemaining <= 7;
  const isOwner = userRole === 'owner';
  const hasExemption = billingInfo?.exemption_applied;
  const exemptionDetails = billingInfo?.exemption_details;

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
  const billableUsers = billingInfo?.billable_users || 0;
  const monthlyCost = billingInfo ? (billingInfo.monthly_cost_cents / 100) : 0;
  
  // Format the user text
  const userText = isMobile 
    ? `${userCount} user${userCount !== 1 ? 's' : ''}`
    : `${userCount} user${userCount !== 1 ? 's' : ''}`;

  const costText = monthlyCost > 0 ? ` (${monthlyCost.toFixed(2)}$/month)` : '';
  
  // Determine banner title and messaging based on exemption status
  let bannerTitle = '';
  let bannerMessage = '';
  let showSetupButton = true;

  if (hasExemption) {
    const exemptionType = exemptionDetails?.exemption_type;
    const freeUserCount = exemptionDetails?.free_user_count;
    
    if (exemptionType === 'full') {
      bannerTitle = isUrgent ? 'Grace Period Ending Soon' : 'Billing Exemption Active';
      bannerMessage = `You have a full billing exemption. Your organization has ${userText}${costText}. ${isUrgent ? 'Complete setup to continue seamless service.' : 'No billing setup required during exemption period.'}`;
      showSetupButton = isUrgent; // Only show setup button if urgent for full exemptions
    } else if (exemptionType === 'partial') {
      const exemptUsers = Math.min(userCount, freeUserCount || 0);
      const exemptText = `${exemptUsers} user${exemptUsers !== 1 ? 's' : ''} exempt`;
      bannerTitle = isUrgent ? 'Billing Setup Required' : 'Partial Exemption Active';
      bannerMessage = `You have a partial billing exemption (${exemptText}). Your organization has ${userText}${costText}. ${isUrgent ? 'Setup billing to avoid service interruption.' : 'Complete setup when ready.'}`;
    } else {
      bannerTitle = isUrgent ? 'Billing Setup Required' : 'Grace Period Active';
      bannerMessage = `Your organization has ${userText}${costText}. ${isUrgent ? 'Setup billing to avoid service interruption.' : 'Complete setup when ready.'}`;
    }
  } else {
    bannerTitle = isUrgent ? 'Billing Setup Required' : 'Grace Period Active';
    bannerMessage = `Your organization has ${userText}${costText}. ${isUrgent ? 'Setup billing to avoid service interruption.' : 'Complete setup when ready.'}`;
  }

  const urgentText = isMobile 
    ? 'User access will be restricted after this period.'
    : 'After this period, access to user features will be restricted.';

  // Use shield icon for exemptions, otherwise use clock/warning
  const IconComponent = hasExemption ? Shield : (isUrgent ? AlertTriangle : Clock);
  const iconColor = hasExemption ? 'text-blue-600' : (isUrgent ? 'text-red-600' : 'text-amber-600');
  const bannerColor = hasExemption ? 'border-blue-200 bg-blue-50' : (isUrgent ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50');
  const textColor = hasExemption ? 'text-blue-800' : (isUrgent ? 'text-red-800' : 'text-amber-800');
  const buttonColor = hasExemption ? 'bg-blue-600 hover:bg-blue-700' : (isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700');

  return (
    <Alert className={`mb-4 md:mb-6 ${bannerColor}`}>
      <div className="flex items-start gap-2 md:gap-3">
        <IconComponent className={`h-4 w-4 md:h-5 md:w-5 ${iconColor} mt-1 md:mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <AlertDescription className={textColor}>
            {isMobile ? (
              // Mobile layout: vertical stacking
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-sm mb-1">
                    {bannerTitle}
                  </p>
                  <p className="text-xs leading-relaxed">
                    <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> remaining. 
                    {bannerMessage}
                    {isUrgent && !hasExemption && ` ${urgentText}`}
                  </p>
                  {hasExemption && (
                    <p className="text-xs mt-1 font-medium">
                      <Shield className="inline h-3 w-3 mr-1" />
                      Billing exemption applied
                    </p>
                  )}
                </div>
                {isOwner && showSetupButton ? (
                  <Button 
                    onClick={handleSetupBilling}
                    disabled={isUpgrading}
                    className={`w-full h-9 text-xs ${buttonColor}`}
                    size="sm"
                  >
                    <CreditCard className="h-3 w-3 mr-1.5" />
                    {isUpgrading ? 'Starting...' : 'Setup Billing'}
                  </Button>
                ) : !isOwner ? (
                  <div className="bg-white/20 rounded-md p-2 mt-2">
                    <p className="text-xs font-medium text-center">Contact your organization owner to setup billing</p>
                  </div>
                ) : null}
              </div>
            ) : (
              // Desktop layout: horizontal
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold mb-1">
                    {bannerTitle}
                  </p>
                  <p className="text-sm">
                    You have <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> remaining. 
                    {bannerMessage}
                    {isUrgent && !hasExemption && ` ${urgentText}`}
                  </p>
                  {hasExemption && (
                    <p className="text-xs mt-1 font-medium flex items-center">
                      <Shield className="inline h-3 w-3 mr-1" />
                      Billing exemption applied
                    </p>
                  )}
                </div>
                {isOwner && showSetupButton && (
                  <Button 
                    onClick={handleSetupBilling}
                    disabled={isUpgrading}
                    className={`ml-4 ${buttonColor}`}
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
