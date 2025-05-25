
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  QrCode, 
  Edit, 
  MapPin, 
  Calendar,
  Users,
  Building2,
  FileText,
  ClipboardList
} from 'lucide-react';
import { Equipment } from '@/types';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { DeleteEquipmentButton } from './DeleteEquipmentButton';
import { DuplicateEquipmentButton } from './DuplicateEquipmentButton';
import { LocationDisplay } from './LocationDisplay';
import { AttributesList } from '../Attributes/AttributesList';
import { useWorkNotes } from '../WorkNotes/useWorkNotes';
import { AddNoteForm } from '../WorkNotes/AddNoteForm';
import { NotesList } from '../WorkNotes/NotesList';
import { EditNoteDialog } from '../WorkNotes/EditNoteDialog';
import { WorkOrderManagement } from '@/components/WorkOrders';

interface EquipmentDetailContentProps {
  equipment: Equipment;
  canEdit: boolean;
  canDelete: boolean;
}

export function EquipmentDetailContent({ equipment, canEdit, canDelete }: EquipmentDetailContentProps) {
  const [activeTab, setActiveTab] = useState('details');
  
  const {
    workNotes,
    publicNotes,
    allNotes,
    isLoading: isNotesLoading,
    canEdit: canEditNotes,
    canCreate: canCreateNotes,
    editingNote,
    setEditingNote,
    addNote,
    updateNote,
    deleteNote,
    handleHoursWorkedChange,
    createMutation,
    isNoteEditable
  } = useWorkNotes(equipment.id);

  const location = equipment.location_address || equipment.location_coordinates || equipment.location;

  return (
    <div className="space-y-6">
      {/* Equipment Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{equipment.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={equipment.status === 'active' ? 'default' : 'secondary'}>
              {equipment.status}
            </Badge>
            {equipment.team_name && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {equipment.team_name}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/equipment/${equipment.id}/qr`}>
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Link>
          </Button>
          
          {canEdit && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to={`/equipment/${equipment.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <DuplicateEquipmentButton 
                equipmentId={equipment.id} 
                equipmentName={equipment.name}
                canDuplicate={canEdit}
              />
            </>
          )}
          
          {canDelete && (
            <DeleteEquipmentButton 
              equipmentId={equipment.id}
              equipmentName={equipment.name}
              canDelete={canDelete}
            />
          )}
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="work-notes">Work Notes</TabsTrigger>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Details</CardTitle>
              <CardDescription>
                Information about this equipment
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium leading-none">Serial Number</div>
                  <p className="text-sm text-muted-foreground">{equipment.serial_number || 'N/A'}</p>
                </div>
                <div>
                  <div className="text-sm font-medium leading-none">Asset ID</div>
                  <p className="text-sm text-muted-foreground">{equipment.asset_id || 'N/A'}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium leading-none">Install Date</div>
                  <p className="text-sm text-muted-foreground">
                    {equipment.install_date ? formatDate(equipment.install_date) : 'N/A'}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-medium leading-none">Warranty Expiration</div>
                  <p className="text-sm text-muted-foreground">
                    {equipment.warranty_expiration ? formatDate(equipment.warranty_expiration) : 'N/A'}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium leading-none">Location</div>
                <LocationDisplay equipment={equipment} />
              </div>
              
              <Separator />
              
              <div>
                <div className="text-sm font-medium leading-none">Notes</div>
                <p className="text-sm text-muted-foreground">{equipment.notes || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Work Notes</CardTitle>
              <CardDescription>
                Add and view internal notes about this equipment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canCreateNotes && (
                <AddNoteForm 
                  onAddNote={addNote} 
                  isPending={createMutation.isPending} 
                />
              )}
              <NotesList 
                notes={allNotes} 
                isLoading={isNotesLoading} 
                canManage={canEditNotes}
                onEditNote={setEditingNote}
                onDeleteNote={deleteNote}
                isNoteEditable={isNoteEditable}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-orders" className="space-y-6">
          <WorkOrderManagement equipmentId={equipment.id} />
        </TabsContent>

        <TabsContent value="attributes" className="space-y-6">
          <AttributesList equipment={equipment} />
        </TabsContent>
      </Tabs>

      {/* Edit Note Dialog */}
      {editingNote && (
        <EditNoteDialog
          editingNote={editingNote}
          setEditingNote={setEditingNote}
          onUpdateNote={updateNote}
          handleHoursWorkedChange={handleHoursWorkedChange}
        />
      )}
    </div>
  );
}
