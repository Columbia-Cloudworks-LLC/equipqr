
import { TeamMember } from '@/types';

export type HierarchicalStatus = 'Org Owner' | 'Org Admin' | 'Org Manager' | 'Team Member';

/**
 * Determines the highest hierarchical status for a team member
 * Hierarchy: Org Owner > Org Admin > Org Manager > Team Member
 */
export function getHierarchicalStatus(member: TeamMember & { org_role?: string; is_org_manager?: boolean }): HierarchicalStatus {
  // Check organization roles first (highest priority)
  if (member.org_role) {
    switch (member.org_role) {
      case 'owner':
        return 'Org Owner';
      case 'admin':
        return 'Org Admin';
      case 'manager':
        return 'Org Manager';
    }
  }
  
  // If they're marked as an org manager but no specific role, assume manager level
  if (member.is_org_manager) {
    return 'Org Manager';
  }
  
  // Default to team member
  return 'Team Member';
}

/**
 * Gets the appropriate badge variant for the hierarchical status
 */
export function getStatusBadgeVariant(status: HierarchicalStatus): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'Org Owner':
      return 'default'; // Primary/default styling for highest authority
    case 'Org Admin':
      return 'default';
    case 'Org Manager':
      return 'secondary';
    case 'Team Member':
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Gets the appropriate badge color classes for the hierarchical status
 */
export function getStatusBadgeColorClasses(status: HierarchicalStatus): string {
  switch (status) {
    case 'Org Owner':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Org Admin':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Org Manager':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Team Member':
      return 'bg-green-50 text-green-700 border-green-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}
