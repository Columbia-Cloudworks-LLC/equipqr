
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users } from 'lucide-react';
import { OrganizationStats } from '@/hooks/useOrganizationStats';
import { useSlotAvailability } from '@/hooks/useOrganizationSlots';
import { getPlanBadgeVariant } from '@/utils/badgeVariants';

interface OrganizationOverviewProps {
  organizationName: string;
  organizationId: string;
  stats: OrganizationStats;
}

const OrganizationOverview: React.FC<OrganizationOverviewProps> = ({ 
  organizationName,
  organizationId, 
  stats 
}) => {
  const { data: slotAvailability, isLoading: slotsLoading } = useSlotAvailability(organizationId);
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
            {slotsLoading ? (
              <div className="h-8 bg-muted animate-pulse rounded mb-2" />
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {slotAvailability?.available_slots || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  of {slotAvailability?.total_purchased || 0} purchased
                </div>
              </>
            )}
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Available Slots</div>
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
