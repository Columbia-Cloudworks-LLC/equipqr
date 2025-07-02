
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, MessageSquare, Images, Clock, User, Eye, EyeOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  createEquipmentNoteWithImages, 
  getEquipmentNotesWithImages, 
  getEquipmentImages,
  deleteEquipmentNoteImage,
  updateEquipmentDisplayImage
} from '@/services/equipmentNotesService';
import ImageUploadWithNote from '@/components/common/ImageUploadWithNote';
import ImageGallery from '@/components/common/ImageGallery';

interface EnhancedEquipmentNotesTabProps {
  equipmentId: string;
  organizationId: string;
  equipmentTeamId?: string;
}

const EnhancedEquipmentNotesTab: React.FC<EnhancedEquipmentNotesTabProps> = ({
  equipmentId,
  organizationId,
  equipmentTeamId
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    hoursWorked: 0,
    isPrivate: false
  });

  // Fetch notes with images
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['equipment-notes-with-images', equipmentId],
    queryFn: () => getEquipmentNotesWithImages(equipmentId),
    enabled: !!equipmentId
  });

  // Fetch images for gallery
  const { data: images = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['equipment-images', equipmentId],
    queryFn: () => getEquipmentImages(equipmentId),
    enabled: !!equipmentId
  });

  // Get current display image from equipment
  const { data: equipment } = useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('image_url')
        .eq('id', equipmentId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!equipmentId
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: ({ content, hoursWorked, isPrivate, images }: {
      content: string;
      hoursWorked: number;
      isPrivate: boolean;
      images: File[];
    }) => createEquipmentNoteWithImages(equipmentId, content, hoursWorked, isPrivate, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-notes-with-images', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['equipment-images', equipmentId] });
      setShowForm(false);
      setFormData({ content: '', hoursWorked: 0, isPrivate: false });
      toast.success('Note created successfully');
    },
    onError: (error) => {
      console.error('Failed to create note:', error);
      toast.error('Failed to create note');
    }
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: deleteEquipmentNoteImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-notes-with-images', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['equipment-images', equipmentId] });
    }
  });

  // Set display image mutation
  const setDisplayImageMutation = useMutation({
    mutationFn: (imageUrl: string) => updateEquipmentDisplayImage(equipmentId, imageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['equipment-list'] });
    }
  });

  const handleCreateNoteWithImages = async (files: File[], noteText: string) => {
    await createNoteMutation.mutateAsync({
      content: noteText,
      hoursWorked: formData.hoursWorked,
      isPrivate: formData.isPrivate,
      images: files
    });
  };

  const handleCreateNoteOnly = () => {
    if (!formData.content.trim()) {
      toast.error('Please enter note content');
      return;
    }
    
    createNoteMutation.mutate({
      content: formData.content,
      hoursWorked: formData.hoursWorked,
      isPrivate: formData.isPrivate,
      images: []
    });
  };

  const canDeleteImage = (image: any) => {
    return image.uploaded_by === user?.id;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatHours = (hours: number) => {
    return hours > 0 ? `${hours}h` : '';
  };

  if (notesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Notes ({notes.length})
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Images className="h-4 w-4" />
            Images ({images.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-4">
          {/* Add Note Form - Always show if no notes exist */}
          {(notes.length === 0 || showForm) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{notes.length === 0 ? 'Add Your First Note' : 'Add Note'}</span>
                  {notes.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content">Note Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Enter your note..."
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  
                  {/* Image Upload Area */}
                  <div className="space-y-2">
                    <Label>Images (Optional)</Label>
                    <ImageUploadWithNote
                      onUpload={handleCreateNoteWithImages}
                      placeholder="Describe these images..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hours">Hours Worked</Label>
                      <Input
                        id="hours"
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.hoursWorked}
                        onChange={(e) => setFormData(prev => ({ ...prev, hoursWorked: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Switch
                          checked={formData.isPrivate}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrivate: checked }))}
                        />
                        Private Note
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Only you can see private notes
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleCreateNoteOnly}
                    disabled={createNoteMutation.isPending || !formData.content.trim()}
                    className="w-full"
                  >
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Note Button - Only show if notes exist and form is not shown */}
          {notes.length > 0 && !showForm && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Note Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{note.author_name}</span>
                        <span>•</span>
                        <span>{formatDate(note.created_at)}</span>
                        {formatHours(note.hours_worked) && (
                          <>
                            <span>•</span>
                            <Clock className="h-4 w-4" />
                            <span>{formatHours(note.hours_worked)}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {note.is_private && (
                          <Badge variant="outline" className="text-xs">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Private
                          </Badge>
                        )}
                        {note.images && note.images.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Images className="h-3 w-3 mr-1" />
                            {note.images.length} image{note.images.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Note Content */}
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{note.content}</p>
                    </div>

                    {/* Note Images */}
                    {note.images && note.images.length > 0 && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {note.images.map((image) => (
                            <div key={image.id} className="aspect-square bg-muted rounded overflow-hidden">
                              <img
                                src={image.file_url}
                                alt={image.file_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="images">
          <ImageGallery
            images={images.filter(img => !img.is_private_note || img.uploaded_by === user?.id)}
            onDelete={deleteImageMutation.mutateAsync}
            onSetDisplayImage={setDisplayImageMutation.mutateAsync}
            canDelete={canDeleteImage}
            canSetDisplayImage={true}
            currentDisplayImage={equipment?.image_url}
            title="Equipment Images"
            emptyMessage="No images uploaded yet. Add a note with images to get started."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedEquipmentNotesTab;
