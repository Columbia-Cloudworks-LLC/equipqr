
import { SessionOrganization } from '@/contexts/SessionContext';

export interface PagePermissions {
  canInviteMembers: boolean;
  isAtMemberLimit: boolean;
  shouldShowMemberLimitWarning: boolean;
}

export const usePagePermissions = (organization: SessionOrganization | null): PagePermissions => {
  if (!organization) {
    return {
      canInviteMembers: false,
      isAtMemberLimit: false,
      shouldShowMemberLimitWarning: false
    };
  }

  const canInviteMembers = ['owner', 'admin'].includes(organization.userRole || '');
  const isAtMemberLimit = organization.memberCount >= organization.maxMembers;
  const shouldShowMemberLimitWarning = isAtMemberLimit && organization.plan === 'free';

  return {
    canInviteMembers,
    isAtMemberLimit,
    shouldShowMemberLimitWarning
  };
};
