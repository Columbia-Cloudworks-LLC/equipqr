// Central export for all enhanced organization hooks with real-time subscriptions

// Enhanced organization member hooks
export {
  useEnhancedOrganizationMembers,
  useEnhancedOrganizationMemberStats,
  useEnhancedUpdateMemberRole,
  useEnhancedRemoveMember,
  type RealOrganizationMember
} from './useEnhancedOrganizationMembers';

// Enhanced organization admin hooks
export {
  useEnhancedOrganizationAdmins,
  type OrganizationAdmin
} from './useEnhancedOrganizationAdmins';

// Enhanced organization slot hooks
export {
  useEnhancedOrganizationSlots,
  useEnhancedSlotAvailability,
  useEnhancedSlotPurchases,
  useEnhancedReserveSlot,
  useEnhancedReleaseSlot,
  type OrganizationSlot,
  type SlotAvailability,
  type SlotPurchase
} from './useEnhancedOrganizationSlots';

// Enhanced organization invitation hooks
export {
  useEnhancedOrganizationInvitations
} from './useEnhancedOrganizationInvitations';

// Combined hook for all organization data with background sync
export {
  useEnhancedOrganizationData
} from './useEnhancedOptimizedQueries';