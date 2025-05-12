
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

