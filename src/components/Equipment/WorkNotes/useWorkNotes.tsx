
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  WorkNote, 
  getWorkNotes, 
  createWorkNote, 
  updateWorkNote, 
  deleteWorkNote,
  canManageWorkNotes,
  canCreateWorkNotes 
} from '@/services/workNotes';

// Organization type for filtering
interface Organization {
  id: string;
  name: string;
  is_external?: boolean;
}

export function useWorkNotes(equipmentId: string) {
  const [editingNote, setEditingNote] = useState<WorkNote | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const queryClient = useQueryClient();
  
  // Fetch work notes
  const { 
    data: workNotes = [], 
    isLoading, 
    error,
    refetch: refetchNotes 
  } = useQuery({
    queryKey: ['workNotes', equipmentId],
    queryFn: () => getWorkNotes(equipmentId),
  });
  
  // Extract organizations from notes for filtering
  useEffect(() => {
    if (workNotes.length > 0) {
      const orgMap = new Map<string, Organization>();
      
      workNotes.forEach(note => {
        if (note.organization_id && note.organization_name) {
          orgMap.set(note.organization_id, {
            id: note.organization_id,
            name: note.organization_name,
            is_external: note.is_external_org
          });
        }
      });
      
      setOrganizations(Array.from(orgMap.values()));
    }
  }, [workNotes]);
  
  // Check user permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const [managePermission, createPermission] = await Promise.all([
          canManageWorkNotes(equipmentId),
          canCreateWorkNotes(equipmentId)
        ]);
        setCanEdit(managePermission);
        setCanCreate(createPermission);
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };
    
    if (equipmentId) {
      checkPermissions();
    }
  }, [equipmentId]);
  
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
      setEditingNote(null);
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
  
  // Handle updating a work note
  const handleUpdateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !editingNote.id) return;
    
    // Convert the hours_worked string to a number if it exists
    let hoursValue: number | null = null;
    
    if (editingNote.hours_worked !== undefined && editingNote.hours_worked !== null) {
      if (typeof editingNote.hours_worked === 'string') {
        const parsed = parseFloat(editingNote.hours_worked as unknown as string);
        hoursValue = isNaN(parsed) ? null : parsed;
      } else {
        hoursValue = editingNote.hours_worked as number;
      }
    }
    
    updateMutation.mutate({
      id: editingNote.id,
      updates: {
        note: editingNote.note,
        is_public: editingNote.is_public,
        hours_worked: hoursValue
      }
    });
  };

  // Helper function to handle hours_worked input in the edit dialog
  const handleHoursWorkedChange = (value: string) => {
    if (editingNote) {
      setEditingNote({
        ...editingNote,
        hours_worked: value === '' ? null : parseFloat(value) || null
      });
    }
  };
  
  // Handle deleting a work note
  const handleDeleteNote = (id: string) => {
    deleteMutation.mutate(id);
  };
  
  // Filter notes based on public/private status
  const publicNotes = workNotes.filter(note => note.is_public);
  const allNotes = workNotes;
  
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
    addNote: handleAddNote,
    updateNote: handleUpdateNote,
    deleteNote: handleDeleteNote,
    editNote: setEditingNote,
    handleHoursWorkedChange,
    createMutation,
    refetchNotes
  };
}
