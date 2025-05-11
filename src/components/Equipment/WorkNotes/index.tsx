
import React from 'react';
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
import { Separator } from '@/components/ui/separator';
import { Eye, User } from 'lucide-react';
import { useWorkNotes } from './useWorkNotes';
import { NotesList } from './NotesList';
import { EditNoteDialog } from './EditNoteDialog';
import { AddNoteForm } from './AddNoteForm';

interface WorkNotesProps {
  equipmentId: string;
}

export function WorkNotes({ equipmentId }: WorkNotesProps) {
  const {
    publicNotes,
    allNotes,
    isLoading,
    canEdit,
    canCreate,
    editingNote,
    setEditingNote,
    handleAddNote,
    handleUpdateNote,
    handleDeleteNote,
    handleHoursWorkedChange,
    createMutation
  } = useWorkNotes(equipmentId);
  
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
            <NotesList 
              notes={publicNotes}
              isLoading={isLoading}
              canEdit={canEdit}
              setEditingNote={setEditingNote}
              onDeleteNote={handleDeleteNote}
            />
          </TabsContent>
          
          {/* All Notes Tab (for managers/technicians) */}
          {canEdit && (
            <TabsContent value="all" className="space-y-4">
              <NotesList 
                notes={allNotes}
                isLoading={isLoading}
                canEdit={canEdit}
                setEditingNote={setEditingNote}
                onDeleteNote={handleDeleteNote}
              />
            </TabsContent>
          )}
        </CardContent>
      </Tabs>
      
      {/* Note edit dialog */}
      <EditNoteDialog 
        editingNote={editingNote}
        setEditingNote={setEditingNote}
        onUpdateNote={handleUpdateNote}
        handleHoursWorkedChange={handleHoursWorkedChange}
      />
      
      {/* Add new note form */}
      {canCreate && (
        <>
          <Separator />
          <CardFooter className="pt-4">
            <AddNoteForm 
              isPending={createMutation.isPending} 
              onSubmit={handleAddNote}
            />
          </CardFooter>
        </>
      )}
    </Card>
  );
}
