
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Crown, Check, X } from 'lucide-react';
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

  const getLicenseUsage = (member: RealOrganizationMember) => {
    if (member.status === 'active') {
      return { uses: true, icon: <Check className="h-3 w-3 text-green-600" /> };
    }
    if (member.status === 'pending') {
      return { uses: true, icon: <X className="h-3 w-3 text-amber-600" />, note: 'when accepted' };
    }
    return { uses: false, icon: <X className="h-3 w-3 text-muted-foreground" /> };
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
        {sortedMembers.map((member) => {
          const licenseUsage = getLicenseUsage(member);
          
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
                  
                  <div className="flex items-center gap-1">
                    {licenseUsage.icon}
                    <span className="text-sm text-muted-foreground">
                      {licenseUsage.uses ? 'Uses license' : 'No license'}
                      {licenseUsage.note && ` ${licenseUsage.note}`}
                    </span>
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
          <TableHead>License Usage</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedMembers.map((member) => {
          const licenseUsage = getLicenseUsage(member);
          
          return (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallball className="text-xs">
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
                <div className="flex items-center gap-2">
                  {licenseUsage.icon}
                  <span className="text-sm">
                    {licenseUsage.uses ? 'Uses license' : 'No license'}
                    {licenseUsage.note && (
                      <span className="text-muted-foreground ml-1">({licenseUsage.note})</span>
                    )}
                  </span>
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
