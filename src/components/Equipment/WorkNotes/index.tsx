
import React, { useState } from 'react';
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
import { Eye, User, Filter } from 'lucide-react';
import { useWorkNotes } from './useWorkNotes';
import { NotesList } from './NotesList';
import { EditNoteDialog } from './EditNoteDialog';
import { AddNoteForm } from './AddNoteForm';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

interface WorkNotesProps {
  equipmentId: string;
}

export function WorkNotes({ equipmentId }: WorkNotesProps) {
  const [organizationFilter, setOrganizationFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    publicNotes,
    allNotes,
    organizations,
    isLoading,
    canEdit,
    canCreate,
    editingNote,
    setEditingNote,
    handleAddNote,
    handleUpdateNote,
    handleDeleteNote,
    handleHoursWorkedChange,
    createMutation,
    refetchNotes
  } = useWorkNotes(equipmentId);
  
  const filteredPublicNotes = organizationFilter === "all" 
    ? publicNotes 
    : publicNotes.filter(note => note.organization_id === organizationFilter);
  
  const filteredAllNotes = organizationFilter === "all" 
    ? allNotes 
    : allNotes.filter(note => note.organization_id === organizationFilter);
    
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchNotes();
      toast.success("Work notes refreshed");
    } catch (error) {
      toast.error("Failed to refresh work notes");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Work Notes</CardTitle>
        <div className="flex items-center gap-2">
          {organizations.length > 1 && (
            <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
          >
            <Filter className="h-4 w-4 mr-1" />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
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
              notes={filteredPublicNotes}
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
                notes={filteredAllNotes}
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
