
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout/Layout';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrganizationMembersTable } from '@/components/Organization/OrganizationMembersTable';
import { OrganizationDetailsCard } from '@/components/Organization/OrganizationDetailsCard';
import { OrganizationError } from '@/components/Organization/OrganizationError';
import { OrganizationLoading } from '@/components/Organization/OrganizationLoading';
import { AuthenticationRequired } from '@/components/Organization/AuthenticationRequired';
import { getCurrentOrganization, Organization } from '@/services/organization';

export default function OrganizationSettings() {
  const { user, session, checkSession } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const loadOrganization = async () => {
    if (!user) {
      setLoadError("You must be signed in to access this page.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // First, ensure the session is valid
      const isSessionValid = await checkSession();
      if (!isSessionValid) {
        console.error("Session check failed, might need to re-authenticate");
        setLoadError("Your session appears to be invalid. Please try signing out and back in.");
        setIsLoading(false);
        return;
      }
      
      console.log("Loading organization data for user:", user.id);
      const org = await getCurrentOrganization();
      
      console.log("Fetched organization result:", org);
      
      if (org) {
        setOrganization(org);
        
        // Check if current user is the owner
        setIsOwner(org.owner_user_id === user.id);
      } else {
        setLoadError("Unable to find your organization. This might be due to a configuration issue with your account.");
        console.error("No organization found for user:", user.id);
      }
    } catch (error) {
      console.error("Error loading organization:", error);
      setLoadError("There was a problem loading your organization data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log("User is logged in, fetching organization");
      loadOrganization();
    } else if (session === null && !isLoading) {
      // Only show error if we're sure there's no session
      setLoadError("You need to be logged in to view organization settings.");
    }
  }, [user]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOrganization();
    setIsRefreshing(false);
  };

  const showAuthenticationError = !user && !isLoading;

  return (
    <Layout>
      <div className="container py-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Organization Settings</h1>
            <p className="text-muted-foreground">
              Manage your organization's details and members
            </p>
          </div>
          {loadError && (
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>
        
        <Separator />
        
        {isLoading ? (
          <OrganizationLoading />
        ) : showAuthenticationError ? (
          <AuthenticationRequired />
        ) : loadError ? (
          <OrganizationError 
            errorMessage={loadError} 
            handleRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        ) : !organization ? (
          <OrganizationError
            errorMessage="No Organization Found"
            handleRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        ) : (
          <>
            <OrganizationDetailsCard 
              organization={organization}
              isOwner={isOwner}
            />
            
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Organization Members</h2>
            </div>
            
            {organization && (
              <OrganizationMembersTable 
                organizationId={organization.id} 
                isOwner={isOwner}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
