
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, AlertCircle, Calendar } from 'lucide-react';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useSlotAvailability } from '@/hooks/useOrganizationSlots';
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { calculateLicenseBilling, hasLicenses, getLicenseStatus } from '@/utils/licenseBillingUtils';
import PurchaseLicensesButton from '@/components/billing/PurchaseLicensesButton';
import MemberTable from '@/components/billing/MemberTable';
import { useIsMobile } from '@/hooks/use-mobile';

const LicenseMemberBilling: React.FC = () => {
  const { currentOrganization } = useSimpleOrganization();
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(currentOrganization?.id || '');
  const { data: slotAvailability, isLoading: slotsLoading } = useSlotAvailability(currentOrganization?.id || '');
  const isMobile = useIsMobile();

  const userRole = currentOrganization?.userRole;
  const canManageBilling = ['owner', 'admin'].includes(userRole || '');

  if (membersLoading || slotsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!slotAvailability) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Unable to load license information
          </div>
        </CardContent>
      </Card>
    );
  }

  const billing = calculateLicenseBilling(members, slotAvailability);
  const hasActiveLicenses = hasLicenses(slotAvailability);
  const licenseStatus = getLicenseStatus(slotAvailability, members.filter(m => m.status === 'active').length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold">User Licenses</h3>
              <p className="text-sm text-muted-foreground font-normal">
                {billing.userLicenses.totalPurchased} purchased
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-sm text-muted-foreground">Monthly Cost</div>
            <div className="text-2xl font-bold">${billing.userLicenses.monthlyLicenseCost.toFixed(2)}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* License Status Badge */}
        <div className="flex items-center gap-2">
          <Badge variant={licenseStatus.variant} className="font-medium">
            {licenseStatus.message}
          </Badge>
        </div>

        {/* Description */}
        <div className="text-sm text-muted-foreground leading-relaxed">
          {hasActiveLicenses 
            ? `License-based subscription: You pay $${billing.userLicenses.costPerLicense}/month per purchased license, regardless of usage. This ensures predictable billing and allows you to manage team capacity effectively.`
            : 'Purchase user licenses to enable team collaboration. Each license costs $10/month and allows one team member to access the platform.'
          }
        </div>

        {/* License Counts - Mobile Optimized */}
        {hasActiveLicenses && (
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{billing.userLicenses.totalPurchased}</div>
                <div className="text-sm text-muted-foreground mt-1">Purchased</div>
              </div>
              {billing.userLicenses.exemptedSlots > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{billing.userLicenses.exemptedSlots}</div>
                  <div className="text-sm text-muted-foreground mt-1">Exempted</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{billing.userLicenses.slotsUsed}</div>
                <div className="text-sm text-muted-foreground mt-1">In Use</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{billing.userLicenses.availableSlots}</div>
                <div className="text-sm text-muted-foreground mt-1">Available</div>
              </div>
            </div>
          </div>
        )}

        {/* Next Billing Date - Dark Mode Optimized */}
        {billing.userLicenses.nextBillingDate && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-blue-900 dark:text-blue-100">Next Billing:</span>{' '}
              <span className="text-blue-800 dark:text-blue-200">
                {new Date(billing.userLicenses.nextBillingDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
        
        {/* Member Table */}
        <MemberTable members={members} />
        
        {/* Billing Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {hasActiveLicenses 
              ? `${billing.userLicenses.totalPurchased} licenses × $${billing.userLicenses.costPerLicense}/month`
              : 'No licenses purchased'
            }
          </div>
          <div className="text-lg font-bold">
            Monthly Total: ${billing.userLicenses.monthlyLicenseCost.toFixed(2)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          {canManageBilling ? (
            <PurchaseLicensesButton variant="outline" className="w-full sm:w-auto sm:self-start" />
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Admin access required
                  </div>
                  <div className="text-amber-800 dark:text-amber-200">
                    Only organization owners and admins can purchase licenses and manage billing.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LicenseMemberBilling;
