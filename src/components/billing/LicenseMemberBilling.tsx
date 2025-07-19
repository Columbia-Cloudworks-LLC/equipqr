
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, AlertCircle, Calendar } from 'lucide-react';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useSlotAvailability } from '@/hooks/useOrganizationSlots';
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { useSession } from '@/contexts/SessionContext';
import { calculateLicenseBilling, hasLicenses, getLicenseStatus } from '@/utils/licenseBillingUtils';
import PurchaseLicensesButton from '@/components/billing/PurchaseLicensesButton';
import MemberTable from '@/components/billing/MemberTable';
import { useIsMobile } from '@/hooks/use-mobile';

const LicenseMemberBilling: React.FC = () => {
  const { currentOrganization } = useSimpleOrganization();
  const { getCurrentOrganization } = useSession();
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(currentOrganization?.id || '');
  const { data: slotAvailability, isLoading: slotsLoading } = useSlotAvailability(currentOrganization?.id || '');
  const isMobile = useIsMobile();

  const sessionOrganization = getCurrentOrganization();
  const userRole = sessionOrganization?.userRole;
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
        <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-lg sm:text-xl">
              User Licenses ({billing.userLicenses.totalPurchased} purchased)
            </span>
            <Badge variant={licenseStatus.variant}>
              {licenseStatus.message}
            </Badge>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-sm text-muted-foreground">Monthly Cost</div>
            <div className="text-lg font-bold">${billing.userLicenses.monthlyLicenseCost.toFixed(2)}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {hasActiveLicenses 
              ? `License-based subscription: You pay $${billing.userLicenses.costPerLicense}/month per purchased license, regardless of usage. This ensures predictable billing and allows you to manage team capacity effectively.`
              : 'Purchase user licenses to enable team collaboration. Each license costs $10/month and allows one team member to access the platform.'
            }
          </div>

          {hasActiveLicenses && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{billing.userLicenses.totalPurchased}</div>
                <div className="text-sm text-muted-foreground">Total Licenses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{billing.userLicenses.slotsUsed}</div>
                <div className="text-sm text-muted-foreground">In Use</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{billing.userLicenses.availableSlots}</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
            </div>
          )}

          {billing.userLicenses.nextBillingDate && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div className="text-sm">
                <strong>Next Billing:</strong> {new Date(billing.userLicenses.nextBillingDate).toLocaleDateString()}
              </div>
            </div>
          )}
          
          <MemberTable members={members} />
          
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

          <div className="flex flex-col gap-3 pt-4">
            {canManageBilling ? (
              <PurchaseLicensesButton variant="outline" className="w-full sm:w-auto" />
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <strong>Admin access required:</strong> Only organization owners and admins can purchase licenses and manage billing.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LicenseMemberBilling;
