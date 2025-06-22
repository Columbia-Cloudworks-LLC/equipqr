
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
        <CardContent className="p-4 sm:p-6">
          <div className="h-24 sm:h-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <span className="truncate">{organizationName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4 border rounded-lg">
            <div className="text-xl sm:text-2xl font-bold">{stats.memberCount}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              Active Members
            </div>
          </div>
          <div className="text-center p-3 sm:p-4 border rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.adminCount}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              Organization Admins
            </div>
          </div>
          <div className="text-center p-3 sm:p-4 border rounded-lg col-span-2 lg:col-span-1">
            <Badge variant={getPlanBadgeVariant(stats.plan)} className="mb-2">
              {stats.plan}
            </Badge>
            <div className="text-xs sm:text-sm text-muted-foreground">Current Plan</div>
          </div>
          <div className="text-center p-3 sm:p-4 border rounded-lg col-span-2 lg:col-span-1">
            <div className="text-xl sm:text-2xl font-bold">{stats.featureCount}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              Active Features
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationOverview;
