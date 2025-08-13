
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Settings } from 'lucide-react';
import { RealOrganizationMember } from '@/hooks/useOrganizationMembers';
import { PagePermissions } from '@/hooks/usePagePermissions';
import { useSimplifiedOrganizationRestrictions } from '@/hooks/useSimplifiedOrganizationRestrictions';
import { useIsMobile } from '@/hooks/use-mobile';
import { FleetMapSubscription } from '@/hooks/useFleetMapSubscription';
import UnifiedMembersList from './UnifiedMembersList';
import OrganizationSettingsTab from './OrganizationSettingsTab';
import SimplifiedInvitationDialog from './SimplifiedInvitationDialog';


interface OrganizationTabsProps {
  members: RealOrganizationMember[];
  organizationId: string;
  currentUserRole: 'owner' | 'admin' | 'member';
  permissions: PagePermissions;
  membersLoading: boolean;
  fleetMapSubscription: FleetMapSubscription;
}

const OrganizationTabs: React.FC<OrganizationTabsProps> = ({
  members,
  organizationId,
  currentUserRole,
  permissions,
  membersLoading,
  fleetMapSubscription
}) => {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const isMobile = useIsMobile();
  const { restrictions } = useSimplifiedOrganizationRestrictions(fleetMapSubscription?.enabled || false);

  // Combine role-based permissions with organizational restrictions
  const canInviteMembers = permissions.canInviteMembers && restrictions.canInviteMembers && restrictions.hasAvailableSlots;

  const handleInviteSuccess = () => {
    setInviteDialogOpen(false);
    setActiveTab("members"); // Switch to members tab after successful invite
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className={isMobile ? "px-4" : ""}>
        <ScrollArea className="w-full">
           <TabsList className={`grid w-full grid-cols-2 ${isMobile ? 'h-auto' : ''}`}>
            <TabsTrigger value="overview" className={isMobile ? 'text-xs py-2' : ''}>
              <Settings className={`${isMobile ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'}`} />
              {isMobile ? 'Settings' : 'Settings'}
            </TabsTrigger>
            <TabsTrigger value="members" className={isMobile ? 'text-xs py-2' : ''}>
              <Users className={`${isMobile ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'}`} />
              {isMobile ? 'Members' : 'Members'}
            </TabsTrigger>
          </TabsList>
        </ScrollArea>
      </div>

      <div className={isMobile ? "px-4 mt-4" : "mt-6 space-y-4"}>
        <TabsContent value="overview" className="space-y-4">
          <OrganizationSettingsTab currentUserRole={currentUserRole} />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <UnifiedMembersList
            members={members}
            organizationId={organizationId}
            currentUserRole={currentUserRole}
            isLoading={membersLoading}
            canInviteMembers={canInviteMembers}
          />
        </TabsContent>


        <SimplifiedInvitationDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          onSuccess={handleInviteSuccess}
        />
      </div>
    </Tabs>
  );
};

export default OrganizationTabs;
