
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, MessageSquare, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getWorkNotes, createWorkNote } from '@/services/workNotes';
import { getUserRoleForEquipment } from '@/services/equipment/equipmentRoleService';
import { getRoleBasedWorkNotePermissions } from '@/services/workNotes/rolePermissionService';
import { RoleAwareAddNoteForm } from '@/components/Equipment/WorkNotes/RoleAwareAddNoteForm';
import { RoleAwareNotesList } from '@/components/Equipment/WorkNotes/RoleAwareNotesList';
import { toast } from 'sonner';

interface RoleAwareWorkNotesProps {
  workOrderId: string;
  equipmentId: string;
}

export function RoleAwareWorkNotes({ workOrderId, equipmentId }: RoleAwareWorkNotesProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  // Get user role for this equipment
  const { data: userRole = 'none' } = useQuery({
    queryKey: ['equipmentUserRole', equipmentId],
    queryFn: () => getUserRoleForEquipment(equipmentId)
  });

  // Get role-based permissions
  const { data: permissions } = useQuery({
    queryKey: ['roleBasedWorkNotePermissions', equipmentId],
    queryFn: () => getRoleBasedWorkNotePermissions(equipmentId)
  });

  // Fetch work notes for this equipment (will include work order notes)
  const { data: workNotes = [], isLoading } = useQuery({
    queryKey: ['workNotes', equipmentId],
    queryFn: () => getWorkNotes(equipmentId)
  });

  // Filter notes to show only those related to this work order
  const workOrderNotes = workNotes.filter(note => note.work_order_id === workOrderId);

  const createNoteMutation = useMutation({
    mutationFn: (data: { equipment_id: string; note: string; is_public: boolean; hours_worked: number | null; work_order_id: string }) =>
      createWorkNote(data.equipment_id, data.note, data.hours_worked, data.is_public, data.work_order_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workNotes', equipmentId] });
      toast.success('Work note added successfully');
      setShowAddForm(false);
    },
    onError: (error: any) => {
      toast.error('Failed to add work note: ' + error.message);
    }
  });

  const handleAddNote = (note: string, isPublic: boolean, hoursWorked: string) => {
    const hours = hoursWorked ? parseFloat(hoursWorked) : null;
    
    if (hoursWorked && isNaN(parseFloat(hoursWorked))) {
      toast.error('Hours worked must be a valid number');
      return;
    }

    createNoteMutation.mutate({
      equipment_id: equipmentId,
      note: note.trim(),
      is_public: isPublic,
      hours_worked: hours,
      work_order_id: workOrderId
    });
  };

  // Filter notes based on user permissions
  const visibleNotes = permissions?.canViewPrivate 
    ? workOrderNotes 
    : workOrderNotes.filter(note => note.is_public);

  if (!permissions?.canCreate && userRole !== 'viewer') {
    return (
      <div className="text-center text-muted-foreground py-8">
        You don't have permission to view work notes for this work order.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Role Indicator and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="text-lg font-medium">
              Work Order Notes ({visibleNotes.length})
            </h3>
          </div>
          
          {/* Role indicator */}
          {userRole !== 'none' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span className="capitalize">{userRole}</span>
            </div>
          )}
        </div>
        
        {permissions?.canCreate && (
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            variant={showAddForm ? "outline" : "default"}
            size="sm"
            className="w-full sm:w-auto"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {showAddForm ? 'Cancel' : 'Add Note'}
          </Button>
        )}
      </div>

      {/* Role-specific alerts */}
      {userRole === 'requestor' && (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <AlertTitle>Requestor Access</AlertTitle>
          <AlertDescription>
            As a requestor, your notes will be visible to all team members working on this work order. You cannot enter hours worked or create private notes.
          </AlertDescription>
        </Alert>
      )}

      {userRole === 'viewer' && (
        <Alert variant="default" className="bg-gray-50 border-gray-200">
          <AlertTitle>Viewer Access</AlertTitle>
          <AlertDescription>
            You have read-only access to work notes. You can view public notes but cannot create, edit, or delete notes.
          </AlertDescription>
        </Alert>
      )}

      {/* Add Note Form - Role-aware */}
      {permissions?.canCreate && showAddForm && (
        <Card>
          <CardContent className="pt-6">
            <RoleAwareAddNoteForm 
              onAddNote={handleAddNote}
              isPending={createNoteMutation.isPending}
              userRole={userRole}
            />
          </CardContent>
        </Card>
      )}

      {/* Notes List - Role-aware */}
      <div>
        {visibleNotes.length > 0 ? (
          <RoleAwareNotesList
            notes={visibleNotes}
            isLoading={isLoading}
            userRole={userRole}
            canEdit={permissions?.canEdit || false}
            canDelete={permissions?.canDelete || false}
            canViewPrivate={permissions?.canViewPrivate || false}
            onEditNote={() => {}} // TODO: Implement edit functionality for work order notes
            onDeleteNote={() => {}} // TODO: Implement delete functionality for work order notes
            isNoteEditable={() => false} // Work order notes are typically not editable
          />
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No work notes for this work order yet</p>
                {permissions?.canCreate && !showAddForm && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setShowAddForm(true)}
                  >
                    Add the first note
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
