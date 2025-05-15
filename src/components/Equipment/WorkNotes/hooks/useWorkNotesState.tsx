
import { useState } from 'react';
import { WorkNote } from '@/services/workNotes';

export function useWorkNotesState() {
  const [editingNote, setEditingNote] = useState<WorkNote | null>(null);
  
  // Handle updating a work note
  const handleUpdateNote = (e: React.FormEvent, updateMutation: any) => {
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

    setEditingNote(null);
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

  return {
    editingNote,
    setEditingNote,
    updateNote: handleUpdateNote,
    handleHoursWorkedChange
  };
}
