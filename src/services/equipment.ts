
// Re-export all equipment-related services from the modular structure
export * from './equipment/index';
export * from './equipment/attributesService';
export * from './equipment/scanService';
export * from './equipment/equipmentDetailsService';

// Also re-export core work notes functionality for convenience
export { getWorkNotes, createWorkNote, canCreateWorkNotes } from './workNotes';
