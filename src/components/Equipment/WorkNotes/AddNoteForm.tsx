
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Eye, EyeOff } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

export interface AddNoteFormProps {
  onAddNote: (note: string, isPublic: boolean, hoursWorked: string, imageUrls?: string[]) => void;
  isPending?: boolean;
}

export function AddNoteForm({ isPending = false, onAddNote }: AddNoteFormProps) {
  const [newNote, setNewNote] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [hoursWorked, setHoursWorked] = useState<string>('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(newNote, isPublic, hoursWorked, imageUrls);
    setNewNote('');
    setIsPublic(false);
    setHoursWorked('');
    setImageUrls([]);
  };

  const handleImagesUploaded = (urls: string[]) => {
    setImageUrls(prev => [...prev, ...urls]);
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
      
      <ImageUpload 
        onImagesUploaded={handleImagesUploaded}
        isUploading={isPending}
      />

      {imageUrls.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Attached Images ({imageUrls.length}):</Label>
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Attachment ${index + 1}`}
                  className="h-16 w-16 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== index))}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
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
