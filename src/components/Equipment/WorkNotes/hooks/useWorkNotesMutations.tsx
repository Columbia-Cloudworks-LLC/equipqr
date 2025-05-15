
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  WorkNote, 
  createWorkNote, 
  updateWorkNote, 
  deleteWorkNote 
} from '@/services/workNotes';

export function useWorkNotesMutations(equipmentId: string) {
  const queryClient = useQueryClient();
  
  // Create work note mutation
  const createMutation = useMutation({
    mutationFn: (data: { equipment_id: string, note: string, is_public: boolean, hours_worked: number | null }) => 
      createWorkNote(data.equipment_id, data.note, data.hours_worked, data.is_public),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workNotes', equipmentId] });
      toast.success('Work note added successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to add work note', { description: error.message });
    }
  });
  
  // Update work note mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<WorkNote> }) => 
      updateWorkNote(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workNotes', equipmentId] });
      toast.success('Work note updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update work note', { description: error.message });
    }
  });
  
  // Delete work note mutation
  const deleteMutation = useMutation({
    mutationFn: deleteWorkNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workNotes', equipmentId] });
      toast.success('Work note deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete work note', { description: error.message });
    }
  });
  
  // Handle adding a new work note
  const handleAddNote = (note: string, isPublic: boolean, hoursWorked: string) => {
    const hours = hoursWorked ? parseFloat(hoursWorked) : null;
    
    createMutation.mutate({
      equipment_id: equipmentId,
      note: note.trim(),
      is_public: isPublic,
      hours_worked: hours
    });
  };

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    addNote: handleAddNote
  };
}
