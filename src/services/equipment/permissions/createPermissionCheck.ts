
// This file has been refactored.
// Its functionality is now distributed across:
// - permissions/index.ts
// - permissions/edgeFunction.ts 
// - permissions/fallbackChecks.ts
// - permissions/types.ts
//
// Please import from './permissions' instead of './permissions/createPermissionCheck'

// Redirect imports to the new location
export * from './index';
