import { DashboardStat } from '@/types';
import { DashboardStats } from '@/components/Dashboard/DashboardStats';
import { Layout } from '@/components/Layout/Layout';
import { Package, Users, Settings, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InvitationAlert } from '@/components/Dashboard/InvitationAlert';
import { RecentEquipmentSection } from '@/components/Dashboard/RecentEquipmentSection';
import { TeamsSection } from '@/components/Dashboard/TeamsSection';
import { QuickLinksCard } from '@/components/Dashboard/QuickLinksCard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

// Prevent rapid refreshes of dashboard data
const REFRESH_THROTTLE_MS = 10000; // 10 seconds

const Index = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastRefreshTime = useRef<number>(0);
  
  const { 
    teams, 
    activeCount,
    maintenanceCount,
    recentEquipment,
    isEquipmentLoading,
    isTeamsLoading,
    isEquipmentError,
    isTeamsError,
    invitations,
    equipment,
    refetchTeams,
    refetchEquipment
  } = useDashboardData();

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

  // Function to refresh all dashboard data with throttling
  const refreshDashboardData = async () => {
    const now = Date.now();
    
    // Prevent refreshing too frequently
    if (now - lastRefreshTime.current < REFRESH_THROTTLE_MS) {
      toast.info('Please wait a moment before refreshing again');
      return;
    }
    
    setIsRefreshing(true);
    lastRefreshTime.current = now;
    
    try {
      await Promise.all([
        refetchEquipment(),
        refetchTeams()
      ]);
      toast.success('Dashboard data refreshed');
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
      toast.error('Failed to refresh dashboard data');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 space-y-3">
        <InvitationAlert invitations={invitations} />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={refreshDashboardData} 
              disabled={isRefreshing}
              className="mr-2"
              title="Refresh dashboard data"
            >
              <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh data</span>
            </Button>
            <Button asChild>
              <Link to="/equipment/new">
                <Package className="mr-2 h-4 w-4" />
                Add Equipment
              </Link>
            </Button>
          </div>
        </div>

        <DashboardStats stats={stats} />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <RecentEquipmentSection 
            recentEquipment={recentEquipment}
            isLoading={isEquipmentLoading}
            isError={isEquipmentError}
          />
          
          <TeamsSection
            teams={teams}
            isLoading={isTeamsLoading} 
            isError={isTeamsError}
            onRefresh={refetchTeams}
          />
          
          <QuickLinksCard />
        </div>
      </div>
    </Layout>
  );
}

export default Index;
