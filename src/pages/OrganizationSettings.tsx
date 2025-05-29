
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/Layout/Layout';
import { OrganizationSettingsHeader } from '@/components/Organization/Settings/OrganizationSettingsHeader';
import { OrganizationSettingsTabs } from '@/components/Organization/Settings/OrganizationSettingsTabs';
import { UserRole } from '@/types/supabase-enums';

export default function OrganizationSettings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { selectedOrganization } = useOrganization();
  
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'profile';
  });

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/auth', { state: { returnTo: '/organization' } });
    }
  }, [user, isAuthLoading, navigate]);

  // Update tab from URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'members', 'billing', 'transfers'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  
  if (isAuthLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }
  
  if (!selectedOrganization) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground mt-2">
            No organization selected. Please select an organization first.
          </p>
        </div>
      </Layout>
    );
  }
  
  // Safely cast the role to UserRole, defaulting to 'viewer' if undefined or invalid
  const userRole: UserRole = (selectedOrganization.role as UserRole) || 'viewer';
  
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <OrganizationSettingsHeader />
        <OrganizationSettingsTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          organizationId={selectedOrganization.id}
          userRole={userRole}
        />
      </div>
    </Layout>
  );
}
