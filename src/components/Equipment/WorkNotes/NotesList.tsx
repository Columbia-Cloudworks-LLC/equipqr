
import React from 'react';
import { WorkNote } from '@/services/workNotes';
import { NoteItem } from './NoteItem';
import { Skeleton } from '@/components/ui/skeleton';

interface NotesListProps {
  notes: WorkNote[];
  isLoading: boolean;
  canManage: boolean;
  onEditNote: (note: WorkNote) => void;
  onDeleteNote: (id: string) => void;
  isNoteEditable: (note: WorkNote) => boolean;
}

export function NotesList({ 
  notes, 
  isLoading, 
  canManage, 
  onEditNote, 
  onDeleteNote,
  isNoteEditable
}: NotesListProps) {
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  
  if (notes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No work notes yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <NoteItem 
          key={note.id} 
          note={note} 
          canEdit={canManage} 
          setEditingNote={onEditNote}
          onDeleteNote={onDeleteNote} 
          isNoteEditable={isNoteEditable}
        />
      ))}
    </div>
  );
}
