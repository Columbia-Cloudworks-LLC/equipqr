
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { getWorkNotes, createWorkNote } from '@/services/workNotes';
import { NotesList } from '@/components/Equipment/WorkNotes/NotesList';
import { useWorkNotesPermissions } from '@/components/Equipment/WorkNotes/hooks/useWorkNotesPermissions';
import { toast } from 'sonner';

interface WorkOrderWorkNotesProps {
  workOrderId: string;
  equipmentId: string;
}

export function WorkOrderWorkNotes({ workOrderId, equipmentId }: WorkOrderWorkNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [hoursWorked, setHoursWorked] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  const { canEdit, canCreate } = useWorkNotesPermissions(equipmentId);

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
      setNewNote('');
      setIsPublic(false);
      setHoursWorked('');
      setShowAddForm(false);
    },
    onError: (error: any) => {
      toast.error('Failed to add work note: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const hours = hoursWorked ? parseFloat(hoursWorked) : null;
    
    if (hoursWorked && isNaN(parseFloat(hoursWorked))) {
      toast.error('Hours worked must be a valid number');
      return;
    }

    createNoteMutation.mutate({
      equipment_id: equipmentId,
      note: newNote.trim(),
      is_public: isPublic,
      hours_worked: hours,
      work_order_id: workOrderId
    });
  };

  if (!canCreate && !canEdit) {
    return (
      <div className="text-center text-muted-foreground py-8">
        You don't have permission to view work notes for this equipment.
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
            Work Order Notes ({workOrderNotes.length})
          </h3>
        </div>
        
        {canCreate && (
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

      {/* Add Note Form */}
      {canCreate && showAddForm && (
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours-worked">Hours worked (optional)</Label>
                  <Input
                    id="hours-worked"
                    type="number"
                    step="0.25"
                    min="0"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="note-visibility">Visibility</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="note-visibility"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <Label htmlFor="note-visibility" className="flex items-center gap-1">
                      {isPublic ? (
                        <>
                          <Eye className="h-4 w-4" />
                          Public
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Private
                        </>
                      )}
                    </Label>
                  </div>
                </div>
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
        {workOrderNotes.length > 0 ? (
          <NotesList
            notes={workOrderNotes}
            isLoading={isLoading}
            canManage={canEdit || false}
            onEditNote={() => {}} // TODO: Implement edit functionality
            onDeleteNote={() => {}} // TODO: Implement delete functionality
            isNoteEditable={() => false} // TODO: Implement edit check
          />
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No work notes for this work order yet</p>
                {canCreate && !showAddForm && (
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
