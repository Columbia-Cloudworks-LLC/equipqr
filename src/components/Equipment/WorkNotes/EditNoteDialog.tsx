
import React from 'react';
import { WorkNote } from '@/services/workNotes';
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface EditNoteDialogProps {
  editingNote: WorkNote | null;
  setEditingNote: (note: WorkNote | null) => void;
  onUpdateNote: (e: React.FormEvent) => void;
  handleHoursWorkedChange: (value: string) => void;
}

export function EditNoteDialog({ 
  editingNote, 
  setEditingNote, 
  onUpdateNote,
  handleHoursWorkedChange
}: EditNoteDialogProps) {
  if (!editingNote) return null;
  
  // Calculate time remaining in the 24-hour window
  let timeRemaining = '';
  if (editingNote.created_at) {
    const createdAt = new Date(editingNote.created_at);
    const expiresAt = new Date(createdAt.getTime() + (24 * 60 * 60 * 1000));
    const now = new Date();
    
    if (expiresAt > now) {
      const hoursLeft = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
      const minutesLeft = Math.floor(((expiresAt.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
      timeRemaining = `${hoursLeft}h ${minutesLeft}m remaining`;
    }
  }
  
  return (
    <AlertDialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Work Note</AlertDialogTitle>
          {timeRemaining && (
            <div className="flex items-center text-xs text-amber-600 mt-1">
              <Clock className="h-3 w-3 mr-1" />
              {timeRemaining}
            </div>
          )}
        </AlertDialogHeader>
        
        <form onSubmit={onUpdateNote} className="space-y-4">
          <Textarea
            value={editingNote.note}
            onChange={(e) => setEditingNote({...editingNote, note: e.target.value})}
            placeholder="Enter note..."
            className="min-h-[100px]"
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-hours">Hours worked (optional)</Label>
              <Input
                id="edit-hours"
                type="number"
                step="0.25"
                min="0"
                value={editingNote.hours_worked || ''}
                onChange={(e) => handleHoursWorkedChange(e.target.value)}
                placeholder="Hours"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-visibility" className="block mb-2">Visibility</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-visibility"
                  checked={editingNote.is_public}
                  onCheckedChange={(checked) => setEditingNote({...editingNote, is_public: checked})}
                />
                <Label htmlFor="edit-visibility">
                  {editingNote.is_public ? (
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
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit">Update</AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
