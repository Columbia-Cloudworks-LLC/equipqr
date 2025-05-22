
import { useState } from 'react';
import { WorkNote } from '@/services/workNotes';
import { UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useWorkNotesState() {
  const [editingNote, setEditingNote] = useState<WorkNote | null>(null);
  
  // Handle updating a work note
  const updateNote = async (
    e: React.FormEvent,
    updateMutation: UseMutationResult<WorkNote, Error, { id: string, updates: Partial<WorkNote> }>
  ) => {
    e.preventDefault();
    
    if (!editingNote || !editingNote.id) {
      return;
    }
    
    try {
      await updateMutation.mutateAsync({
        id: editingNote.id,
        updates: {
          note: editingNote.note,
          is_public: editingNote.is_public,
          hours_worked: editingNote.hours_worked
        }
      });
      
      // Reset editing state
      setEditingNote(null);
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Error updating note:', error);
    }
  };
  
  // Handle hours worked input change
  const handleHoursWorkedChange = (value: string) => {
    if (!editingNote) return;

    let numValue: number | null = null;
    if (value !== '') {
      numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        toast.error('Hours worked must be a positive number');
        return;
      }
    }

    setEditingNote(prev => prev ? { ...prev, hours_worked: numValue } : null);
  };
  
  // Check if a note is editable (within 24 hours of creation)
  const isNoteEditable = (note: WorkNote): boolean => {
    if (!note.created_at) return false;
    
    const createdAt = new Date(note.created_at);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceCreation <= 24;
  };

  return {
    editingNote,
    setEditingNote,
    updateNote,
    handleHoursWorkedChange,
    isNoteEditable
  };
}
