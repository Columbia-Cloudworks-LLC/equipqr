
import React, { useState } from 'react';
import { format } from 'date-fns';
import { WorkNote } from '@/services/workNotesService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Edit, Trash } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface NoteItemProps {
  note: WorkNote;
  canEdit: boolean;
  setEditingNote: (note: WorkNote) => void;
  onDeleteNote: (id: string) => void;
}

export function NoteItem({ note, canEdit, setEditingNote, onDeleteNote }: NoteItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <div 
      className={`border rounded-md p-3 ${!note.is_public ? 'bg-gray-50' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={note.is_public ? 'outline' : 'secondary'} className={note.is_public ? 'bg-green-100 text-green-800' : ''}>
              {note.is_public ? 'Public' : 'Private'}
            </Badge>
            {note.creator?.display_name && (
              <span className="text-sm text-muted-foreground">
                {note.creator.display_name}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {note.created_at && format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
          
          <div className={`text-sm mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}>
            {note.note}
          </div>
          
          {note.note.length > 120 && (
            <button
              onClick={toggleExpand}
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
        
        {canEdit && (
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setEditingNote(note)}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Work Note</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this work note? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => note.id && onDeleteNote(note.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
      
      {note.hours_worked && (
        <div className="flex items-center mt-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          {note.hours_worked} hours
        </div>
      )}
    </div>
  );
}
