import { useOrganization } from '@/contexts/OrganizationContext';
import { useEnhancedOrganizationMembers, useEnhancedOrganizationAdmins, useEnhancedSlotAvailability } from '@/hooks/useEnhancedOrganizationHooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Package } from 'lucide-react';

// Demo component showing how to use enhanced hooks with real-time updates
export const EnhancedOrganizationMembersDemo = () => {
  const { currentOrganization } = useOrganization();
  
  // These hooks now include real-time subscriptions automatically
  const { data: members, isLoading: membersLoading } = useEnhancedOrganizationMembers(currentOrganization?.id);
  const { data: admins, isLoading: adminsLoading } = useEnhancedOrganizationAdmins(currentOrganization?.id);
  const { data: slots, isLoading: slotsLoading } = useEnhancedSlotAvailability(currentOrganization?.id);

  if (!currentOrganization) {
    return <div>No organization selected</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="text-2xl font-bold animate-pulse">Loading...</div>
          ) : (
            <div className="text-2xl font-bold">{members?.length || 0}</div>
          )}
          <Badge variant="secondary" className="mt-2">
            Real-time updates enabled
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Admins</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {adminsLoading ? (
            <div className="text-2xl font-bold animate-pulse">Loading...</div>
          ) : (
            <div className="text-2xl font-bold">{admins?.length || 0}</div>
          )}
          <Badge variant="secondary" className="mt-2">
            Real-time updates enabled
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Slots</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {slotsLoading ? (
            <div className="text-2xl font-bold animate-pulse">Loading...</div>
          ) : (
            <div className="text-2xl font-bold">{slots?.available_slots || 0}</div>
          )}
          <Badge variant="secondary" className="mt-2">
            Real-time updates enabled
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};