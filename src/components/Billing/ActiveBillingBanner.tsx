
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, CreditCard, Calendar } from 'lucide-react';
import { useUserBilling } from '@/hooks/useUserBilling';
import { useIsMobile } from '@/hooks/use-mobile';

export function ActiveBillingBanner() {
  const { billingInfo, isLoading } = useUserBilling();
  const isMobile = useIsMobile();

  // Don't show banner if loading or no active subscription
  if (isLoading || !billingInfo?.has_active_subscription || !billingInfo?.billing_required) {
    return null;
  }

  const userCount = billingInfo.total_users || 0;
  const billableUsers = billingInfo.billable_users || 0;
  const monthlyCost = billingInfo.monthly_cost_cents / 100;
  const subscriptionDetails = billingInfo.subscription_details;
  const hasExemption = billingInfo.exemption_applied;
  const exemptionDetails = billingInfo.exemption_details;

  // Format next payment date
  let nextPaymentText = '';
  if (subscriptionDetails?.current_period_end) {
    const nextPayment = new Date(subscriptionDetails.current_period_end);
    nextPaymentText = nextPayment.toLocaleDateString();
  }

  // Determine messaging based on exemption status
  let billingMessage = '';
  let exemptionMessage = '';

  if (hasExemption) {
    const exemptionType = exemptionDetails?.exemption_type;
    const freeUserCount = exemptionDetails?.free_user_count;
    
    if (exemptionType === 'full') {
      billingMessage = `Your organization has ${userCount} user${userCount !== 1 ? 's' : ''} (fully exempt from billing).`;
      exemptionMessage = 'Billing exemption active';
    } else if (exemptionType === 'partial') {
      const exemptUsers = Math.min(userCount, freeUserCount || 0);
      billingMessage = `Your organization has ${userCount} user${userCount !== 1 ? 's' : ''} (${exemptUsers} exempt, ${billableUsers} billable). Monthly cost: $${monthlyCost.toFixed(2)}.`;
      exemptionMessage = 'Partial billing exemption active';
    }
  } else {
    billingMessage = `Your organization has ${userCount} user${userCount !== 1 ? 's' : ''} and will be billed $${monthlyCost.toFixed(2)} monthly.`;
  }

  return (
    <Alert className="mb-4 md:mb-6 border-green-200 bg-green-50">
      <div className="flex items-start gap-2 md:gap-3">
        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600 mt-1 md:mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <AlertDescription className="text-green-800">
            {isMobile ? (
              // Mobile layout: vertical stacking
              <div className="space-y-2">
                <div>
                  <p className="font-semibold text-sm mb-1">
                    Billing Active
                  </p>
                  <p className="text-xs leading-relaxed">
                    {billingMessage}
                  </p>
                  {nextPaymentText && (
                    <p className="text-xs mt-1 flex items-center">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Next payment: {nextPaymentText}
                    </p>
                  )}
                  {exemptionMessage && (
                    <p className="text-xs mt-1 font-medium">
                      <CheckCircle className="inline h-3 w-3 mr-1" />
                      {exemptionMessage}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              // Desktop layout: horizontal
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold mb-1">
                    Billing Active
                  </p>
                  <p className="text-sm">
                    {billingMessage}
                    {nextPaymentText && ` Next payment: ${nextPaymentText}.`}
                  </p>
                  {exemptionMessage && (
                    <p className="text-xs mt-1 font-medium flex items-center">
                      <CheckCircle className="inline h-3 w-3 mr-1" />
                      {exemptionMessage}
                    </p>
                  )}
                </div>
                <div className="ml-4 text-right">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
