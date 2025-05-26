
import { useEffect, useState } from 'react';
import { EditNoteDialog } from './EditNoteDialog';
import { RoleAwareAddNoteForm } from './RoleAwareAddNoteForm';
import { RoleAwareNotesList } from './RoleAwareNotesList';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, AlertCircle, Shield } from 'lucide-react';
import { useRoleAwareWorkNotes } from './hooks/useRoleAwareWorkNotes';
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
    userRole,
    permissions,
    refetchNotes,
    createMutation,
    editingNote,
    setEditingNote,
    updateNote,
    handleHoursWorkedChange,
    deleteNote,
    addNote,
    isNoteEditable
  } = useRoleAwareWorkNotes(equipmentId);

  // Setting loading state
  useEffect(() => {
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Work Notes</h2>
        
        {/* Role indicator */}
        {userRole !== 'none' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span className="capitalize">{userRole}</span>
          </div>
        )}
      </div>

      {/* Role-specific access alerts */}
      {userRole === 'viewer' && (
        <Alert variant="default" className="bg-gray-50 border-gray-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Viewer Access</AlertTitle>
          <AlertDescription>
            You have read-only access to work notes. You can view public notes but cannot create, edit, or delete notes.
          </AlertDescription>
        </Alert>
      )}

      {userRole === 'requestor' && (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Requestor Access</AlertTitle>
          <AlertDescription>
            You can create public work notes to communicate with technicians and managers. Your notes will be visible to all team members, but you cannot enter hours worked or create private notes.
          </AlertDescription>
        </Alert>
      )}

      {userRole === 'none' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Access</AlertTitle>
          <AlertDescription>
            You don't have permission to view work notes for this equipment.
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
      
      {/* Add note form - role-aware */}
      {permissions.canCreate && (
        <RoleAwareAddNoteForm 
          onAddNote={addNote} 
          isPending={createMutation.isPending}
          userRole={userRole}
        />
      )}
      
      {/* Editing policy alert */}
      {permissions.canEdit && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Note Editing Policy</AlertTitle>
          <AlertDescription>
            Work notes can only be edited by their author within 24 hours of creation. After that, they become permanent records.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Notes list - role-aware */}
      <RoleAwareNotesList 
        notes={workNotes} 
        isLoading={isLoading} 
        userRole={userRole}
        canEdit={permissions.canEdit}
        canDelete={permissions.canDelete}
        canViewPrivate={permissions.canViewPrivate}
        onEditNote={setEditingNote}
        onDeleteNote={deleteNote}
        isNoteEditable={isNoteEditable}
      />
      
      {/* Edit dialog */}
      {editingNote && permissions.canEdit && (
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
