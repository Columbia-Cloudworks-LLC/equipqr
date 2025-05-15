
import { useWorkNotesQuery } from './hooks/useWorkNotesQuery';
import { useWorkNotesMutations } from './hooks/useWorkNotesMutations';
import { useWorkNotesPermissions } from './hooks/useWorkNotesPermissions';
import { useWorkNotesState } from './hooks/useWorkNotesState';
import { WorkNote } from '@/services/workNotes';

export function useWorkNotes(equipmentId: string) {
  const { 
    workNotes,
    publicNotes, 
    allNotes,
    organizations,
    isLoading,
    error,
    refetchNotes 
  } = useWorkNotesQuery(equipmentId);

  const {
    createMutation,
    updateMutation,
    deleteMutation,
    addNote
  } = useWorkNotesMutations(equipmentId);

  const { canEdit, canCreate } = useWorkNotesPermissions(equipmentId);

  const {
    editingNote,
    setEditingNote,
    updateNote: handleUpdateNote,
    handleHoursWorkedChange
  } = useWorkNotesState();
  
  // Handle deleting a work note
  const handleDeleteNote = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Wrapped update note handler to pass the mutation
  const updateNote = (e: React.FormEvent) => {
    handleUpdateNote(e, updateMutation);
  };
  
  return {
    workNotes,
    publicNotes,
    allNotes,
    organizations,
    isLoading,
    error,
    canEdit,
    canCreate,
    editingNote,
    setEditingNote,
    addNote,
    updateNote,
    deleteNote: handleDeleteNote,
    editNote: setEditingNote,
    handleHoursWorkedChange,
    createMutation,
    refetchNotes
  };
}
