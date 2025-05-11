
// Export all work notes services from a single entry point
import { WorkNote } from './types';
import { getWorkNotes } from './fetchService';
import { createWorkNote, updateWorkNote, deleteWorkNote } from './mutationService';
import { canManageWorkNotes, canCreateWorkNotes } from './permissionService';

export {
  // Types
  WorkNote,
  
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
