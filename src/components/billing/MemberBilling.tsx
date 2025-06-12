
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, UserMinus } from 'lucide-react';
import { OrganizationMember } from '@/types/organization';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MemberBillingProps {
  members: OrganizationMember[];
  onRemoveMember: (memberId: string) => void;
}

const MemberBilling: React.FC<MemberBillingProps> = ({ members, onRemoveMember }) => {
  const activeMembersCount = members.filter(member => member.status === 'active').length;
  const totalMembersCost = activeMembersCount * 10;

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

  const getMemberCost = (status: string) => {
    return status === 'active' ? 10 : 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Billing ({members.length} members)
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
            Each active member costs $10/month. Pending members are not billed until they accept their invitation.
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Monthly Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
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
                    <Badge variant={getStatusBadgeVariant(member.status)}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono">
                      ${getMemberCost(member.status)}
                      {member.status === 'pending' && (
                        <span className="text-sm text-muted-foreground ml-1">(not billed)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveMember(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {activeMembersCount} active members × $10/month
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

export default MemberBilling;
