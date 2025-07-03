import { RealOrganizationMember } from '@/hooks/useOrganizationMembers';

export interface SimplifiedBillingCalculation {
  userLicenses: {
    totalUsers: number;
    billableUsers: number;
    costPerUser: number;
    totalCost: number;
  };
  storage: {
    usedGB: number;
    freeGB: number;
    overageGB: number;
    cost: number;
  };
  fleetMap: {
    enabled: boolean;
    cost: number;
  };
  monthlyTotal: number;
}

export const calculateSimplifiedBilling = (
  members: RealOrganizationMember[],
  storageGB: number = 0,
  fleetMapEnabled: boolean = false
): SimplifiedBillingCalculation => {
  const activeMembers = members.filter(member => member.status === 'active');
  const totalUsers = activeMembers.length;
  
  // First user (owner) is free, additional users are $10/month each
  const billableUsers = Math.max(0, totalUsers - 1);
  const costPerUser = 10; // $10 per user per month
  const userLicenseCost = billableUsers * costPerUser;
  
  // Storage calculations - 5GB free, $0.10 per GB overage
  const freeGB = 5;
  const overageGB = Math.max(0, storageGB - freeGB);
  const storageCost = overageGB * 0.10;
  
  // Fleet map cost - $10/month when enabled
  const fleetMapCost = fleetMapEnabled ? 10 : 0;
  
  const monthlyTotal = userLicenseCost + storageCost + fleetMapCost;
  
  return {
    userLicenses: {
      totalUsers,
      billableUsers,
      costPerUser,
      totalCost: userLicenseCost
    },
    storage: {
      usedGB: storageGB,
      freeGB,
      overageGB,
      cost: storageCost
    },
    fleetMap: {
      enabled: fleetMapEnabled,
      cost: fleetMapCost
    },
    monthlyTotal
  };
};

export const isFreeOrganization = (members: RealOrganizationMember[]): boolean => {
  const activeMembers = members.filter(member => member.status === 'active');
  return activeMembers.length === 1;
};

export const canInviteMembers = (members: RealOrganizationMember[]): boolean => {
  // Organizations can always invite members in the pay-as-you-go model
  // They just pay for each additional user
  return true;
};

export const getUpgradeMessage = (): string => {
  return 'Invite team members to unlock collaboration features. You only pay $10/month per additional user.';
};