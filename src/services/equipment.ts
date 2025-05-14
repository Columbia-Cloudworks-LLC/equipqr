
// Re-export all equipment-related services from the modular structure
export * from './equipment/index';

// Also re-export core work notes functionality for convenience
export { getWorkNotes, createWorkNote, canCreateWorkNotes } from './workNotes/index';
export type { WorkNote } from './workNotes/types';
