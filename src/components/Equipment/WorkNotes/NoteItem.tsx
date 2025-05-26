
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  Trash2, 
  Clock, 
  Eye, 
  EyeOff, 
  Building2,
  ImageIcon
} from 'lucide-react';
import { formatDistance } from 'date-fns';
import { WorkNote } from '@/services/workNotes';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface NoteItemProps {
  note: WorkNote;
  canEdit: boolean;
  setEditingNote: (note: WorkNote) => void;
  onDeleteNote: (id: string) => void;
  isNoteEditable: (note: WorkNote) => boolean;
}

export function NoteItem({ 
  note, 
  canEdit, 
  setEditingNote, 
  onDeleteNote,
  isNoteEditable
}: NoteItemProps) {
  const isEditable = isNoteEditable(note);
  const hasImages = note.image_urls && note.image_urls.length > 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {note.creator_name || 'Unknown User'}
              </span>
              {note.is_external_org && (
                <Badge variant="outline" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  External
                </Badge>
              )}
              <Badge variant={note.is_public ? 'default' : 'secondary'} className="text-xs">
                {note.is_public ? (
                  <><Eye className="h-3 w-3 mr-1" />Public</>
                ) : (
                  <><EyeOff className="h-3 w-3 mr-1" />Private</>
                )}
              </Badge>
              {hasImages && (
                <Badge variant="outline" className="text-xs">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  {note.image_urls!.length} image{note.image_urls!.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{formatDistance(new Date(note.created_at), new Date(), { addSuffix: true })}</span>
              {note.hours_worked && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{note.hours_worked}h</span>
                </div>
              )}
              {note.organization_name && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  <span>{note.organization_name}</span>
                </div>
              )}
            </div>
          </div>
          
          {canEdit && isEditable && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingNote(note)}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteNote(note.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-sm whitespace-pre-wrap">{note.note}</p>
          
          {hasImages && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {note.image_urls!.map((imageUrl, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <button className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Work note attachment ${index + 1}`}
                          className="h-20 w-20 object-cover rounded border hover:border-primary transition-colors cursor-pointer"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <img
                        src={imageUrl}
                        alt={`Work note attachment ${index + 1}`}
                        className="w-full h-auto max-h-[80vh] object-contain"
                      />
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          )}
          
          {note.edited_at && (
            <p className="text-xs text-muted-foreground">
              Edited {formatDistance(new Date(note.edited_at), new Date(), { addSuffix: true })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
