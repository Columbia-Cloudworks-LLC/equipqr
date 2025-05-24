
import { DashboardStat } from '@/types';
import { DashboardStats } from '@/components/Dashboard/DashboardStats';
import { DashboardEquipmentMap } from '@/components/Dashboard/DashboardEquipmentMap';
import { Layout } from '@/components/Layout/Layout';
import { Package, Users, Settings, Star } from 'lucide-react';
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
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Index = () => {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
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

  // DERIVED STATE AND HANDLERS - AFTER ALL HOOKS
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
    const success = await setDefaultOrganization(orgId);
    if (success) {
      toast.success('Default organization updated');
    }
    return success;
  };

  const handleQuickSetDefault = async () => {
    if (selectedOrganization?.id) {
      await handleSetDefaultOrg(selectedOrganization.id);
    }
  };

  // COMPUTED VALUES
  const showOrgSelector = organizations.length > 1;
  const isCurrentOrgDefault = selectedOrganization?.id === defaultOrganizationId;
  const showQuickDefaultButton = showOrgSelector && !isCurrentOrgDefault;
  const isLoading = isOrgLoading || isDashboardLoading || !isOrgReady;
  const showInitialAuthLoading = !session && !user;

  // RENDER LOGIC - ALL HOOKS HAVE BEEN CALLED ABOVE
  return (
    <Layout>
      <div className="flex-1 space-y-3">
        <InvitationAlert invitations={invitations} />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {showOrgSelector && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className={`flex-1 ${isCurrentOrgDefault ? 'ring-2 ring-primary/20 rounded-md' : ''}`}>
                  <OrganizationSelector
                    organizations={organizations}
                    selectedOrgId={selectedOrganization?.id}
                    defaultOrgId={defaultOrganizationId}
                    onChange={handleOrganizationChange}
                    onSetDefault={handleSetDefaultOrg}
                    showSetDefault={true}
                    className="w-full sm:w-[200px] md:w-[250px] lg:w-[300px]"
                    maxDisplayLength={25}
                  />
                </div>
                {showQuickDefaultButton && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleQuickSetDefault}
                          className="shrink-0 h-9 w-9 p-0"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Set as default organization</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
            <Button asChild>
              <Link to="/equipment/new">
                <Package className="mr-2 h-4 w-4" />
                Add Equipment
              </Link>
            </Button>
          </div>
        </div>

        {showOrgSelector && (
          <div className="text-sm text-muted-foreground">
            {isCurrentOrgDefault ? (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-current text-primary" />
                <span>This is your default organization</span>
              </div>
            ) : (
              <span>Click the star to make this your default organization</span>
            )}
          </div>
        )}

        {showInitialAuthLoading ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
              <h3 className="text-lg font-medium mb-2">Initializing Dashboard</h3>
              <p className="text-muted-foreground">Verifying authentication and loading your data...</p>
            </div>
          </Card>
        ) : isLoading ? (
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
