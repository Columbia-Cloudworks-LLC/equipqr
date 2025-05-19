
import { DashboardStat } from '@/types';
import { DashboardStats } from '@/components/Dashboard/DashboardStats';
import { Layout } from '@/components/Layout/Layout';
import { Package, Users, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InvitationAlert } from '@/components/Dashboard/InvitationAlert';
import { RecentEquipmentSection } from '@/components/Dashboard/RecentEquipmentSection';
import { TeamsSection } from '@/components/Dashboard/TeamsSection';
import { QuickLinksCard } from '@/components/Dashboard/QuickLinksCard';
import { useDashboardData } from '@/hooks/useDashboardData';

const Index = () => {
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
    equipment
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

  return (
    <Layout>
      <div className="flex-1 space-y-3">
        <InvitationAlert invitations={invitations} />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2">
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
          />
          
          <QuickLinksCard />
        </div>
      </div>
    </Layout>
  );
}

export default Index;
