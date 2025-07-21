
import { RealOrganizationMember } from '@/hooks/useOrganizationMembers';
import { SlotAvailability } from '@/hooks/useOrganizationSlots';

export interface EnhancedBillingCalculation {
  userSlots: {
    totalPurchased: number;
    slotsUsed: number;
    availableSlots: number;
    costPerSlot: number;
    totalSlotValue: number;
  };
  currentUsage: {
    activeUsers: number;
    pendingInvitations: number;
    totalSlotsNeeded: number;
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
  monthlyRecurring: number;
  prepaidSlotValue: number;
  estimatedNextBilling: number;
}

export const calculateEnhancedBilling = (
  members: RealOrganizationMember[],
  slotAvailability: SlotAvailability,
  storageGB: number,
  fleetMapEnabled: boolean
): EnhancedBillingCalculation => {
  const activeMembers = members.filter(member => member.status === 'active');
  const pendingMembers = members.filter(member => member.status === 'pending');
  
  // User slot calculations
  const costPerSlot = 10; // $10 per slot
  const totalSlotValue = slotAvailability.total_purchased * costPerSlot;
  
  // Current usage
  const activeUsers = Math.max(0, activeMembers.length - 1); // Exclude owner
  const pendingInvitations = pendingMembers.length;
  const totalSlotsNeeded = activeUsers + pendingInvitations;
  
  // Storage calculations
  const freeGB = 5;
  const overageGB = Math.max(0, storageGB - freeGB);
  const storageCost = overageGB * 0.10;
  
  // Fleet map cost
  const fleetMapCost = fleetMapEnabled ? 10 : 0;
  
  // Monthly recurring costs (storage + fleet map)
  const monthlyRecurring = storageCost + fleetMapCost;
  
  // Estimate next billing - additional slots needed beyond current purchase and exemptions
  const totalAvailable = slotAvailability.total_purchased + slotAvailability.exempted_slots;
  const additionalSlotsNeeded = Math.max(0, totalSlotsNeeded - totalAvailable);
  const estimatedNextBilling = monthlyRecurring + (additionalSlotsNeeded * costPerSlot);
  
  return {
    userSlots: {
      totalPurchased: slotAvailability.total_purchased,
      slotsUsed: slotAvailability.used_slots,
      availableSlots: slotAvailability.available_slots,
      costPerSlot,
      totalSlotValue
    },
    currentUsage: {
      activeUsers,
      pendingInvitations,
      totalSlotsNeeded
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
    monthlyRecurring,
    prepaidSlotValue: totalSlotValue,
    estimatedNextBilling
  };
};

export const getSlotStatus = (slotAvailability: SlotAvailability, totalNeeded: number) => {
  const { available_slots, total_purchased, exempted_slots } = slotAvailability;
  
  if (total_purchased === 0 && exempted_slots === 0) {
    return {
      status: 'no-slots' as const,
      message: 'No slots purchased yet',
      variant: 'secondary' as const
    };
  }
  
  if (available_slots >= totalNeeded) {
    const message = exempted_slots > 0 
      ? `${available_slots} slots available (${exempted_slots} exempted)`
      : `${available_slots} slots available`;
    return {
      status: 'sufficient' as const,
      message,
      variant: 'default' as const
    };
  }
  
  if (available_slots > 0) {
    return {
      status: 'low' as const,
      message: `Only ${available_slots} slots remaining`,
      variant: 'destructive' as const
    };
  }
  
  return {
    status: 'exhausted' as const,
    message: 'All slots used',
    variant: 'destructive' as const
  };
};

export const shouldBlockInvitation = (slotAvailability: SlotAvailability): boolean => {
  return slotAvailability.available_slots <= 0;
};

export const canUpgradeSlots = (members: RealOrganizationMember[]): boolean => {
  // Organizations with multiple members (or pending members) can purchase slots
  return members.length > 1 || members.some(m => m.status === 'pending');
};
