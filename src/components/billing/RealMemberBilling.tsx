
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import { useOrganizationMembers, RealOrganizationMember } from '@/hooks/useOrganizationMembers';
import { useUnifiedOrganization } from '@/contexts/UnifiedOrganizationContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const RealMemberBilling: React.FC = () => {
  const { currentOrganization } = useUnifiedOrganization();
  const { data: members = [], isLoading } = useOrganizationMembers(currentOrganization?.id || '');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const activeMembersCount = members.filter(member => member.status === 'active').length;
  const billableMembers = Math.max(0, activeMembersCount - 1); // First user is free
  const totalMembersCost = billableMembers * 10;

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
    if (index === 0 && member.role === 'owner') return 0; // First user (owner) is free
    return 10;
  };

  // Sort members to put owner first
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'owner') return -1;
    if (b.role === 'owner') return 1;
    return 0;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Licenses ({members.length} total)
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Monthly Subtotal</div>
            <div className="text-lg font-bold">${totalMembersCost}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Your first user is free. Each additional active user costs $10/month. Pending users are not billed until they accept their invitation.
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
              {sortedMembers.map((member, index) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
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
                      ${getMemberCost(member, index)}
                      {index === 0 && member.role === 'owner' && member.status === 'active' && (
                        <span className="text-sm text-muted-foreground ml-1">(free)</span>
                      )}
                      {member.status === 'pending' && (
                        <span className="text-sm text-muted-foreground ml-1">(not billed)</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {billableMembers} billable users × $10/month (first user free)
            </div>
            <div className="text-lg font-bold">
              Monthly Subtotal: ${totalMembersCost}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealMemberBilling;
