
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Eye, EyeOff } from 'lucide-react';

interface AddNoteFormProps {
  isPending: boolean;
  onSubmit: (note: string, isPublic: boolean, hoursWorked: string) => void;
}

export function AddNoteForm({ isPending, onSubmit }: AddNoteFormProps) {
  const [newNote, setNewNote] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [hoursWorked, setHoursWorked] = useState<string>('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onSubmit(newNote, isPublic, hoursWorked);
    setNewNote('');
    setIsPublic(false);
    setHoursWorked('');
  };
  
  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <Textarea
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        placeholder="Add a work note..."
        className="resize-none"
        required
      />
      
      <div className="flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-wrap gap-4 items-end">
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
              className="w-24"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="note-visibility" className="block">Visibility</Label>
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
        </div>
        
        <Button 
          type="submit" 
          className="ml-auto"
          disabled={isPending || !newNote.trim()}
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          {isPending ? 'Adding...' : 'Add Note'}
        </Button>
      </div>
    </form>
  );
}
