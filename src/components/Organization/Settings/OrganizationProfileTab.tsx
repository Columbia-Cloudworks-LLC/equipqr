
import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateOrganization } from '@/services/organization';
import { OrganizationSelector } from '@/components/Organization/OrganizationSelector';
import OrganizationMembersManagement from '@/components/Organization/OrganizationMembersManagement';
import { UserRole } from '@/types/supabase-enums';

interface OrganizationProfileTabProps {
  organizationId: string;
  userRole: UserRole;
}

export function OrganizationProfileTab({ organizationId, userRole }: OrganizationProfileTabProps) {
  const { 
    organizations, 
    selectedOrganization, 
    selectOrganization, 
    refreshOrganizations 
  } = useOrganization();
  
  const [name, setName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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

  if (!selectedOrganization) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Organization Profile</h2>
          <p className="text-muted-foreground mt-1">
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
      
      <OrganizationMembersManagement 
        organizationId={organizationId}
        userRole={userRole}
      />
    </div>
  );
}
