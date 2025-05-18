
/**
 * Re-export all team service functions from their respective modules
 */

// Re-export team retrieval functions
export { getTeams, getTeamById } from './retrieval/getTeamDetails';

// Re-export team creation functions
export { createTeam } from './creation/createTeam';

// Re-export team update functions
export { updateTeam } from './update/updateTeam';

// Re-export team deletion functions
export { deleteTeam } from './deleteTeam';
export type { DeleteTeamResult } from './deleteTeam';
export { getTeamEquipmentCount } from './deleteTeam';

// Re-export team membership functions
export { 
  getTeamMembers, 
  inviteMember, 
  changeRole, 
  removeMember, 
  resendInvite, 
  cancelInvitation, 
  getPendingInvitations 
} from './members';

// Re-export team validation functions
export {
  validateTeamMembership,
  repairTeamMembership,
  getTeamAccessDetails,
  canAssignTeamRole
} from './teamValidationService';
