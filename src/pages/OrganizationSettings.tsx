
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OrganizationDetailsCard } from '@/components/Organization/OrganizationDetailsCard';
import OrganizationMembersManagement from '@/components/Organization/OrganizationMembersManagement';
import { OrganizationLoading } from '@/components/Organization/OrganizationLoading';
import { OrganizationError } from '@/components/Organization/OrganizationError';
import { getCurrentOrganization } from '@/services/organization';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-enums';
import { AuthenticationRequired } from '@/components/Organization/AuthenticationRequired';
import { Layout } from '@/components/Layout/Layout';
import { useOrganization } from '@/contexts/OrganizationContext';
import { OrganizationSelector } from '@/components/Organization/OrganizationSelector';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const OrganizationSettings = () => {
  const { organizations, selectedOrganization, isLoading: orgContextLoading, selectOrganization } = useOrganization();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('viewer');

  // When the selected organization changes in context, update the page
  useEffect(() => {
    if (selectedOrganization) {
      setOrganization(selectedOrganization);
      checkUserRoleInOrg(selectedOrganization.id);
    }
  }, [selectedOrganization]);

  const checkUserRoleInOrg = async (orgId: string) => {
    try {
      setLoading(true);

      // Check if user is authenticated
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        setError('Please log in to access organization settings');
        setLoading(false);
        return;
      }

      // Get user's role in the organization
      const { data, error: roleError } = await supabase.rpc('get_user_role', {
        _user_id: session.session.user.id,
        _org_id: orgId
      });

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        // Default to viewer if role can't be determined
        setUserRole('viewer');
      } else {
        setUserRole(data as UserRole);
      }
    } catch (err: any) {
      console.error('Error in checkUserRoleInOrg:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationChange = (orgId: string) => {
    selectOrganization(orgId);
  };

  // Content to render based on loading/error state
  const renderContent = () => {
    if (orgContextLoading || loading) {
      return <OrganizationLoading />;
    }

    // Check if user is authenticated
    if (error === 'Please log in to access organization settings') {
      return <AuthenticationRequired />;
    }

    if (error || !organization) {
      return <OrganizationError 
        errorMessage={error || 'Failed to load organization'} 
        handleRefresh={() => window.location.reload()} 
        isRefreshing={false} 
      />;
    }

    // Convert userRole to boolean isOwner for OrganizationDetailsCard
    const isOwner = userRole === 'owner';
    const isManager = userRole === 'owner' || userRole === 'manager';

    return (
      <div className="container p-4 mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
          
          {organizations.length > 1 && (
            <OrganizationSelector
              organizations={organizations}
              selectedOrgId={organization.id}
              onChange={handleOrganizationChange}
              className="w-full md:w-[250px]"
            />
          )}
        </div>
        
        {!organization.is_primary && (
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4" />
            <AlertTitle>External Organization</AlertTitle>
            <AlertDescription>
              You are viewing an organization where you have {userRole} access.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4">
            <OrganizationDetailsCard organization={organization} isOwner={isOwner} />
          </TabsContent>
          
          <TabsContent value="members" className="mt-4">
            <OrganizationMembersManagement organizationId={organization.id} userRole={userRole} />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Wrap everything in Layout component
  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
};

export default OrganizationSettings;
