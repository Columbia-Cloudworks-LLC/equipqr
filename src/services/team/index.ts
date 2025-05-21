
// Export all team and membership functions
export * from './creation/createTeam';
export * from './retrieval';
export * from './update/updateTeam';

// Export from teamValidationService 
// Be specific in re-exporting to avoid ambiguity
export { 
  validateTeamMembership,
  repairTeamMembership,
  getTeamAccessDetails,
  canAssignTeamRole
} from './validation';

export * from './deleteTeam';
export * from './members'; // This exports the nested index.ts that exports getTeamMembers, etc.

// Re-export invitation functions with explicit naming to avoid ambiguity
export {
  inviteMember,
  getPendingInvitations,
  resendInvite,
  cancelInvitation,
  acceptInvitation,
  // Use validateInvitationToken instead of validateInvitation
  validateInvitationToken
} from './invitation';

// Export invitation helper utilities separately 
export * from './invitation/invitationHelpers';
