import { useOrganizationMembers } from './useOrganizationMembers';
import { useSlotAvailability } from './useOrganizationSlots';
import { useUnifiedOrganization } from '@/contexts/UnifiedOrganizationContext';
import { getSimplifiedOrganizationRestrictions, getRestrictionMessage } from '@/utils/simplifiedOrganizationRestrictions';

export const useSimplifiedOrganizationRestrictions = (fleetMapEnabled: boolean = false) => {
  const { currentOrganization } = useUnifiedOrganization();
  const { data: members = [] } = useOrganizationMembers(currentOrganization?.id || '');
  const { data: slotAvailability } = useSlotAvailability(currentOrganization?.id || '');

  const restrictions = getSimplifiedOrganizationRestrictions(members, slotAvailability, fleetMapEnabled);

  const checkRestriction = (restriction: keyof typeof restrictions) => {
    return {
      allowed: restrictions[restriction],
      message: restrictions[restriction] ? '' : getRestrictionMessage(restriction),
      upgradeMessage: restrictions.upgradeMessage
    };
  };

  return {
    restrictions,
    checkRestriction,
    getRestrictionMessage,
    isSingleUser: members.filter(m => m.status === 'active').length === 1,
    canUpgrade: true // Always can upgrade in pay-as-you-go model
  };
};