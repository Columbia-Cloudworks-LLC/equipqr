
// Export permission check types
export * from './types';

// Export unified permission check functions
export { checkAccessPermission, checkOrgOrTeamAccess, checkEquipmentEditPermission } from './accessCheck';
export { checkUpdatePermission } from './updatePermissionCheck';
export { checkDeletePermission } from './deletePermissionCheck';
export { checkCreatePermission } from './createPermissionCheck';

// Note: The edgeFunction.ts file is deprecated in favor of the unified permissions function
