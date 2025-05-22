
import React, { useState } from 'react';
import { format } from 'date-fns';
import { WorkNote } from '@/services/workNotes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Edit, Trash, Building, Users, History } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NoteItemProps {
  note: WorkNote;
  canEdit: boolean;
  setEditingNote: (note: WorkNote) => void;
  onDeleteNote: (id: string) => void;
  isNoteEditable: (note: WorkNote) => boolean;
}

export function NoteItem({ 
  note, 
  canEdit, 
  setEditingNote, 
  onDeleteNote, 
  isNoteEditable 
}: NoteItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
  };

  // Get author name from either the creator object or fallback to created_by field
  const authorName = note.creator?.display_name || note.created_by;
  
  // Check if this note is still within the editable window
  const editable = isNoteEditable(note);

  return (
    <div 
      className={`border rounded-md p-3 ${
        note.is_external_org ? 
          'bg-blue-50 border-blue-100' : 
          !note.is_public ? 'bg-gray-50' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="w-full pr-16">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={note.is_public ? 'outline' : 'secondary'} className={note.is_public ? 'bg-green-100 text-green-800' : ''}>
              {note.is_public ? 'Public' : 'Private'}
            </Badge>
            
            {authorName && (
              <span className="text-sm text-muted-foreground">
                {authorName}
              </span>
            )}
            
            <span className="text-xs text-muted-foreground">
              {note.created_at && format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
          
          {/* Organization info for cross-org notes */}
          {note.is_external_org && note.organization_name && (
            <div className="flex items-center text-xs text-muted-foreground mb-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <Building className="h-3 w-3 mr-1" />
                      {note.organization_name}
                      <Badge variant="outline" className="ml-2 px-1 py-0 text-[10px] h-4 bg-blue-50 border-blue-200">
                        External
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Note from an external organization</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {note.team_name && (
                <span className="ml-2 flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {note.team_name}
                </span>
              )}
            </div>
          )}
          
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
          
          {/* Edit history information */}
          {note.edited_at && (
            <div className="flex items-center mt-1 text-xs text-muted-foreground">
              <History className="h-3 w-3 mr-1" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span>
                      Edited {format(new Date(note.edited_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Note was last edited on {format(new Date(note.edited_at), 'MMMM d, yyyy h:mm a')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
        
        {canEdit && !note.is_external_org && (
          <div className="flex space-x-2 absolute top-3 right-3">
            {/* Edit button - only show if within 24 hour window */}
            {editable && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setEditingNote(note)}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            )}
            
            {/* Delete button - only authors can delete their notes */}
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
