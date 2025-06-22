
import { useOrganizationMembers } from './useOrganizationMembers';
import { useOrganizationAdmins } from './useOrganizationAdmins';
import { SessionOrganization } from '@/contexts/SessionContext';

export interface OrganizationStats {
  memberCount: number;
  adminCount: number;
  plan: string;
  featureCount: number;
  isLoading: boolean;
}

export const useOrganizationStats = (organization: SessionOrganization | null): OrganizationStats => {
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(organization?.id || '');
  const { data: admins = [], isLoading: adminsLoading } = useOrganizationAdmins(organization?.id || '');

  return {
    memberCount: members.length,
    adminCount: admins.length,
    plan: organization?.plan === 'premium' ? 'Premium' : 'Free Plan',
    featureCount: organization?.features.length || 0,
    isLoading: membersLoading || adminsLoading
  };
};
