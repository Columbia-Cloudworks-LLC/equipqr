
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
    mutationFn: (data: { 
      equipment_id: string, 
      note: string, 
      is_public: boolean, 
      hours_worked: number | null, 
      work_order_id?: string,
      image_urls?: string[]
    }) => 
      createWorkNote(
        data.equipment_id, 
        data.note, 
        data.hours_worked, 
        data.is_public, 
        data.work_order_id,
        data.image_urls || []
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workNotes', equipmentId] });
      toast.success('Work note added successfully');
    },
    onError: (error: any) => {
      console.error('Failed to add work note:', error);
      toast.error('Failed to add work note', { 
        description: error.message || 'Please try again or contact support'
      });
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
      console.error('Failed to update work note:', error);
      toast.error('Failed to update work note', { 
        description: error.message || 'Please try again or contact support'
      });
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
      console.error('Failed to delete work note:', error);
      toast.error('Failed to delete work note', { 
        description: error.message || 'Please try again or contact support'
      });
    }
  });
  
  // Handle adding a new work note
  const handleAddNote = (
    note: string, 
    isPublic: boolean, 
    hoursWorked: string, 
    workOrderId?: string,
    imageUrls?: string[]
  ) => {
    const hours = hoursWorked ? parseFloat(hoursWorked) : null;
    
    // Validation
    if (!note.trim()) {
      toast.error('Note content is required');
      return;
    }
    
    // Ensure hours is a valid number
    if (hoursWorked && isNaN(parseFloat(hoursWorked))) {
      toast.error('Hours worked must be a valid number');
      return;
    }
    
    createMutation.mutate({
      equipment_id: equipmentId,
      note: note.trim(),
      is_public: isPublic,
      hours_worked: hours,
      work_order_id: workOrderId,
      image_urls: imageUrls || []
    });
  };

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    addNote: handleAddNote
  };
}
