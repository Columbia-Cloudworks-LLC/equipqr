import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Layout } from '@/components/Layout/Layout';
import { DashboardStats } from '@/components/Dashboard/DashboardStats';
import { TeamsSection } from '@/components/Dashboard/TeamsSection';
import { RecentEquipmentSection } from '@/components/Dashboard/RecentEquipmentSection';
import { QuickLinksCard } from '@/components/Dashboard/QuickLinksCard';
import { DashboardEquipmentMap } from '@/components/Dashboard/DashboardEquipmentMap';
import { InvitationAlert } from '@/components/Dashboard/InvitationAlert';
import { NewGracePeriodBanner } from '@/components/Billing/NewGracePeriodBanner';
import { Loader2 } from 'lucide-react';

export default function Index() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { selectedOrganization } = useOrganization();
  const navigate = useNavigate();

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

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <NewGracePeriodBanner />
        <InvitationAlert />
        
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

        <DashboardStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentEquipmentSection />
            <TeamsSection />
          </div>
          <div className="space-y-6">
            <QuickLinksCard />
            <DashboardEquipmentMap />
          </div>
        </div>
      </div>
    </Layout>
  );
}
