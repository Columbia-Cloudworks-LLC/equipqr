
import { useEffect, useState } from 'react';
import { NotesList } from './NotesList';
import { AddNoteForm } from './AddNoteForm';
import { EditNoteDialog } from './EditNoteDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, AlertCircle } from 'lucide-react';
import { useWorkNotes } from './useWorkNotes';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface WorkNotesProps {
  equipmentId: string;
}

export function WorkNotes({ equipmentId }: WorkNotesProps) {
  const [permissionLoading, setPermissionLoading] = useState<boolean>(true);

  const { 
    workNotes, 
    isLoading, 
    error,
    isError,
    refetchNotes,
    createMutation,
    editingNote,
    setEditingNote,
    updateNote,
    handleHoursWorkedChange,
    deleteNote,
    addNote,
    canEdit,
    canCreate,
    isNoteEditable
  } = useWorkNotes(equipmentId);

  // Setting loading state
  useEffect(() => {
    // Short timeout to avoid quick flash of loading state
    const timer = setTimeout(() => {
      setPermissionLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle work notes data fetching error
  useEffect(() => {
    if (error) {
      console.error('Work notes error:', error);
    }
  }, [error]);

  if (permissionLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Work Notes</h2>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Work Notes</h2>
      
      {canCreate === false && (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Limited Access</AlertTitle>
          <AlertDescription>
            You can view work notes but don't have permission to create new notes for this equipment.
          </AlertDescription>
        </Alert>
      )}
      
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading work notes</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="self-start"
              onClick={() => refetchNotes()}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {canCreate && (
        <AddNoteForm 
          onAddNote={addNote} 
          isPending={createMutation.isPending}
        />
      )}
      
      <Alert variant="default" className="bg-yellow-50 border-yellow-200">
        <Info className="h-4 w-4" />
        <AlertTitle>Note Editing Policy</AlertTitle>
        <AlertDescription>
          Work notes can only be edited by their author within 24 hours of creation. After that, they become permanent records.
        </AlertDescription>
      </Alert>
      
      <NotesList 
        notes={workNotes} 
        isLoading={isLoading} 
        canManage={canEdit || false} 
        onEditNote={setEditingNote}
        onDeleteNote={deleteNote}
        isNoteEditable={isNoteEditable}
      />
      
      {editingNote && (
        <EditNoteDialog 
          editingNote={editingNote}
          setEditingNote={setEditingNote}
          onUpdateNote={updateNote}
          handleHoursWorkedChange={handleHoursWorkedChange}
        />
      )}
    </div>
  );
}

export default WorkNotes;
