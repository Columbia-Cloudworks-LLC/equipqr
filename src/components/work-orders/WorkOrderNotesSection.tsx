
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, User, Lock } from 'lucide-react';
import { useWorkOrderNotes, useCreateWorkOrderNote } from '@/hooks/useWorkOrderData';
import { format } from 'date-fns';

interface WorkOrderNotesSectionProps {
  workOrderId: string;
  canAddNotes?: boolean;
  showPrivateNotes?: boolean;
}

const WorkOrderNotesSection: React.FC<WorkOrderNotesSectionProps> = ({
  workOrderId,
  canAddNotes = true,
  showPrivateNotes = true
}) => {
  const [newNote, setNewNote] = useState('');
  const [hoursWorked, setHoursWorked] = useState<number>(0);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: allNotes = [], isLoading, error } = useWorkOrderNotes(workOrderId);
  const createNoteMutation = useCreateWorkOrderNote();

  console.log('WorkOrderNotesSection debug:', {
    workOrderId,
    notesCount: allNotes.length,
    isLoading,
    error,
    canAddNotes,
    showPrivateNotes
  });

  // Filter notes based on showPrivateNotes permission
  const notes = showPrivateNotes ? allNotes : allNotes.filter(note => !note.is_private);

  const handleSubmitNote = async () => {
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    try {
      await createNoteMutation.mutateAsync({
        workOrderId,
        content: newNote.trim(),
        hoursWorked,
        isPrivate
      });
      
      setNewNote('');
      setHoursWorked(0);
      setIsPrivate(false);
    } catch (error) {
      console.error('Error submitting note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error('Error loading work order notes:', error);
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading notes. Please try refreshing the page.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Notes & Updates
          <Badge variant="outline">{notes.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note Form */}
        {canAddNotes && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <Textarea
              placeholder="Add a note or update..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Hours"
                  value={hoursWorked || ''}
                  onChange={(e) => setHoursWorked(parseFloat(e.target.value) || 0)}
                  className="w-20"
                  min="0"
                  step="0.5"
                />
                <span className="text-sm text-muted-foreground">hours worked</span>
              </div>
              
              {showPrivateNotes && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Private note</span>
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleSubmitNote}
              disabled={!newNote.trim() || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Adding Note...' : 'Add Note'}
            </Button>
          </div>
        )}

        {/* Notes List */}
        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notes yet. Add the first update!</p>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{note.author_name || 'Unknown User'}</span>
                    {note.is_private && showPrivateNotes && (
                      <Badge variant="secondary" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
                
                <p className="text-sm leading-relaxed pl-6">{note.content}</p>
                
                {note.hours_worked > 0 && (
                  <div className="flex items-center gap-2 pl-6">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {note.hours_worked} hour{note.hours_worked !== 1 ? 's' : ''} logged
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkOrderNotesSection;
