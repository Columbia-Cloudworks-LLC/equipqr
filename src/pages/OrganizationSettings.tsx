
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
import { Info, RefreshCw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const OrganizationSettings = () => {
  const { 
    organizations, 
    selectedOrganization, 
    isLoading: orgContextLoading, 
    selectOrganization,
    refreshOrganizations,
    defaultOrganizationId,
    setDefaultOrganization,
    error: orgContextError
  } = useOrganization();
  
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('viewer');
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleSetDefaultOrg = async (orgId: string) => {
    return await setDefaultOrganization(orgId);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshOrganizations();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Content to render based on loading/error state
  const renderContent = () => {
    // Handle initial context loading
    if (orgContextLoading) {
      return <OrganizationLoading />;
    }

    // If no organizations found and not loading, show error
    if (organizations.length === 0 && !orgContextLoading) {
      return <OrganizationError 
        errorMessage="No organizations found"
        handleRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />;
    }

    // Check if user is authenticated
    if (error === 'Please log in to access organization settings') {
      return <AuthenticationRequired />;
    }

    // If context has error and no selected organization
    if ((orgContextError || error) && !selectedOrganization) {
      return <OrganizationError 
        errorMessage={orgContextError || error || 'Failed to load organization'} 
        handleRefresh={handleRefresh} 
        isRefreshing={isRefreshing} 
      />;
    }

    // If still loading organization data
    if (loading) {
      return <OrganizationLoading />;
    }

    // If no organization is selected, but organizations exist
    if (!organization && organizations.length > 0) {
      return <OrganizationError 
        errorMessage="No organization selected" 
        handleRefresh={handleRefresh} 
        isRefreshing={isRefreshing} 
      />;
    }

    // If no organization data
    if (!organization) {
      return <OrganizationError 
        errorMessage="Organization data not available" 
        handleRefresh={handleRefresh} 
        isRefreshing={isRefreshing} 
      />;
    }

    // Convert userRole to boolean isOwner for OrganizationDetailsCard
    const isOwner = userRole === 'owner';
    const isManager = userRole === 'owner' || userRole === 'manager';
    const isDefault = organization.id === defaultOrganizationId;

    return (
      <div className="container p-4 mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
          
          {/* Always show organization selector if multiple organizations are available */}
          <div className="flex items-center gap-2">
            <OrganizationSelector
              organizations={organizations}
              selectedOrgId={organization?.id}
              defaultOrgId={defaultOrganizationId}
              onChange={handleOrganizationChange}
              className="w-full md:w-[250px]"
            />
            
            {!isDefault && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSetDefaultOrg(organization.id)}
                title="Set as default organization"
              >
                <Star className="h-4 w-4 mr-2" />
                Set Default
              </Button>
            )}
          </div>
        </div>
        
        {isDefault && (
          <Alert className="bg-green-50 border-green-200">
            <Star className="h-4 w-4 text-green-600" />
            <AlertTitle>Default Organization</AlertTitle>
            <AlertDescription>
              This is your default organization. It will be pre-selected across the application.
            </AlertDescription>
          </Alert>
        )}
        
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
