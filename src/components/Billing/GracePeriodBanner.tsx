
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, CreditCard, Shield } from 'lucide-react';
import { useUserBilling } from '@/hooks/useUserBilling';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export function GracePeriodBanner() {
  const { billingInfo, gracePeriodInfo, isLoading, userRole } = useUserBilling();
  const { selectedOrganization } = useOrganization();
  const [isUpgrading, setIsUpgrading] = React.useState(false);

  // Don't show banner if loading or no grace period
  if (isLoading || !gracePeriodInfo?.has_grace_period || !gracePeriodInfo?.is_active) {
    return null;
  }

  const daysRemaining = gracePeriodInfo.days_remaining || 0;
  const isUrgent = daysRemaining <= 7;
  const isOwner = userRole === 'owner';
  const hasExemption = billingInfo?.exemption_applied;
  const exemptionDetails = billingInfo?.exemption_details;

  const handleUpgrade = async () => {
    if (!selectedOrganization) {
      toast.error('No organization selected');
      return;
    }

    try {
      setIsUpgrading(true);
      
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          feature_key: 'fleet_map',
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

  // Determine banner messaging based on exemption status
  let bannerTitle = '';
  let bannerMessage = '';
  let showSubscribeButton = true;

  if (hasExemption) {
    const exemptionType = exemptionDetails?.exemption_type;
    
    if (exemptionType === 'full') {
      bannerTitle = isUrgent ? 'Grace Period Ending Soon' : 'Billing Exemption Active';
      bannerMessage = 'You have a full billing exemption. Premium features like Fleet Map are included at no cost during your exemption period.';
      showSubscribeButton = false; // Don't show subscribe button for full exemptions
    } else if (exemptionType === 'partial') {
      bannerTitle = isUrgent ? 'Action Required' : 'Partial Exemption Active';
      bannerMessage = 'You have a partial billing exemption. Set up a subscription for premium features like Fleet Map.';
    } else {
      bannerTitle = isUrgent ? 'Action Required' : 'Subscription Grace Period';
      bannerMessage = 'Set up a subscription for premium features like Fleet Map.';
    }
  } else {
    bannerTitle = isUrgent ? 'Action Required' : 'Subscription Grace Period';
    bannerMessage = 'Set up a subscription for premium features like Fleet Map.';
  }

  // Use shield icon for exemptions, otherwise use clock/warning
  const IconComponent = hasExemption ? Shield : (isUrgent ? AlertTriangle : Clock);
  const iconColor = hasExemption ? 'text-blue-600' : (isUrgent ? 'text-red-600' : 'text-amber-600');
  const bannerColor = hasExemption ? 'border-blue-200 bg-blue-50' : (isUrgent ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50');
  const textColor = hasExemption ? 'text-blue-800' : (isUrgent ? 'text-red-800' : 'text-amber-800');
  const buttonColor = hasExemption ? 'bg-blue-600 hover:bg-blue-700' : (isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700');

  return (
    <Alert className={`mb-6 ${bannerColor}`}>
      <div className="flex items-start gap-3">
        <IconComponent className={`h-5 w-5 ${iconColor} mt-0.5`} />
        <div className="flex-1">
          <AlertDescription className={textColor}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold mb-1">
                  {bannerTitle}
                </p>
                <p className="text-sm">
                  You have <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> remaining 
                  in your grace period. {bannerMessage}
                  {isUrgent && !hasExemption && ' After this period, access to premium features will be restricted.'}
                </p>
                {hasExemption && (
                  <p className="text-xs mt-1 font-medium flex items-center">
                    <Shield className="inline h-3 w-3 mr-1" />
                    Billing exemption applied
                  </p>
                )}
              </div>
              {showSubscribeButton && (
                <Button 
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className={`ml-4 ${buttonColor}`}
                  size="sm"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isUpgrading ? 'Starting...' : 'Subscribe Now'}
                </Button>
              )}
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
