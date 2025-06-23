
import { RealOrganizationMember } from '@/hooks/useOrganizationMembers';

export interface BillingCalculation {
  userLicenses: {
    totalUsers: number;
    billableUsers: number;
    cost: number;
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
  total: number;
}

export const calculateUserLicenseCost = (members: RealOrganizationMember[]): { totalUsers: number; billableUsers: number; cost: number } => {
  const activeMembers = members.filter(member => member.status === 'active');
  const totalUsers = activeMembers.length;
  
  // First user (owner) is free, others are billable
  const billableUsers = Math.max(0, totalUsers - 1);
  const cost = billableUsers * 10; // $10 per user per month
  
  return { totalUsers, billableUsers, cost };
};

export const calculateStorageCost = (usageGB: number): { usedGB: number; freeGB: number; overageGB: number; cost: number } => {
  const freeGB = 5;
  const overageGB = Math.max(0, usageGB - freeGB);
  const cost = overageGB * 0.10; // $0.10 per GB per month
  
  return {
    usedGB: usageGB,
    freeGB,
    overageGB,
    cost
  };
};

export const calculateFleetMapCost = (enabled: boolean): { enabled: boolean; cost: number } => {
  return {
    enabled,
    cost: enabled ? 10 : 0 // $10 per month when enabled
  };
};

export const calculateTotalBilling = (
  members: RealOrganizationMember[],
  storageGB: number,
  fleetMapEnabled: boolean
): BillingCalculation => {
  const userLicenses = calculateUserLicenseCost(members);
  const storage = calculateStorageCost(storageGB);
  const fleetMap = calculateFleetMapCost(fleetMapEnabled);
  
  const total = userLicenses.cost + storage.cost + fleetMap.cost;
  
  return {
    userLicenses,
    storage,
    fleetMap,
    total
  };
};

export const isFreeOrganization = (members: RealOrganizationMember[]): boolean => {
  const activeMembers = members.filter(member => member.status === 'active');
  return activeMembers.length === 1;
};

export const canUpgradeFromFree = (members: RealOrganizationMember[]): boolean => {
  return isFreeOrganization(members);
};
