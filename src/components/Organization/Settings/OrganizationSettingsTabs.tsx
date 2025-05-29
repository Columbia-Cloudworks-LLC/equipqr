
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OrganizationProfileTab } from './OrganizationProfileTab';
import { OrganizationMembersTab } from './OrganizationMembersTab';
import { OrganizationBillingTab } from './OrganizationBillingTab';
import { OrganizationTransfersTab } from './OrganizationTransfersTab';
import { UserRole } from '@/types/supabase-enums';

interface OrganizationSettingsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  organizationId: string;
  userRole: UserRole;
}

export function OrganizationSettingsTabs({ 
  activeTab, 
  onTabChange, 
  organizationId, 
  userRole 
}: OrganizationSettingsTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="transfers">Transfers</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <OrganizationProfileTab organizationId={organizationId} userRole={userRole} />
      </TabsContent>

      <TabsContent value="members">
        <OrganizationMembersTab organizationId={organizationId} userRole={userRole} />
      </TabsContent>

      <TabsContent value="billing">
        <OrganizationBillingTab />
      </TabsContent>

      <TabsContent value="transfers">
        <OrganizationTransfersTab />
      </TabsContent>
    </Tabs>
  );
}
