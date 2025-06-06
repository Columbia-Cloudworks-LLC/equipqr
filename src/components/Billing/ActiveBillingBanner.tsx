
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, CreditCard, Calendar, Shield } from 'lucide-react';
import { useUserBilling } from '@/hooks/useUserBilling';
import { useIsMobile } from '@/hooks/use-mobile';

export function ActiveBillingBanner() {
  const { billingInfo, isLoading } = useUserBilling();
  const isMobile = useIsMobile();

  // Enhanced logging for debugging
  console.log('[ActiveBillingBanner] Render state:', {
    isLoading,
    hasActiveSubscription: billingInfo?.has_active_subscription,
    billingRequired: billingInfo?.billing_required,
    exemptionApplied: billingInfo?.exemption_applied,
    exemptionType: billingInfo?.exemption_details?.exemption_type
  });

  // Don't show banner if loading
  if (isLoading) {
    console.log('[ActiveBillingBanner] Not showing: loading');
    return null;
  }

  // Show banner for active subscriptions OR full exemptions (when billing would be required)
  const hasActiveSubscription = billingInfo?.has_active_subscription;
  const hasFullExemption = billingInfo?.exemption_applied && 
                          billingInfo?.exemption_details?.exemption_type === 'full';
  const billingRequired = billingInfo?.billing_required;

  if (!hasActiveSubscription && !hasFullExemption) {
    console.log('[ActiveBillingBanner] Not showing: no active subscription and no full exemption');
    return null;
  }

  if (!billingRequired) {
    console.log('[ActiveBillingBanner] Not showing: billing not required');
    return null;
  }

  console.log('[ActiveBillingBanner] Showing banner for:', hasActiveSubscription ? 'active subscription' : 'full exemption');

  const userCount = billingInfo.total_users || 0;
  const billableUsers = billingInfo.billable_users || 0;
  const monthlyCost = billingInfo.monthly_cost_cents / 100;
  const subscriptionDetails = billingInfo.subscription_details;
  const exemptionDetails = billingInfo.exemption_details;

  // Format next payment date
  let nextPaymentText = '';
  if (subscriptionDetails?.current_period_end) {
    const nextPayment = new Date(subscriptionDetails.current_period_end);
    nextPaymentText = nextPayment.toLocaleDateString();
  }

  // Determine messaging based on subscription vs exemption
  let billingMessage = '';
  let statusMessage = '';
  let showPaymentInfo = false;

  if (hasActiveSubscription) {
    statusMessage = 'Billing Active';
    billingMessage = `Your organization has ${userCount} user${userCount !== 1 ? 's' : ''} and will be billed $${monthlyCost.toFixed(2)} monthly.`;
    showPaymentInfo = true;
  } else if (hasFullExemption) {
    statusMessage = 'Full Exemption Active';
    billingMessage = `Your organization has ${userCount} user${userCount !== 1 ? 's' : ''} (fully exempt from billing).`;
    showPaymentInfo = false;
  }

  const iconColor = hasActiveSubscription ? 'text-green-600' : 'text-blue-600';
  const bannerColor = hasActiveSubscription ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50';
  const textColor = hasActiveSubscription ? 'text-green-800' : 'text-blue-800';
  const IconComponent = hasActiveSubscription ? CheckCircle : Shield;

  return (
    <Alert className={`mb-4 md:mb-6 ${bannerColor}`}>
      <div className="flex items-start gap-2 md:gap-3">
        <IconComponent className={`h-4 w-4 md:h-5 md:w-5 ${iconColor} mt-1 md:mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <AlertDescription className={textColor}>
            {isMobile ? (
              // Mobile layout: vertical stacking
              <div className="space-y-2">
                <div>
                  <p className="font-semibold text-sm mb-1">
                    {statusMessage}
                  </p>
                  <p className="text-xs leading-relaxed">
                    {billingMessage}
                  </p>
                  {showPaymentInfo && nextPaymentText && (
                    <p className="text-xs mt-1 flex items-center">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Next payment: {nextPaymentText}
                    </p>
                  )}
                  {hasFullExemption && (
                    <p className="text-xs mt-1 font-medium">
                      <Shield className="inline h-3 w-3 mr-1" />
                      Full billing exemption applied
                    </p>
                  )}
                </div>
              </div>
            ) : (
              // Desktop layout: horizontal
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold mb-1">
                    {statusMessage}
                  </p>
                  <p className="text-sm">
                    {billingMessage}
                    {showPaymentInfo && nextPaymentText && ` Next payment: ${nextPaymentText}.`}
                  </p>
                  {hasFullExemption && (
                    <p className="text-xs mt-1 font-medium flex items-center">
                      <Shield className="inline h-3 w-3 mr-1" />
                      Full billing exemption applied
                    </p>
                  )}
                </div>
                <div className="ml-4 text-right">
                  {hasActiveSubscription ? (
                    <CreditCard className="h-5 w-5 text-green-600" />
                  ) : (
                    <Shield className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
