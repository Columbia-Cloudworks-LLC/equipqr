
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, 
  MessageSquare, 
  Lock, 
  Clock, 
  Shield, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  Upload,
  Eye,
  Download,
  Star
} from 'lucide-react';
import { useEquipmentNotes, useCreateEquipmentNote, useUpdateEquipmentNote, useDeleteEquipmentNote, useDeleteEquipmentNoteImage, useSetEquipmentDisplayImage } from '@/hooks/useEquipmentNotes';
import { useEquipmentNotesPermissions } from '@/hooks/useEquipmentNotesPermissions';
import { EquipmentNote } from '@/services/equipmentNotesService';
import EquipmentNoteImageUpload from './EquipmentNoteImageUpload';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface EnhancedEquipmentNotesTabProps {
  equipmentId: string;
  organizationId: string;
  equipmentTeamId?: string;
}

const EnhancedEquipmentNotesTab: React.FC<EnhancedEquipmentNotesTabProps> = ({
  equipmentId,
  organizationId,
  equipmentTeamId,
}) => {
  const { data: notes = [], isLoading } = useEquipmentNotes(equipmentId, organizationId);
  const permissions = useEquipmentNotesPermissions(equipmentTeamId);
  const createNoteMutation = useCreateEquipmentNote();
  const updateNoteMutation = useUpdateEquipmentNote();
  const deleteNoteMutation = useDeleteEquipmentNote();
  const deleteImageMutation = useDeleteEquipmentNoteImage();
  const setDisplayImageMutation = useSetEquipmentDisplayImage();

  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNote, setEditingNote] = useState<EquipmentNote | null>(null);
  const [showImageUpload, setShowImageUpload] = useState<string | null>(null);
  const [imageGallery, setImageGallery] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const notesPerPage = 5;

  // Form state
  const [noteContent, setNoteContent] = useState('');
  const [notePrivate, setNotePrivate] = useState(false);
  const [hoursWorked, setHoursWorked] = useState<number>(0);

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

  if (!permissions.canViewNotes) {
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

  // Filter notes based on visibility permissions
  const visibleNotes = notes.filter(note => {
    if (!note.is_private) return true; // Public notes are always visible
    // Private notes require special permissions
    return permissions.canAddPrivateNote || permissions.canEditOwnNote(note);
  });

  const totalPages = Math.ceil(visibleNotes.length / notesPerPage);
  const startIndex = (currentPage - 1) * notesPerPage;
  const paginatedNotes = visibleNotes.slice(startIndex, startIndex + notesPerPage);

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;

    try {
      await createNoteMutation.mutateAsync({
        equipmentId,
        content: noteContent,
        isPrivate: notePrivate,
        hoursWorked: hoursWorked || undefined
      });
      
      setNoteContent('');
      setNotePrivate(false);
      setHoursWorked(0);
      setShowAddNote(false);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleEditNote = async () => {
    if (!editingNote || !noteContent.trim()) return;

    try {
      await updateNoteMutation.mutateAsync({
        noteId: editingNote.id,
        updateData: {
          content: noteContent,
          isPrivate: notePrivate,
          hoursWorked: hoursWorked || undefined
        }
      });
      
      setEditingNote(null);
      setNoteContent('');
      setNotePrivate(false);
      setHoursWorked(0);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteNoteMutation.mutateAsync(noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await deleteImageMutation.mutateAsync(imageId);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleSetDisplayImage = async (imageUrl: string) => {
    try {
      await setDisplayImageMutation.mutateAsync({
        equipmentId,
        imageUrl
      });
    } catch (error) {
      console.error('Error setting display image:', error);
    }
  };

  const openEditNote = (note: EquipmentNote) => {
    setEditingNote(note);
    setNoteContent(note.content);
    setNotePrivate(note.is_private);
    setHoursWorked(note.hours_worked || 0);
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setNoteContent('');
    setNotePrivate(false);
    setHoursWorked(0);
  };

  const canEditNote = (note: EquipmentNote) => {
    return permissions.canEditAnyNote || permissions.canEditOwnNote(note);
  };

  const canDeleteNote = (note: EquipmentNote) => {
    return permissions.canDeleteAnyNote || permissions.canDeleteOwnNote(note);
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
        {(permissions.canAddPublicNote || permissions.canAddPrivateNote) && (
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
                This equipment is assigned to a team. Access to notes is restricted based on your team membership and role.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Note Form */}
      {(showAddNote || editingNote) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingNote ? 'Edit Note' : 'Add New Note'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="note-content">Note Content</Label>
              <Textarea
                id="note-content"
                placeholder="Enter your note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hours-worked">Hours Worked (Optional)</Label>
                <Input
                  id="hours-worked"
                  type="number"
                  min="0"
                  step="0.5"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              
              {permissions.canAddPrivateNote && (
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="private-note"
                    checked={notePrivate}
                    onCheckedChange={setNotePrivate}
                  />
                  <label htmlFor="private-note" className="text-sm font-medium">
                    Private note (only visible to team managers and admins)
                  </label>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={editingNote ? cancelEdit : () => setShowAddNote(false)}
              >
                Cancel
              </Button>
              <Button onClick={editingNote ? handleEditNote : handleAddNote}>
                {editingNote ? 'Update Note' : 'Add Note'}
              </Button>
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
                {permissions.canAddPublicNote || permissions.canAddPrivateNote
                  ? 'Add the first note to track important information about this equipment.'
                  : 'No notes have been added for this equipment yet.'
                }
              </p>
              {(permissions.canAddPublicNote || permissions.canAddPrivateNote) && (
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
                    {note.is_private && (
                      <Badge variant="secondary" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    )}
                    {note.hours_worked && note.hours_worked > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {note.hours_worked}h
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {canEditNote(note) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditNote(note)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteNote(note) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {permissions.canUploadImages && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowImageUpload(note.id)}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <p className="text-sm leading-relaxed mb-3">{note.content}</p>
                
                {/* Images */}
                {note.images && note.images.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Images ({note.images.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {note.images.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.file_url}
                            alt={image.description || image.file_name}
                            className="w-full h-20 object-cover rounded cursor-pointer"
                            onClick={() => setImageGallery(image.file_url)}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:text-white hover:bg-white/20"
                              onClick={() => setImageGallery(image.file_url)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {permissions.canSetDisplayImage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:text-white hover:bg-white/20"
                                onClick={() => handleSetDisplayImage(image.file_url)}
                                title="Set as display image"
                              >
                                <Star className="h-3 w-3" />
                              </Button>
                            )}
                            {permissions.canDeleteImages && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:text-white hover:bg-white/20"
                                onClick={() => handleDeleteImage(image.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created: {format(new Date(note.created_at), 'PPp')}
                  </div>
                  {note.last_modified_at && note.last_modified_at !== note.created_at && (
                    <div className="flex items-center gap-1">
                      <Edit className="h-3 w-3" />
                      Modified: {format(new Date(note.last_modified_at), 'PPp')}
                      {note.lastModifiedByName && ` by ${note.lastModifiedByName}`}
                    </div>
                  )}
                </div>
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

      {/* Image Upload Dialog */}
      {showImageUpload && (
        <EquipmentNoteImageUpload
          open={!!showImageUpload}
          onClose={() => setShowImageUpload(null)}
          noteId={showImageUpload}
        />
      )}

      {/* Image Gallery Dialog */}
      {imageGallery && (
        <Dialog open={!!imageGallery} onOpenChange={() => setImageGallery(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Image Viewer</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={imageGallery}
                alt="Full size"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EnhancedEquipmentNotesTab;
