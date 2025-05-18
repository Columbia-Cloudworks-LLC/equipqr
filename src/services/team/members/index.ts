
/**
 * Re-export all team members service functions for backward compatibility
 */
export { getTeamMembers } from './getTeamMembers';
export { changeRole } from './changeRole';
export { removeMember } from './removeMember';
export { 
  inviteMember, 
  resendInvite, 
  cancelInvitation, 
  getPendingInvitations 
} from '../invitation';

