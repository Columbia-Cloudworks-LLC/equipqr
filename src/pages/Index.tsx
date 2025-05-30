
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useCombinedDashboardData } from '@/hooks/useCombinedDashboardData';
import { Layout } from '@/components/Layout/Layout';
import { DashboardStats } from '@/components/Dashboard/DashboardStats';
import { TeamsSection } from '@/components/Dashboard/TeamsSection';
import { RecentEquipmentSection } from '@/components/Dashboard/RecentEquipmentSection';
import { QuickLinksCard } from '@/components/Dashboard/QuickLinksCard';
import { DashboardEquipmentMap } from '@/components/Dashboard/DashboardEquipmentMap';
import { InvitationAlert } from '@/components/Dashboard/InvitationAlert';
import { NewGracePeriodBanner } from '@/components/Billing/NewGracePeriodBanner';
import { Loader2, Package, Users, Activity, Wrench } from 'lucide-react';

export default function Index() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { selectedOrganization } = useOrganization();
  const navigate = useNavigate();

  // Get dashboard data using the combined hook
  const {
    teams,
    equipment,
    invitations,
    activeCount,
    maintenanceCount,
    recentEquipment,
    isLoading: isDashboardLoading,
    isTeamsLoading,
    isEquipmentLoading,
    isTeamsError,
    isEquipmentError,
    refetchDashboard
  } = useCombinedDashboardData(selectedOrganization?.id);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/auth');
    }
  }, [user, isAuthLoading, navigate]);

  if (isAuthLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  // Prepare stats data for DashboardStats component
  const stats = [
    {
      label: "Total Equipment",
      value: equipment.length.toString(),
      icon: Package,
      change: undefined
    },
    {
      label: "Active Equipment", 
      value: activeCount.toString(),
      icon: Activity,
      change: undefined
    },
    {
      label: "In Maintenance",
      value: maintenanceCount.toString(), 
      icon: Wrench,
      change: undefined
    },
    {
      label: "My Teams",
      value: teams.length.toString(),
      icon: Users,
      change: undefined
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <NewGracePeriodBanner />
        <InvitationAlert invitations={invitations} />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your equipment.
            </p>
          </div>
          {selectedOrganization && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Organization</p>
              <p className="font-medium">{selectedOrganization.name}</p>
            </div>
          )}
        </div>

        <DashboardStats stats={stats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentEquipmentSection 
              recentEquipment={recentEquipment}
              isLoading={isEquipmentLoading}
              isError={isEquipmentError}
            />
            <TeamsSection 
              teams={teams}
              isLoading={isTeamsLoading}
              isError={isTeamsError}
              onRefresh={refetchDashboard}
            />
          </div>
          <div className="space-y-6">
            <QuickLinksCard />
            <DashboardEquipmentMap equipment={equipment} isLoading={isDashboardLoading} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
