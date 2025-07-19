
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Crown, Plus, AlertCircle } from 'lucide-react';
import { useOrganizationMembers, RealOrganizationMember } from '@/hooks/useOrganizationMembers';
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { useSession } from '@/contexts/SessionContext';
import { calculateSimplifiedBilling, isFreeOrganization } from '@/utils/simplifiedBillingUtils';
import PurchaseLicensesButton from '@/components/billing/PurchaseLicensesButton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const SimplifiedMemberBilling: React.FC = () => {
  const { currentOrganization } = useSimpleOrganization();
  const { getCurrentOrganization } = useSession();
  const { data: members = [], isLoading } = useOrganizationMembers(currentOrganization?.id || '');

  const sessionOrganization = getCurrentOrganization();
  const userRole = sessionOrganization?.userRole;
  const canManageBilling = ['owner', 'admin'].includes(userRole || '');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const billing = calculateSimplifiedBilling(members);
  const isFree = isFreeOrganization(members);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getMemberCost = (member: RealOrganizationMember, index: number) => {
    if (member.status !== 'active') return 0;
    // First active user (owner) is free
    if (index === 0 && member.role === 'owner') return 0;
    return 10;
  };

  // Sort members to put owner first, then by active status
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'owner') return -1;
    if (b.role === 'owner') return 1;
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    return 0;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Licenses ({billing.userLicenses.totalUsers} total members)
            {isFree && <Badge variant="secondary">Free Plan</Badge>}
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Monthly Cost</div>
            <div className="text-lg font-bold">${billing.userLicenses.totalCost.toFixed(2)}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {isFree 
              ? 'Your single-user organization is free forever. Purchase user licenses to unlock collaboration features at $10/month per additional user.'
              : 'Simple pay-as-you-go pricing: Your first user is always free, then $10/month per additional active user. No complicated billing or limits.'
            }
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Monthly Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMembers.map((member, index) => {
                const cost = getMemberCost(member, index);
                const isOwnerAndFree = index === 0 && member.role === 'owner' && member.status === 'active';
                
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            {member.name}
                            {member.role === 'owner' && <Crown className="h-3 w-3 text-yellow-500" />}
                          </div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(member.status)}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono">
                        ${cost.toFixed(2)}
                        {isOwnerAndFree && (
                          <span className="text-sm text-muted-foreground ml-1">(free)</span>
                        )}
                        {member.status === 'pending' && (
                          <span className="text-sm text-muted-foreground ml-1">(will be billed when active)</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {isFree 
                ? 'Free single-user plan'
                : `${billing.userLicenses.billableUsers} billable users × $${billing.userLicenses.costPerUser}/month (first user free)`
              }
            </div>
            <div className="text-lg font-bold">
              Monthly Total: ${billing.userLicenses.totalCost.toFixed(2)}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {canManageBilling ? (
              <div className="flex gap-2 flex-1">
                <PurchaseLicensesButton variant="outline" className="flex-1" />
              </div>
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

export default SimplifiedMemberBilling;
