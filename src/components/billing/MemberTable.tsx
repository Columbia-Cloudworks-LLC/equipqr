
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RealOrganizationMember } from '@/hooks/useOrganizationMembers';

interface MemberTableProps {
  members: RealOrganizationMember[];
}

const MemberTable: React.FC<MemberTableProps> = ({ members }) => {
  const isMobile = useIsMobile();

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

  if (isMobile) {
    return (
      <div className="space-y-3">
        {sortedMembers.map((member, index) => {
          const cost = getMemberCost(member, index);
          const isOwnerAndFree = index === 0 && member.role === 'owner' && member.status === 'active';
          
          return (
            <Card key={member.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center gap-1 truncate">
                      {member.name}
                      {member.role === 'owner' && <Crown className="h-3 w-3 text-yellow-500" />}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{member.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-xs">
                      {member.role}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(member.status)} className="text-xs">
                      {member.status}
                    </Badge>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-mono font-medium">
                      ${cost.toFixed(2)}
                    </div>
                    {isOwnerAndFree && (
                      <div className="text-xs text-muted-foreground">(free)</div>
                    )}
                    {member.status === 'pending' && (
                      <div className="text-xs text-muted-foreground">when active</div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
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
  );
};

export default MemberTable;
