
import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { DashboardStats } from '@/components/Dashboard/DashboardStats';
import { TeamsSection } from '@/components/Dashboard/TeamsSection';
import { RecentEquipmentSection } from '@/components/Dashboard/RecentEquipmentSection';
import { QuickLinksCard } from '@/components/Dashboard/QuickLinksCard';
import { InvitationAlert } from '@/components/Dashboard/InvitationAlert';
import { DashboardEquipmentMap } from '@/components/Dashboard/DashboardEquipmentMap';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useOrganization } from '@/contexts/OrganizationContext';

export default function Index() {
  const { selectedOrganization, isLoading: isOrgLoading } = useOrganization();
  
  const {
    teamCount,
    equipmentCount,
    activeCount,
    maintenanceCount,
    recentEquipment,
    teams,
    equipment,
    invitations,
    isLoading,
    error,
    refetchTeams,
    refetchEquipment
  } = useDashboardData();

  if (isOrgLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading organization data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!selectedOrganization) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">No organization selected</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview for {selectedOrganization.name}
          </p>
        </div>

        {/* Invitations Alert */}
        {invitations && invitations.length > 0 && (
          <InvitationAlert invitations={invitations} />
        )}

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats and Equipment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <DashboardStats
              teamCount={teamCount}
              equipmentCount={equipmentCount}
              activeCount={activeCount}
              maintenanceCount={maintenanceCount}
              isLoading={isLoading}
              error={error}
            />

            {/* Recent Equipment */}
            <RecentEquipmentSection
              equipment={recentEquipment}
              isLoading={isLoading}
              error={error}
              onRefresh={refetchEquipment}
            />

            {/* Equipment Map */}
            <DashboardEquipmentMap
              equipment={equipment}
              isLoading={isLoading}
              error={error}
            />
          </div>

          {/* Right Column - Teams and Quick Links */}
          <div className="space-y-6">
            {/* Teams Section */}
            <TeamsSection
              teams={teams}
              isLoading={isLoading}
              error={error}
              onRefresh={refetchTeams}
            />

            {/* Quick Links */}
            <QuickLinksCard />
          </div>
        </div>
      </div>
    </Layout>
  );
}
