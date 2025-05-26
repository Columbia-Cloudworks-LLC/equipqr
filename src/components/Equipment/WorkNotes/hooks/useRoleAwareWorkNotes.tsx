
import { useQuery } from '@tanstack/react-query';
import { getUserRoleForEquipment } from '@/services/equipment/equipmentRoleService';
import { getRoleBasedWorkNotePermissions } from '@/services/workNotes/rolePermissionService';
import { useWorkNotesQuery } from './useWorkNotesQuery';
import { useWorkNotesMutations } from './useWorkNotesMutations';
import { useWorkNotesState } from './useWorkNotesState';

export function useRoleAwareWorkNotes(equipmentId: string) {
  // Get user role for this equipment
  const { data: userRole = 'none' } = useQuery({
    queryKey: ['equipmentUserRole', equipmentId],
    queryFn: () => getUserRoleForEquipment(equipmentId)
  });

  // Get role-based permissions
  const { data: permissions } = useQuery({
    queryKey: ['roleBasedWorkNotePermissions', equipmentId],
    queryFn: () => getRoleBasedWorkNotePermissions(equipmentId)
  });

  const { 
    workNotes,
    publicNotes, 
    allNotes,
    organizations,
    isLoading,
    error,
    isError,
    refetchNotes 
  } = useWorkNotesQuery(equipmentId);

  const {
    createMutation,
    updateMutation,
    deleteMutation,
    addNote
  } = useWorkNotesMutations(equipmentId);

  const {
    editingNote,
    setEditingNote,
    updateNote: handleUpdateNote,
    handleHoursWorkedChange,
    isNoteEditable
  } = useWorkNotesState();
  
  // Filter notes based on user permissions
  const visibleNotes = permissions?.canViewPrivate 
    ? workNotes 
    : workNotes.filter(note => note.is_public);

  // Handle deleting a work note with role check
  const handleDeleteNote = (id: string) => {
    if (permissions?.canDelete) {
      deleteMutation.mutate(id);
    }
  };

  // Wrapped update note handler
  const updateNote = (e: React.FormEvent) => {
    handleUpdateNote(e, updateMutation);
  };

  // Enhanced note editable check with role permissions
  const isNoteEditableWithRole = (note: any) => {
    if (!permissions?.canEdit) return false;
    return isNoteEditable(note);
  };
  
  return {
    workNotes: visibleNotes,
    publicNotes,
    allNotes,
    organizations,
    isLoading,
    error,
    isError,
    userRole,
    permissions: permissions || {
      canCreate: false,
      canCreatePrivate: false,
      canEnterHours: false,
      canViewPrivate: false,
      canEdit: false,
      canDelete: false,
      userRole: 'none'
    },
    editingNote,
    setEditingNote,
    addNote,
    updateNote,
    deleteNote: handleDeleteNote,
    editNote: setEditingNote,
    handleHoursWorkedChange,
    createMutation,
    refetchNotes,
    isNoteEditable: isNoteEditableWithRole
  };
}
