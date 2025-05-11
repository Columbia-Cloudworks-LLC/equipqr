
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  PlusCircle, 
  Clock, 
  User, 
  Eye, 
  EyeOff, 
  Trash, 
  Edit, 
  Check, 
  X 
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { WorkNote, getWorkNotes, createWorkNote, updateWorkNote, deleteWorkNote, canManageWorkNotes, canCreateWorkNotes } from '@/services/workNotesService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface WorkNotesProps {
  equipmentId: string;
}

export function WorkNotes({ equipmentId }: WorkNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [hoursWorked, setHoursWorked] = useState<string>('');
  const [editingNote, setEditingNote] = useState<WorkNote | null>(null);
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({});
  const [canEdit, setCanEdit] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const queryClient = useQueryClient();

  // Fetch work notes
  const { data: workNotes = [], isLoading } = useQuery({
    queryKey: ['workNotes', equipmentId],
    queryFn: () => getWorkNotes(equipmentId),
  });

  // Check user permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const [managePermission, createPermission] = await Promise.all([
          canManageWorkNotes(equipmentId),
          canCreateWorkNotes(equipmentId)
        ]);
        setCanEdit(managePermission);
        setCanCreate(createPermission);
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };
    
    if (equipmentId) {
      checkPermissions();
    }
  }, [equipmentId]);

  // Create work note mutation
  const createMutation = useMutation({
    mutationFn: createWorkNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workNotes', equipmentId] });
      setNewNote('');
      setIsPublic(false);
      setHoursWorked('');
      toast.success('Work note added successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to add work note', { description: error.message });
    }
  });

  // Update work note mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<WorkNote> }) => 
      updateWorkNote(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workNotes', equipmentId] });
      setEditingNote(null);
      toast.success('Work note updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update work note', { description: error.message });
    }
  });

  // Delete work note mutation
  const deleteMutation = useMutation({
    mutationFn: deleteWorkNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workNotes', equipmentId] });
      toast.success('Work note deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete work note', { description: error.message });
    }
  });

  // Handle adding a new work note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    const hours = parseFloat(hoursWorked);
    
    createMutation.mutate({
      equipment_id: equipmentId,
      note: newNote.trim(),
      is_public: isPublic,
      hours_worked: isNaN(hours) ? undefined : hours
    });
  };

  // Handle updating a work note
  const handleUpdateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !editingNote.id) return;
    
    // Convert the hours_worked string to a number if it exists
    let hoursValue: number | undefined;
    
    if (editingNote.hours_worked !== undefined && editingNote.hours_worked !== null) {
      if (typeof editingNote.hours_worked === 'string') {
        const parsed = parseFloat(editingNote.hours_worked);
        hoursValue = isNaN(parsed) ? undefined : parsed;
      } else {
        hoursValue = editingNote.hours_worked;
      }
    }
    
    updateMutation.mutate({
      id: editingNote.id,
      updates: {
        note: editingNote.note,
        is_public: editingNote.is_public,
        hours_worked: hoursValue
      }
    });
  };

  // Handle deleting a work note
  const handleDeleteNote = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Toggle note expansion
  const toggleExpand = (id: string) => {
    setIsExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter notes based on public/private tab
  const publicNotes = workNotes.filter(note => note.is_public);
  const allNotes = workNotes;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Work Notes</CardTitle>
      </CardHeader>
      
      <Tabs defaultValue={canEdit ? "all" : "public"}>
        <TabsList className="ml-6">
          <TabsTrigger value="public" className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            Public Notes
          </TabsTrigger>
          {canEdit && (
            <TabsTrigger value="all" className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              All Notes
            </TabsTrigger>
          )}
        </TabsList>
        
        <CardContent>
          {/* Public Notes Tab */}
          <TabsContent value="public" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : publicNotes.length > 0 ? (
              publicNotes.map(note => (
                <div key={note.id} className="border rounded-md p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-green-100 text-green-800">Public</Badge>
                        {note.creator?.display_name && (
                          <span className="text-sm text-muted-foreground">
                            {note.creator.display_name}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {note.created_at && format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      
                      <div className={`text-sm mt-1 ${isExpanded[note.id!] ? '' : 'line-clamp-2'}`}>
                        {note.note}
                      </div>
                      
                      {note.note.length > 120 && (
                        <button
                          onClick={() => toggleExpand(note.id!)}
                          className="text-xs text-blue-600 hover:underline mt-1"
                        >
                          {isExpanded[note.id!] ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>
                    
                    {canEdit && (
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setEditingNote(note)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Work Note</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this work note? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => note.id && handleDeleteNote(note.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                  
                  {note.hours_worked && (
                    <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {note.hours_worked} hours
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No public notes for this equipment
              </div>
            )}
          </TabsContent>
          
          {/* All Notes Tab (for managers/technicians) */}
          {canEdit && (
            <TabsContent value="all" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : allNotes.length > 0 ? (
                allNotes.map(note => (
                  <div 
                    key={note.id} 
                    className={`border rounded-md p-3 ${!note.is_public ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={note.is_public ? 'outline' : 'secondary'} className={note.is_public ? 'bg-green-100 text-green-800' : ''}>
                            {note.is_public ? 'Public' : 'Private'}
                          </Badge>
                          {note.creator?.display_name && (
                            <span className="text-sm text-muted-foreground">
                              {note.creator.display_name}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {note.created_at && format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        
                        <div className={`text-sm mt-1 ${isExpanded[note.id!] ? '' : 'line-clamp-2'}`}>
                          {note.note}
                        </div>
                        
                        {note.note.length > 120 && (
                          <button
                            onClick={() => toggleExpand(note.id!)}
                            className="text-xs text-blue-600 hover:underline mt-1"
                          >
                            {isExpanded[note.id!] ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setEditingNote(note)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Work Note</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this work note? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => note.id && handleDeleteNote(note.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    {note.hours_worked && (
                      <div className="flex items-center mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {note.hours_worked} hours
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No work notes for this equipment
                </div>
              )}
            </TabsContent>
          )}
        </CardContent>
      </Tabs>
      
      {/* Note edit dialog */}
      {editingNote && (
        <AlertDialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Work Note</AlertDialogTitle>
            </AlertDialogHeader>
            
            <form onSubmit={handleUpdateNote} className="space-y-4">
              <Textarea
                value={editingNote.note}
                onChange={(e) => setEditingNote({...editingNote, note: e.target.value})}
                placeholder="Enter note..."
                className="min-h-[100px]"
                required
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-hours">Hours worked (optional)</Label>
                  <Input
                    id="edit-hours"
                    type="number"
                    step="0.25"
                    min="0"
                    value={editingNote.hours_worked || ''}
                    onChange={(e) => setEditingNote({...editingNote, hours_worked: e.target.value})}
                    placeholder="Hours"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-visibility" className="block mb-2">Visibility</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-visibility"
                      checked={editingNote.is_public}
                      onCheckedChange={(checked) => setEditingNote({...editingNote, is_public: checked})}
                    />
                    <Label htmlFor="edit-visibility">
                      {editingNote.is_public ? (
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
              
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                <AlertDialogAction type="submit">Update</AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {/* Add new note form */}
      {canCreate && (
        <>
          <Separator />
          <CardFooter className="pt-4">
            <form onSubmit={handleAddNote} className="w-full space-y-4">
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
                  disabled={createMutation.isPending || !newNote.trim()}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  {createMutation.isPending ? 'Adding...' : 'Add Note'}
                </Button>
              </div>
            </form>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
