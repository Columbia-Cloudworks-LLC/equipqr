
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateOrganization } from '@/services/organization';
import { OwnershipTransferSection } from '@/components/Organization/OwnershipTransferSection';
import { Layout } from '@/components/Layout/Layout';
import OrganizationMembersManagement from '@/components/Organization/OrganizationMembersManagement';
import { OrganizationSelector } from '@/components/Organization/OrganizationSelector';
import { UserRole } from '@/types/supabase-enums';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StorageUsageCard } from '@/components/Billing/StorageUsageCard';
import { BillingManagement } from '@/components/Billing/BillingManagement';

export default function OrganizationSettings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { 
    organizations, 
    selectedOrganization, 
    selectOrganization, 
    refreshOrganizations 
  } = useOrganization();
  
  const [name, setName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
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
  
  useEffect(() => {
    if (selectedOrganization) {
      setName(selectedOrganization.name);
    }
  }, [selectedOrganization]);
  
  const handleUpdateOrganization = async () => {
    if (!selectedOrganization) return;
    
    if (!name.trim()) {
      toast.error('Organization name cannot be empty');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const success = await updateOrganization(selectedOrganization.id, { name });
      
      if (success) {
        await refreshOrganizations();
        toast.success('Organization updated successfully');
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update organization');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOrganizationChange = (orgId: string) => {
    selectOrganization(orgId);
  };
  
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
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Organization Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization profile, members, and billing settings.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Organization Settings</h1>
              <p className="text-muted-foreground mt-2">
                Manage your organization details and members.
              </p>
            </div>
            
            {organizations.length > 1 && (
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm text-muted-foreground">Switch Organization</span>
                <OrganizationSelector
                  organizations={organizations}
                  selectedOrgId={selectedOrganization.id}
                  onChange={handleOrganizationChange}
                  className="w-full sm:w-[280px]"
                  showRoleBadges={true}
                  maxDisplayLength={25}
                />
              </div>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Update your organization's basic information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>
              
              <Button 
                onClick={handleUpdateOrganization} 
                disabled={isUpdating || name === selectedOrganization.name}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Organization'
                )}
              </Button>
            </CardContent>
          </Card>
          
          <OwnershipTransferSection />
          
          <OrganizationMembersManagement 
            organizationId={selectedOrganization.id}
            userRole={userRole}
          />
        </TabsContent>

        <TabsContent value="members">
          <OrganizationMembersManagement 
            organizationId={selectedOrganization.id}
            userRole={userRole}
          />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <StorageUsageCard />
            <div className="space-y-6">
              <BillingManagement />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transfers">
          <OwnershipTransferSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
