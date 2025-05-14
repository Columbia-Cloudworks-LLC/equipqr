
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit2, Save, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { OrganizationMembersTable } from '@/components/Organization/OrganizationMembersTable';
import { getCurrentOrganization, Organization, updateOrganization } from '@/services/organization';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function OrganizationSettings() {
  const { user, session, checkSession } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const form = useForm({
    defaultValues: {
      name: '',
    },
  });

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
        form.reset({
          name: org.name,
        });
        
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
  
  const handleSave = async (formData: { name: string }) => {
    if (!organization) return;
    
    setIsSaving(true);
    const success = await updateOrganization(organization.id, {
      name: formData.name,
    });
    
    if (success) {
      setOrganization({
        ...organization,
        name: formData.name,
      });
      setIsEditing(false);
    }
    
    setIsSaving(false);
  };

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
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ) : showAuthenticationError ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-amber-600">
                <AlertTriangle className="h-5 w-5 mr-2" /> 
                Authentication Required
              </CardTitle>
              <CardDescription>
                You need to be logged in to view organization settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Not Authenticated</AlertTitle>
                <AlertDescription>
                  Please sign in to access your organization settings.
                </AlertDescription>
              </Alert>
              <Button onClick={() => window.location.href = "/auth"}>
                Go to Login
              </Button>
            </CardContent>
          </Card>
        ) : loadError ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-amber-600">
                <AlertTriangle className="h-5 w-5 mr-2" /> 
                Organization Not Found
              </CardTitle>
              <CardDescription>
                {loadError}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>We couldn't find an organization associated with your account or there may be an issue with your permissions.</p>
                    <p className="text-sm text-muted-foreground">Possible reasons:</p>
                    <ul className="text-sm list-disc pl-5 mt-1">
                      <li>Your account hasn't been properly set up with an organization</li>
                      <li>The organization data is missing or corrupted</li>
                      <li>You need to log out and log back in to refresh your session</li>
                      <li>There might be a database configuration issue</li>
                    </ul>
                    <p className="text-sm mt-2">User ID: {user?.id}</p>
                  </div>
                </AlertDescription>
              </Alert>
              <div className="flex space-x-2">
                <Button onClick={handleRefresh} disabled={isRefreshing} className="mr-2">
                  {isRefreshing ? 'Refreshing...' : 'Try Again'}
                </Button>
                <Button variant="outline" onClick={() => window.location.href = "/profile"}>
                  Go to Profile
                </Button>
                <Button variant="outline" onClick={() => window.location.href = "/auth"} className="ml-auto">
                  Sign Out and Back In
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !organization ? (
          <Card>
            <CardHeader>
              <CardTitle>No Organization Found</CardTitle>
              <CardDescription>
                There was a problem loading your organization details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? 'Refreshing...' : 'Retry'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Organization Details</CardTitle>
                  <CardDescription>
                    Basic information about your organization
                  </CardDescription>
                </div>
                {isOwner && !isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    id="org-form"
                    onSubmit={form.handleSubmit(handleSave)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={!isEditing || isSaving}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Created</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(organization.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Organization ID</p>
                        <p className="text-sm text-muted-foreground">{organization.id}</p>
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
              {isEditing && (
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      form.reset({
                        name: organization.name,
                      });
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    form="org-form"
                    type="submit"
                    disabled={isSaving}
                  >
                    {isSaving && (
                      <Save className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </CardFooter>
              )}
            </Card>
            
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
