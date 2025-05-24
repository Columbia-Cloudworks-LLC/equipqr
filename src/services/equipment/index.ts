
// Re-export all functions from the module files

// Core equipment services
export * from './equipmentCreateService';
export * from './equipmentDetailsService';
export * from './equipmentListService';
export * from './equipmentUpdateService';
export * from './equipmentDeleteService';
export * from './equipmentDuplicationService';
export * from './scanService';
export * from './attributesService';

// Service modules
export * from './services/authService';
export * from './services/cacheService';
export * from './services/fetchService';

// Caching modules
export * from './caching/equipmentCache';

// Query modules
export * from './queries/directQueries';
export * from './queries/edgeFunctionQueries';

// Utility modules
export * from './utils/dataProcessing';
export * from './utils/equipmentFormatting';

// Permission checking modules
export * from './permissions/accessCheck';
export * from './permissions';
export * from './permissions/updatePermissionCheck';

// Database operations
export * from './db/equipmentDbService';
export * from './db/equipmentUpdateDbService';
