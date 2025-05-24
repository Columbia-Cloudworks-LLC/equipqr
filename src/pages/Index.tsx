
import { DashboardStat } from '@/types';
import { DashboardStats } from '@/components/Dashboard/DashboardStats';
import { DashboardEquipmentMap } from '@/components/Dashboard/DashboardEquipmentMap';
import { Layout } from '@/components/Layout/Layout';
import { Package, Users, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InvitationAlert } from '@/components/Dashboard/InvitationAlert';
import { RecentEquipmentSection } from '@/components/Dashboard/RecentEquipmentSection';
import { TeamsSection } from '@/components/Dashboard/TeamsSection';
import { QuickLinksCard } from '@/components/Dashboard/QuickLinksCard';
import { useOrganization } from '@/contexts/OrganizationContext';
import { OrganizationSelector } from '@/components/Organization/OrganizationSelector';
import { Skeleton } from '@/components/ui/skeleton';
import { useCombinedDashboardData } from '@/hooks/useCombinedDashboardData';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';

const Index = () => {
  const { user, session } = useAuth();
  const { 
    organizations, 
    selectedOrganization, 
    selectOrganization, 
    defaultOrganizationId,
    setDefaultOrganization,
    isLoading: isOrgLoading
  } = useOrganization();
  
  const { 
    teams, 
    activeCount,
    maintenanceCount,
    recentEquipment,
    isEquipmentLoading,
    isTeamsLoading,
    isEquipmentError,
    isTeamsError,
    isOrgReady,
    invitations,
    equipment,
    isRefreshing,
    refetchDashboard,
    isLoading: isDashboardLoading
  } = useCombinedDashboardData(selectedOrganization?.id);

  // Only calculate stats when data is loaded and organization is ready
  const stats: DashboardStat[] = [
    {
      label: 'Total Equipment',
      value: equipment.length,
      change: 12,
      icon: Package,
    },
    {
      label: 'In Use',
      value: activeCount,
      icon: Package,
    },
    {
      label: 'Maintenance',
      value: maintenanceCount,
      change: -5,
      icon: Settings,
    },
    {
      label: 'Team Memberships',
      value: teams.length,
      change: 20,
      icon: Users,
    },
  ];

  const handleOrganizationChange = (orgId: string) => {
    selectOrganization(orgId);
  };

  const handleSetDefaultOrg = async (orgId: string) => {
    return await setDefaultOrganization(orgId);
  };

  const showOrgSelector = organizations.length > 1;
  
  // Check if we're in a loading state
  const isLoading = isOrgLoading || isDashboardLoading || !isOrgReady;
  
  // Check for initial auth loading state
  const showInitialAuthLoading = !session && !user;

  return (
    <Layout>
      <div className="flex-1 space-y-3">
        <InvitationAlert invitations={invitations} />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {showOrgSelector && (
              <OrganizationSelector
                organizations={organizations}
                selectedOrgId={selectedOrganization?.id}
                defaultOrgId={defaultOrganizationId}
                onChange={handleOrganizationChange}
                onSetDefault={handleSetDefaultOrg}
                showSetDefault={true}
                className="w-full sm:w-[200px] md:w-[250px] lg:w-[300px] mb-2 sm:mb-0 sm:mr-2"
                maxDisplayLength={25}
              />
            )}
            <Button asChild>
              <Link to="/equipment/new">
                <Package className="mr-2 h-4 w-4" />
                Add Equipment
              </Link>
            </Button>
          </div>
        </div>

        {showInitialAuthLoading ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
              <h3 className="text-lg font-medium mb-2">Initializing Dashboard</h3>
              <p className="text-muted-foreground">Verifying authentication and loading your data...</p>
            </div>
          </Card>
        ) : isLoading ? (
          // Skeleton loading state for dashboard stats
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 border rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-8 w-16 mt-2" />
                <Skeleton className="h-3 w-20 mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <DashboardStats stats={stats} />
        )}

        {/* Prominent Equipment Map - Full Width */}
        {!showInitialAuthLoading && (
          <div className="grid gap-3">
            <DashboardEquipmentMap 
              equipment={equipment}
              isLoading={isEquipmentLoading || !isOrgReady}
            />
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {!showInitialAuthLoading && (
            <>
              <RecentEquipmentSection 
                recentEquipment={recentEquipment}
                isLoading={isEquipmentLoading || !isOrgReady}
                isError={isEquipmentError}
              />
              
              <TeamsSection
                teams={teams}
                isLoading={isTeamsLoading || !isOrgReady}
                isError={isTeamsError}
                onRefresh={refetchDashboard}
              />
              
              <QuickLinksCard />
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Index;
