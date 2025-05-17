
/**
 * Re-export all team service functions from their respective modules
 */

// Re-export team retrieval functions
export { getTeams, getTeamById } from './retrieval/getTeamDetails';

// Re-export team creation functions
export { createTeam } from './creation/createTeam';

// Re-export team validation functions
// Don't re-export checkRoleChangePermission to avoid conflict with roleService
export { 
  validateTeamMembership,
  repairTeamMembership,
  getTeamAccessDetails
} from './teamValidationService';

// Export team update and deletion functions
export { updateTeam } from './updateTeam';
export { deleteTeam } from './deleteTeam';

// Export team member management functions
export { 
  getTeamMembers, 
  changeRole, 
  removeMember 
} from './memberService';

// Export team invitation functions
export { 
  inviteMember,
  resendInvite,
  getPendingInvitations,
  cancelInvitation
} from './invitation';
