
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
import { Edit2, Save, Users, AlertTriangle } from 'lucide-react';
import { OrganizationMembersTable } from '@/components/Organization/OrganizationMembersTable';
import { getCurrentOrganization, Organization, updateOrganization } from '@/services/organization';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function OrganizationSettings() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const form = useForm({
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setLoadError(null);
      
      try {
        const org = await getCurrentOrganization();
        
        console.log("Fetched organization:", org);
        
        if (org) {
          setOrganization(org);
          form.reset({
            name: org.name,
          });
          
          // Check if current user is the owner
          setIsOwner(org.owner_user_id === user.id);
        } else {
          setLoadError("Unable to find your organization. Please try refreshing the page.");
        }
      } catch (error) {
        console.error("Error loading organization:", error);
        setLoadError("There was a problem loading your organization data.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      console.log("User is logged in, fetching organization");
      fetchOrganization();
    }
  }, [user, form]);
  
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

  const retryLoad = () => {
    if (user) {
      setIsLoading(true);
      setLoadError(null);
      getCurrentOrganization().then(org => {
        if (org) {
          setOrganization(org);
          form.reset({
            name: org.name,
          });
          setIsOwner(org.owner_user_id === user.id);
        } else {
          setLoadError("Still unable to find your organization. Please check your account.");
        }
        setIsLoading(false);
      }).catch(err => {
        console.error("Retry error:", err);
        setLoadError("There was a problem loading your organization data.");
        setIsLoading(false);
      });
    }
  };

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
                  We couldn't find an organization associated with your account or there may be an issue with your permissions.
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">Possible reasons:</p>
                    <ul className="text-sm list-disc pl-5 mt-1">
                      <li>Your account hasn't been properly set up with an organization</li>
                      <li>The organization data is missing or corrupted</li>
                      <li>You need to log out and log back in to refresh your session</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
              <Button onClick={retryLoad} className="mr-2">Try Again</Button>
              <Button variant="outline" onClick={() => window.location.href = "/profile"}>
                Go to Profile
              </Button>
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
              <Button onClick={retryLoad}>Retry</Button>
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
