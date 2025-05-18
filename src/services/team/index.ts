
/**
 * Re-export all team service functions from their respective modules
 */

// Re-export team retrieval functions
export { getTeams, getTeamById } from './retrieval';

// Re-export team creation functions
export { createTeam } from './creation/createTeam';

// Re-export team validation functions
export { 
  validateTeamMembership,
  repairTeamMembership,
  getTeamAccessDetails,
  canAssignTeamRole
} from './validation';

// Re-export team role functions
export {
  checkRoleChangePermission,
  upgradeToManagerRole,
  requestRoleUpgrade,
  getEffectiveRole,
  hasRolePermission
} from './roleService';

// Export team update and deletion functions
export { updateTeam } from './updateTeam';
export { deleteTeam } from './deleteTeam';

// Export team member management functions
export { 
  getTeamMembers, 
  changeRole, 
  removeMember 
} from './members';

// Export team invitation functions
export { 
  inviteMember,
  resendInvite,
  getPendingInvitations,
  cancelInvitation
} from './invitation';
