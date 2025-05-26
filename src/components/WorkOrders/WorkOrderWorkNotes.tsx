
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Eye, EyeOff } from 'lucide-react';
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
      <div className="text-center text-muted-foreground py-4">
        You don't have permission to view work notes for this equipment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canCreate && (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a work note for this work order..."
              className="resize-none"
              required
            />
            
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours-worked">Hours worked (optional)</Label>
                <Input
                  id="hours-worked"
                  type="number"
                  step="0.25"
                  min="0"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  placeholder="Hours"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="note-visibility">Visibility</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="note-visibility"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                  <Label htmlFor="note-visibility">
                    {isPublic ? (
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        Public
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <EyeOff className="h-4 w-4 mr-1" />
                        Private
                      </span>
                    )}
                  </Label>
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={createNoteMutation.isPending || !newNote.trim()}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                {createNoteMutation.isPending ? 'Adding...' : 'Add Work Note'}
              </Button>
            </div>
          </form>
          
          <Separator />
        </>
      )}

      <div>
        <h4 className="font-medium mb-3">
          Work Order Notes ({workOrderNotes.length})
        </h4>
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
          <div className="text-center text-muted-foreground py-4">
            No work notes for this work order yet
          </div>
        )}
      </div>
    </div>
  );
}
