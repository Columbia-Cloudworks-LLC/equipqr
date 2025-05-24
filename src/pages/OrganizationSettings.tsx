
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function OrganizationSettings() {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { selectedOrganization, refreshOrganizations } = useOrganization();
  
  const [name, setName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/auth', { state: { returnTo: '/organization' } });
    }
  }, [user, isAuthLoading, navigate]);
  
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
  
  // Determine user role in the organization
  const userRole = selectedOrganization.role || 'viewer';
  
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your organization details and members.
          </p>
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
      </div>
    </Layout>
  );
}
