
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Eye, EyeOff, Edit2, Trash2, Clock, User } from 'lucide-react';
import { WorkNote } from '@/services/workNotes/types';
import { EquipmentUserRole } from '@/services/equipment/equipmentRoleService';

interface RoleAwareNotesListProps {
  notes: WorkNote[];
  isLoading: boolean;
  userRole: EquipmentUserRole;
  canEdit: boolean;
  canDelete: boolean;
  canViewPrivate: boolean;
  onEditNote: (note: WorkNote) => void;
  onDeleteNote: (id: string) => void;
  isNoteEditable: (note: WorkNote) => boolean;
}

export function RoleAwareNotesList({
  notes,
  isLoading,
  userRole,
  canEdit,
  canDelete,
  canViewPrivate,
  onEditNote,
  onDeleteNote,
  isNoteEditable
}: RoleAwareNotesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <p>No work notes yet</p>
            {userRole === 'viewer' && (
              <p className="text-sm mt-1">
                You have view-only access to this equipment
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Card key={note.id}>
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header with visibility and actions */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Visibility indicator */}
                  <Badge 
                    variant={note.is_public ? "default" : "secondary"}
                    className="flex items-center gap-1"
                  >
                    {note.is_public ? (
                      <>
                        <Eye className="h-3 w-3" />
                        Public
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" />
                        Private
                      </>
                    )}
                  </Badge>

                  {/* Hours worked indicator */}
                  {note.hours_worked && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {note.hours_worked}h
                    </Badge>
                  )}

                  {/* Role-based indicators */}
                  {userRole === 'requestor' && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      Requestor View
                    </Badge>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {canEdit && isNoteEditable(note) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditNote(note)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {canDelete && isNoteEditable(note) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteNote(note.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Note content */}
              <div className="prose prose-sm max-w-none">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {note.note}
                </p>
              </div>

              {/* Footer with author and timestamp */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{note.creator?.display_name || 'Unknown User'}</span>
                  {note.edited_at && (
                    <span className="ml-2">(edited)</span>
                  )}
                </div>
                
                <time dateTime={note.created_at}>
                  {format(new Date(note.created_at!), 'MMM d, yyyy \'at\' h:mm a')}
                </time>
              </div>

              {/* Role-specific help text */}
              {userRole === 'viewer' && !note.is_public && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                  <p className="text-xs text-yellow-800">
                    This note is private and only visible to technicians and managers.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
