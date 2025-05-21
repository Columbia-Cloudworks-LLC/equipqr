
/**
 * Re-export all team service functions from their respective modules
 */

// Re-export team retrieval functions
export { getTeams, getTeamById } from './retrieval';

// Re-export team creation functions
export { createTeam } from './creation/createTeam';

// Re-export team update functions
export { updateTeam } from './updateTeam';

// Re-export team deletion functions
export { deleteTeam } from './deleteTeam';
export type { DeleteTeamResult } from './deleteTeam';
export { getTeamEquipmentCount } from './deleteTeam';

// Re-export team membership functions
export { 
  getTeamMembers, 
  changeRole, 
  removeMember 
} from './members';

// Re-export team invitation functions
export {
  inviteMember,
  resendInvite,
  cancelInvitation,
  getPendingInvitations
} from './invitation';

// Re-export team validation functions
export {
  validateTeamMembership,
  repairTeamMembership,
  getTeamAccessDetails,
  canAssignTeamRole
} from './validation';
