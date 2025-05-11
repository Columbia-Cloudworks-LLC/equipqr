
import React from 'react';
import { WorkNote } from '@/services/workNotesService';
import { NoteItem } from './NoteItem';

interface NotesListProps {
  notes: WorkNote[];
  isLoading: boolean;
  canEdit: boolean;
  setEditingNote: (note: WorkNote) => void;
  onDeleteNote: (id: string) => void;
}

export function NotesList({ notes, isLoading, canEdit, setEditingNote, onDeleteNote }: NotesListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (notes.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No work notes for this equipment
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {notes.map(note => (
        <NoteItem 
          key={note.id} 
          note={note} 
          canEdit={canEdit} 
          setEditingNote={setEditingNote} 
          onDeleteNote={onDeleteNote} 
        />
      ))}
    </div>
  );
}
