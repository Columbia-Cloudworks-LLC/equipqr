import { RealOrganizationMember } from '@/hooks/useOrganizationMembers';
import { SlotAvailability } from '@/hooks/useOrganizationSlots';
import { isFreeOrganization } from './simplifiedBillingUtils';

export interface SimplifiedOrganizationRestrictions {
  canManageTeams: boolean;
  canAssignEquipmentToTeams: boolean;
  canUploadImages: boolean;
  canAccessFleetMap: boolean;
  canInviteMembers: boolean;
  hasAvailableSlots: boolean;
  upgradeMessage: string;
}

export const getSimplifiedOrganizationRestrictions = (
  members: RealOrganizationMember[],
  slotAvailability?: SlotAvailability,
  fleetMapEnabled: boolean = false
): SimplifiedOrganizationRestrictions => {
  const isFree = isFreeOrganization(members);
  const hasSlots = slotAvailability ? slotAvailability.available_slots > 0 : true;
  
  if (isFree) {
    return {
      canManageTeams: false,
      canAssignEquipmentToTeams: false,
      canUploadImages: false,
      canAccessFleetMap: false,
      canInviteMembers: true, // Can always invite, just need to pay
      hasAvailableSlots: true, // Free orgs can always purchase slots
      upgradeMessage: 'Invite team members to unlock collaboration features. You only pay $10/month per additional user.'
    };
  }
  
  // Multi-user organization (paid)
  return {
    canManageTeams: true,
    canAssignEquipmentToTeams: true,
    canUploadImages: true,
    canAccessFleetMap: fleetMapEnabled,
    canInviteMembers: hasSlots,
    hasAvailableSlots: hasSlots,
    upgradeMessage: hasSlots ? '' : 'Purchase more user licenses to invite additional team members.'
  };
};

export const getRestrictionMessage = (restriction: keyof SimplifiedOrganizationRestrictions): string => {
  const messages = {
    canManageTeams: 'Team management requires multiple users. Invite team members to unlock this feature.',
    canAssignEquipmentToTeams: 'Equipment team assignment requires multiple users. Invite team members to unlock this feature.',
    canUploadImages: 'Image uploads require multiple users. Invite team members to unlock this feature.',
    canAccessFleetMap: 'Fleet Map is a premium add-on. Enable it from your billing settings.',
    canInviteMembers: 'You can always invite team members. You only pay $10/month per additional user.',
    upgradeMessage: 'Invite team members to unlock collaboration features.'
  };
  
  return messages[restriction] || 'This feature requires multiple users in your organization.';
};