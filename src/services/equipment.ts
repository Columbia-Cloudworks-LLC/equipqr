
// Re-export all equipment-related services from the modular structure
export * from './services/equipment';

// Also re-export core work notes functionality for convenience
export { getWorkNotes, createWorkNote, canCreateWorkNotes } from './services/workNotes';
export type { WorkNote } from './services/workNotes/types';
