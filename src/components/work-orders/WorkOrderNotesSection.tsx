
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
import { Plus, MessageSquare, Images, Clock, User, EyeOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { 
  createWorkOrderNoteWithImages, 
  getWorkOrderNotesWithImages,
  deleteWorkOrderImage
} from '@/services/workOrderNotesService';
import ImageUploadWithNote from '@/components/common/ImageUploadWithNote';

interface WorkOrderNotesSectionProps {
  workOrderId: string;
  canAddNotes: boolean;
  showPrivateNotes: boolean;
}

const WorkOrderNotesSection: React.FC<WorkOrderNotesSectionProps> = ({
  workOrderId,
  canAddNotes,
  showPrivateNotes
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
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['work-order-notes-with-images', workOrderId],
    queryFn: () => getWorkOrderNotesWithImages(workOrderId),
    enabled: !!workOrderId
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: ({ content, hoursWorked, isPrivate, images }: {
      content: string;
      hoursWorked: number;
      isPrivate: boolean;
      images: File[];
    }) => createWorkOrderNoteWithImages(workOrderId, content, hoursWorked, isPrivate, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-notes-with-images', workOrderId] });
      queryClient.invalidateQueries({ queryKey: ['work-order-images', workOrderId] });
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
    mutationFn: deleteWorkOrderImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-notes-with-images', workOrderId] });
      queryClient.invalidateQueries({ queryKey: ['work-order-images', workOrderId] });
    }
  });

  const handleCreateNote = (content: string, images: File[]) => {
    return createNoteMutation.mutateAsync({
      content,
      hoursWorked: formData.hoursWorked,
      isPrivate: formData.isPrivate,
      images
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

  // Filter notes based on privacy settings
  const visibleNotes = notes.filter(note => {
    if (!note.is_private) return true;
    if (!showPrivateNotes) return false;
    return note.author_id === user?.id;
  });

  if (isLoading) {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes & Updates
          </span>
          {canAddNotes && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? 'Cancel' : 'Add Note'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Add Note Form */}
        {canAddNotes && showForm && (
          <Card>
            <CardContent className="p-4">
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">Text Note</TabsTrigger>
                  <TabsTrigger value="images">Note with Images</TabsTrigger>
                </TabsList>
                
                <TabsContent value="text" className="space-y-4 mt-4">
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
                    
                    {showPrivateNotes && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Switch
                            checked={formData.isPrivate}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrivate: checked }))}
                          />
                          Private Note
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Only managers can see private notes
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleCreateNoteOnly}
                    disabled={createNoteMutation.isPending}
                    className="w-full"
                  >
                    Add Note
                  </Button>
                </TabsContent>
                
                <TabsContent value="images" className="mt-4">
                  <ImageUploadWithNote
                    onUpload={handleCreateNote}
                    placeholder="Add a note to describe these images..."
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Notes List */}
        <div className="space-y-4">
          {visibleNotes.map((note) => (
            <Card key={note.id} className="border-l-4 border-l-primary/20">
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
                          <div key={image.id} className="aspect-square bg-muted rounded overflow-hidden group relative">
                            <img
                              src={image.file_url}
                              alt={image.file_name}
                              className="w-full h-full object-cover"
                            />
                            {canDeleteImage(image) && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteImageMutation.mutate(image.id)}
                              >
                                ×
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {visibleNotes.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
              <p className="text-muted-foreground mb-4">
                {canAddNotes 
                  ? 'Start by adding your first note or update about this work order.'
                  : 'Notes and updates will appear here as work progresses.'
                }
              </p>
              {canAddNotes && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Note
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkOrderNotesSection;
