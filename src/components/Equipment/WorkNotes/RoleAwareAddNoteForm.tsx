
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Eye, EyeOff, Clock, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EquipmentUserRole } from '@/services/equipment/equipmentRoleService';
import { ImageUpload } from './ImageUpload';

export interface RoleAwareAddNoteFormProps {
  onAddNote: (note: string, isPublic: boolean, hoursWorked: string, imageUrls?: string[]) => void;
  isPending?: boolean;
  userRole: EquipmentUserRole;
}

export function RoleAwareAddNoteForm({ 
  isPending = false, 
  onAddNote, 
  userRole 
}: RoleAwareAddNoteFormProps) {
  const [newNote, setNewNote] = useState('');
  const [isPublic, setIsPublic] = useState(userRole === 'requestor' ? true : false);
  const [hoursWorked, setHoursWorked] = useState<string>('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  // Determine permissions based on role
  const canCreateNotes = ['manager', 'technician', 'requestor'].includes(userRole);
  const canCreatePrivateNotes = ['manager', 'technician'].includes(userRole);
  const canEnterHours = ['manager', 'technician'].includes(userRole);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    // Force public for requestors
    const noteIsPublic = userRole === 'requestor' ? true : isPublic;
    
    onAddNote(newNote, noteIsPublic, canEnterHours ? hoursWorked : '', imageUrls);
    setNewNote('');
    setIsPublic(userRole === 'requestor' ? true : false);
    setHoursWorked('');
    setImageUrls([]);
  };

  const handleImagesUploaded = (urls: string[]) => {
    setImageUrls(prev => [...prev, ...urls]);
  };

  if (!canCreateNotes) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to create work notes for this equipment.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Role-specific information */}
      {userRole === 'requestor' && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            As a requestor, your notes will be public and visible to all team members. You cannot enter hours worked.
          </AlertDescription>
        </Alert>
      )}

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
            {/* Hours worked - only for technicians and managers */}
            {canEnterHours && (
              <div className="space-y-2">
                <Label htmlFor="hours-worked" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Hours worked (optional)
                </Label>
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
            )}
            
            {/* Visibility toggle - only for technicians and managers */}
            {canCreatePrivateNotes && (
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
            )}
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
    </div>
  );
}
