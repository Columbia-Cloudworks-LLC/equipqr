
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, MessageSquare } from 'lucide-react';
import { getWorkNotes, createWorkNote } from '@/services/workNotes';
import { NotesList } from '@/components/Equipment/WorkNotes/NotesList';
import { getUserRoleForWorkOrder, WorkOrderUserRole } from '@/services/workOrders/workOrderRoleService';
import { toast } from 'sonner';

interface RoleAwareWorkNotesProps {
  workOrderId: string;
  equipmentId: string;
}

export function RoleAwareWorkNotes({ workOrderId, equipmentId }: RoleAwareWorkNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  // Get user role for this work order
  const { data: userRole = 'none' } = useQuery({
    queryKey: ['workOrderUserRole', equipmentId],
    queryFn: () => getUserRoleForWorkOrder(equipmentId)
  });

  // Fetch work notes for this equipment (will include work order notes)
  const { data: workNotes = [], isLoading } = useQuery({
    queryKey: ['workNotes', equipmentId],
    queryFn: () => getWorkNotes(equipmentId)
  });

  // Filter notes to show only those related to this work order
  const workOrderNotes = workNotes.filter(note => note.work_order_id === workOrderId);

  const createNoteMutation = useMutation({
    mutationFn: (data: { equipment_id: string; note: string; is_public: boolean; work_order_id: string }) =>
      createWorkNote(data.equipment_id, data.note, null, data.is_public, data.work_order_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workNotes', equipmentId] });
      toast.success('Work note added successfully');
      setNewNote('');
      setShowAddForm(false);
    },
    onError: (error: any) => {
      toast.error('Failed to add work note: ' + error.message);
    }
  });

  const canCreateNotes = ['manager', 'technician', 'requestor'].includes(userRole);
  const canViewPrivateNotes = ['manager', 'technician'].includes(userRole);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    // Requestors can only create public notes
    const isPublic = userRole === 'requestor' ? true : true; // For work orders, we'll default to public

    createNoteMutation.mutate({
      equipment_id: equipmentId,
      note: newNote.trim(),
      is_public: isPublic,
      work_order_id: workOrderId
    });
  };

  // Filter notes based on user role
  const visibleNotes = canViewPrivateNotes 
    ? workOrderNotes 
    : workOrderNotes.filter(note => note.is_public);

  if (!canCreateNotes && userRole !== 'viewer') {
    return (
      <div className="text-center text-muted-foreground py-8">
        You don't have permission to view work notes for this work order.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-lg font-medium">
            Work Order Notes ({visibleNotes.length})
          </h3>
        </div>
        
        {canCreateNotes && (
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

      {/* Role-specific messaging */}
      {userRole === 'requestor' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            As a requestor, your notes will be visible to all team members working on this work order.
          </p>
        </div>
      )}

      {/* Add Note Form */}
      {canCreateNotes && showAddForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note-content">Note Content</Label>
                <Textarea
                  id="note-content"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a work note for this work order..."
                  className="resize-none min-h-[100px]"
                  required
                />
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createNoteMutation.isPending || !newNote.trim()}
                  className="w-full sm:w-auto"
                >
                  {createNoteMutation.isPending ? 'Adding...' : 'Add Work Note'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <div>
        {visibleNotes.length > 0 ? (
          <NotesList
            notes={visibleNotes}
            isLoading={isLoading}
            canManage={false} // Disable editing for work order notes
            onEditNote={() => {}} 
            onDeleteNote={() => {}} 
            isNoteEditable={() => false} 
          />
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No work notes for this work order yet</p>
                {canCreateNotes && !showAddForm && (
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
