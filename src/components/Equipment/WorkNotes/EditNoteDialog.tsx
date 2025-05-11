
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
import { Eye, EyeOff } from 'lucide-react';

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
  
  return (
    <AlertDialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Work Note</AlertDialogTitle>
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
