import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, MessageSquare, Lock, Clock, Shield } from 'lucide-react';
import { useSyncNotesByEquipment } from '@/services/syncDataService';
import { usePermissions } from '@/hooks/usePermissions';
import { Tables } from '@/integrations/supabase/types';

type Note = Tables<'notes'>;

interface EquipmentNotesTabProps {
  equipmentId: string;
  organizationId: string;
  equipmentTeamId?: string;
}

const EquipmentNotesTab: React.FC<EquipmentNotesTabProps> = ({
  equipmentId,
  organizationId,
  equipmentTeamId,
}) => {
  const { data: notesData = [], isLoading } = useSyncNotesByEquipment(organizationId, equipmentId);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNotePrivate, setNewNotePrivate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const notesPerPage = 5;
  
  const { canViewEquipment, canUpdateEquipmentStatus } = usePermissions();

  // Use the loaded notes data or fallback to local state
  const allNotes = notes.length > 0 ? notes : notesData;

  // Check if user can view this equipment's notes
  const canViewNotes = canViewEquipment(equipmentTeamId);
  const canAddNotes = canUpdateEquipmentStatus(equipmentTeamId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!canViewNotes) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">
          You don't have permission to view notes for this equipment. Contact your team manager for access.
        </p>
      </div>
    );
  }

  // Filter notes based on user role and privacy settings
  const visibleNotes = allNotes.filter(note => {
    // In a real implementation, you'd check if the current user is the author
    // or has permission to view private notes
    return !note.is_private || canAddNotes;
  });

  const totalPages = Math.ceil(visibleNotes.length / notesPerPage);
  const startIndex = (currentPage - 1) * notesPerPage;
  const paginatedNotes = visibleNotes.slice(startIndex, startIndex + notesPerPage);

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      equipment_id: equipmentId,
      content: newNoteContent,
      author_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_private: newNotePrivate,
    };

    setNotes([newNote, ...allNotes]);
    setNewNoteContent('');
    setNewNotePrivate(false);
    setShowAddNote(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Equipment Notes</h3>
          <p className="text-sm text-muted-foreground">
            {visibleNotes.length} {visibleNotes.length === 1 ? 'note' : 'notes'}
            {equipmentTeamId && (
              <span className="ml-2 text-xs">
                • Team-restricted access
              </span>
            )}
          </p>
        </div>
        {canAddNotes && (
          <Button onClick={() => setShowAddNote(!showAddNote)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        )}
      </div>

      {/* Team Access Notice */}
      {equipmentTeamId && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-800">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">
                This equipment is assigned to a team. Only team members and organization admins can view and add notes.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Note Form */}
      {showAddNote && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add New Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your note..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={3}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="private-note"
                  checked={newNotePrivate}
                  onCheckedChange={setNewNotePrivate}
                />
                <label htmlFor="private-note" className="text-sm font-medium">
                  Private note (only visible to team managers and admins)
                </label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddNote(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddNote}>
                  Add Note
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {paginatedNotes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
              <p className="text-muted-foreground mb-4">
                {canAddNotes 
                  ? 'Add the first note to track important information about this equipment.'
                  : 'No notes have been added for this equipment yet.'
                }
              </p>
              {canAddNotes && (
                <Button onClick={() => setShowAddNote(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Note
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          paginatedNotes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">User {note.author_id}</span>
                    {note.is_private && (
                      <Badge variant="secondary" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(note.created_at).toLocaleString()}
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{note.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default EquipmentNotesTab;
