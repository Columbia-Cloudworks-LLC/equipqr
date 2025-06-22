
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { OrganizationStats } from '@/hooks/useOrganizationStats';
import { getPlanBadgeVariant } from '@/utils/badgeVariants';

interface OrganizationOverviewProps {
  organizationName: string;
  stats: OrganizationStats;
}

const OrganizationOverview: React.FC<OrganizationOverviewProps> = ({ 
  organizationName, 
  stats 
}) => {
  if (stats.isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {organizationName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold">{stats.memberCount}</div>
            <div className="text-sm text-muted-foreground">Active Members</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.adminCount}</div>
            <div className="text-sm text-muted-foreground">Organization Admins</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <Badge variant={getPlanBadgeVariant(stats.plan)}>
              {stats.plan}
            </Badge>
            <div className="text-sm text-muted-foreground mt-1">Current Plan</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold">{stats.featureCount}</div>
            <div className="text-sm text-muted-foreground">Active Features</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationOverview;
