
// Export all work notes services from a single entry point
import { getWorkNotes } from './fetchService';
import { createWorkNote, updateWorkNote, deleteWorkNote } from './mutationService';
import { canManageWorkNotes, canCreateWorkNotes } from './permissionService';
import type { WorkNote } from './types';

export {
  // Fetch services
  getWorkNotes,
  
  // Mutation services
  createWorkNote,
  updateWorkNote,
  deleteWorkNote,
  
  // Permission services
  canManageWorkNotes,
  canCreateWorkNotes
};

// Re-export types
export type { WorkNote };
