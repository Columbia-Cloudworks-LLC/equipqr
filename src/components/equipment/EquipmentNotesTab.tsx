import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, MessageSquare, Lock, Clock } from 'lucide-react';
import { getNotesByEquipmentId, Note } from '@/services/dataService';

interface EquipmentNotesTabProps {
  equipmentId: string;
  organizationId: string;
}

const EquipmentNotesTab: React.FC<EquipmentNotesTabProps> = ({
  equipmentId,
  organizationId,
}) => {
  const [notes, setNotes] = useState<Note[]>(getNotesByEquipmentId(organizationId, equipmentId));
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNotePrivate, setNewNotePrivate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const notesPerPage = 5;

  // Mock current user role - in real app this would come from auth context
  const currentUserRole = 'manager' as 'owner' | 'manager' | 'technician' | 'requestor' | 'viewer';

  // Filter notes based on user role
  const visibleNotes = notes.filter(note => {
    if (currentUserRole === 'viewer' || currentUserRole === 'requestor') {
      return !note.isPrivate;
    }
    return true;
  });

  const totalPages = Math.ceil(visibleNotes.length / notesPerPage);
  const startIndex = (currentPage - 1) * notesPerPage;
  const paginatedNotes = visibleNotes.slice(startIndex, startIndex + notesPerPage);

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      equipmentId,
      content: newNoteContent,
      authorId: '1',
      authorName: 'Current User',
      createdAt: new Date().toISOString(),
      isPrivate: newNotePrivate,
    };

    setNotes([newNote, ...notes]);
    setNewNoteContent('');
    setNewNotePrivate(false);
    setShowAddNote(false);
  };

  const canAddNotes = ['owner', 'manager', 'technician'].includes(currentUserRole);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Equipment Notes</h3>
          <p className="text-sm text-muted-foreground">
            {visibleNotes.length} {visibleNotes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>
        {canAddNotes && (
          <Button onClick={() => setShowAddNote(!showAddNote)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        )}
      </div>

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
                  Private note (only visible to managers and technicians)
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
                    <span className="font-medium">{note.authorName}</span>
                    {note.isPrivate && (
                      <Badge variant="secondary" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(note.createdAt).toLocaleString()}
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
