
import { RealOrganizationMember } from '@/hooks/useOrganizationMembers';
import { SlotAvailability } from '@/hooks/useOrganizationSlots';

export interface LicenseBillingCalculation {
  userLicenses: {
    totalPurchased: number;
    slotsUsed: number;
    availableSlots: number;
    costPerLicense: number;
    monthlyLicenseCost: number;
    nextBillingDate?: string;
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

export const calculateLicenseBilling = (
  members: RealOrganizationMember[],
  slotAvailability: SlotAvailability,
  storageGB: number = 0,
  fleetMapEnabled: boolean = false
): LicenseBillingCalculation => {
  const activeMembers = members.filter(member => member.status === 'active');
  
  // License calculations based on purchased slots, not active members
  const totalPurchased = slotAvailability.total_purchased;
  const slotsUsed = slotAvailability.used_slots;
  const availableSlots = slotAvailability.available_slots;
  const costPerLicense = 10; // $10 per license per month
  const monthlyLicenseCost = totalPurchased * costPerLicense;
  
  // Calculate next billing date (end of current period)
  const nextBillingDate = slotAvailability.current_period_end;
  
  // Storage calculations - 5GB free, $0.10 per GB overage
  const freeGB = 5;
  const overageGB = Math.max(0, storageGB - freeGB);
  const storageCost = overageGB * 0.10;
  
  // Fleet map cost - $10/month when enabled
  const fleetMapCost = fleetMapEnabled ? 10 : 0;
  
  const monthlyTotal = monthlyLicenseCost + storageCost + fleetMapCost;
  
  return {
    userLicenses: {
      totalPurchased,
      slotsUsed,
      availableSlots,
      costPerLicense,
      monthlyLicenseCost,
      nextBillingDate
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

export const hasLicenses = (slotAvailability: SlotAvailability): boolean => {
  return slotAvailability.total_purchased > 0;
};

export const getLicenseStatus = (slotAvailability: SlotAvailability, activeMembers: number) => {
  const { total_purchased, used_slots, available_slots } = slotAvailability;
  
  if (total_purchased === 0) {
    return {
      status: 'no-licenses' as const,
      message: 'No licenses purchased',
      variant: 'secondary' as const
    };
  }
  
  if (available_slots > 0) {
    return {
      status: 'available' as const,
      message: `${available_slots} licenses available`,
      variant: 'default' as const
    };
  }
  
  return {
    status: 'full' as const,
    message: 'All licenses in use',
    variant: 'destructive' as const
  };
};

export const getUpgradeMessage = (slotAvailability: SlotAvailability): string => {
  if (slotAvailability.total_purchased === 0) {
    return 'Purchase user licenses to enable team collaboration at $10/month per license.';
  }
  return 'Purchase additional licenses to expand your team capacity.';
};
