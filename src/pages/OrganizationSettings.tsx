
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
import { Layout } from '@/components/Layout/Layout'; // Import Layout component

const OrganizationSettings = () => {
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('viewer');

  useEffect(() => {
    const fetchOrganizationAndRole = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) {
          setError('Please log in to access organization settings');
          setLoading(false);
          return;
        }

        // Fetch organization
        const org = await getCurrentOrganization();
        if (!org) {
          setError('Failed to load organization details');
          setLoading(false);
          return;
        }

        setOrganization(org);

        // Get user's role in the organization
        const { data, error: roleError } = await supabase.rpc('get_user_role', {
          _user_id: session.session.user.id,
          _org_id: org.id
        });

        if (roleError) {
          console.error('Error fetching user role:', roleError);
          // Default to viewer if role can't be determined
          setUserRole('viewer');
        } else {
          setUserRole(data as UserRole);
        }
      } catch (err: any) {
        console.error('Error in fetchOrganizationAndRole:', err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationAndRole();
  }, []);

  // Content to render based on loading/error state
  const renderContent = () => {
    if (loading) {
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

    return (
      <div className="container p-4 mx-auto space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
        
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

