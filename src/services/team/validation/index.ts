
/**
 * Re-export all team validation service functions for backward compatibility
 */
export { 
  validateTeamMembership, 
  getTeamAccessDetails 
} from './teamAccessValidation';

export { 
  repairTeamMembership 
} from './teamRepair';

export {
  canAssignTeamRole
} from './permissionChecks';

// Export type definitions
export type {
  TeamAccessDetails,
  TeamAccessResult,
  RepairResult
} from './teamValidationTypes';
