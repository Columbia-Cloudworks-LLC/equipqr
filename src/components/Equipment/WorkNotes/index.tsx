
import { useEffect, useState } from 'react';
import { NotesList } from './NotesList';
import { AddNoteForm } from './AddNoteForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Info } from 'lucide-react';
import { useWorkNotes } from './useWorkNotes';
import { canCreateWorkNotes, canManageWorkNotes } from '@/services/workNotes/permissionService';
import { toast } from 'sonner';

interface WorkNotesProps {
  equipmentId: string;
}

export function WorkNotes({ equipmentId }: WorkNotesProps) {
  const [canCreate, setCanCreate] = useState<boolean | null>(null);
  const [canManage, setCanManage] = useState<boolean | null>(null);
  const [permissionLoading, setPermissionLoading] = useState<boolean>(true);

  const { 
    workNotes, 
    isLoading, 
    error, 
    addNote, 
    editNote,
    deleteNote,
    refetchNotes,
    createMutation
  } = useWorkNotes(equipmentId);

  // Check permissions when component mounts
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setPermissionLoading(true);
        const [createPermission, managePermission] = await Promise.all([
          canCreateWorkNotes(equipmentId),
          canManageWorkNotes(equipmentId)
        ]);
        setCanCreate(createPermission);
        setCanManage(managePermission);
      } catch (err) {
        console.error('Error checking permissions:', err);
        toast.error('Failed to check permissions');
        // Default to no permissions on error
        setCanCreate(false);
        setCanManage(false);
      } finally {
        setPermissionLoading(false);
      }
    };

    if (equipmentId) {
      checkPermissions();
    }
  }, [equipmentId]);

  // Handle work notes data fetching error
  useEffect(() => {
    if (error) {
      toast.error('Failed to load work notes', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
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
      
      {canCreate && (
        <AddNoteForm 
          onAddNote={addNote} 
          isPending={createMutation.isPending}
        />
      )}
      
      <NotesList 
        notes={workNotes} 
        isLoading={isLoading} 
        canManage={canManage || false} 
        onEditNote={editNote}
        onDeleteNote={deleteNote}
      />
    </div>
  );
}

export default WorkNotes;
