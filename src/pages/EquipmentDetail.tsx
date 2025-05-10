import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { QrCode, Pencil, Trash, Package } from 'lucide-react';
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
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Equipment, WorkNote } from '@/types';
import QRCodeGenerator from '@/components/Equipment/QRCodeGenerator';
import { Layout } from '@/components/Layout/Layout';
import { getEquipmentById, deleteEquipment, recordScan } from '@/services/equipmentService';
import { MOCK_WORK_NOTES } from '@/data/mockData';
import { Skeleton } from '@/components/ui/skeleton';

const EquipmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [workNotes, setWorkNotes] = useState<WorkNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Fetch equipment data
  const { data: equipment, isLoading, error } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => id ? getEquipmentById(id) : Promise.reject('No equipment ID provided'),
    enabled: !!id,
  });

  // Record scan when viewing equipment details
  useEffect(() => {
    if (id) {
      recordScan(id).catch(err => {
        console.error('Error recording scan:', err);
      });
    }
  }, [id]);

  // Handle error state
  useEffect(() => {
    if (error) {
      toast.error('Failed to load equipment details', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    }
  }, [error]);

  useEffect(() => {
    // For now, still using mock data for work notes
    if (id) {
      const equipmentNotes = MOCK_WORK_NOTES.filter((note) => note.equipment_id === id);
      setWorkNotes(equipmentNotes);
    }
  }, [id]);

  // Delete equipment mutation
  const deleteMutation = useMutation({
    mutationFn: (equipmentId: string) => deleteEquipment(equipmentId),
    onSuccess: () => {
      toast.success('Equipment deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      navigate('/equipment');
    },
    onError: (error) => {
      toast.error('Failed to delete equipment', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    },
  });

  const handleDeleteEquipment = () => {
    if (id) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call - TO BE REPLACED WITH REAL API CALL LATER
    setTimeout(() => {
      const newWorkNote: WorkNote = {
        id: `note-${Date.now()}`,
        equipment_id: id || '',
        work_order_id: 'wo-temp',  // Temporary placeholder
        created_by: 'current-user',
        note: newNote,
        created_at: new Date().toISOString(),
        author: 'John Doe',        // For UI display compatibility
        content: newNote           // For UI display compatibility
      };

      setWorkNotes([newWorkNote, ...workNotes]);
      setNewNote('');
      toast.success('Note added successfully');
      setIsSubmitting(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 space-y-6 p-6">
          <div className="flex justify-between">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          
          <Skeleton className="h-10 w-60" />
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!equipment && !isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-6">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Equipment Not Found</h2>
          <p className="text-muted-foreground mb-6">The equipment you're looking for doesn't exist or has been deleted.</p>
          <Button asChild>
            <Link to="/equipment">Go to Equipment List</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formattedDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const qrCodeUrl = window.location.origin + `/equipment/${id}`;

  const renderAttributes = () => {
    if (!equipment?.attributes || equipment.attributes.length === 0) {
      return (
        <div className="text-muted-foreground italic">
          No custom attributes
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        {equipment.attributes.map((attr) => (
          <div key={attr.id} className="flex flex-col">
            <span className="text-sm text-muted-foreground">{attr.key}</span>
            <span className="font-medium">{attr.value || 'N/A'}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{equipment?.name}</h1>
              <Badge variant="outline" className={getStatusColor(equipment?.status || 'active')}>
                {equipment?.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Last updated on {formattedDate(equipment?.updated_at || '')}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to={`/equipment/${id}/qr`}>
                <QrCode className="mr-2 h-4 w-4" />
                QR Code
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/equipment/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this equipment
                    and all associated work notes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteEquipment}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">Work Notes</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Information</CardTitle>
                <CardDescription>
                  Detailed information about the equipment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-muted-foreground mb-1">Model</h3>
                      <p>{equipment?.model || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-muted-foreground mb-1">Serial Number</h3>
                      <p>{equipment?.serial_number || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-muted-foreground mb-1">Manufacturer</h3>
                      <p>{equipment?.manufacturer || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-muted-foreground mb-1">Location</h3>
                      <p>{equipment?.location || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-muted-foreground mb-1">Install Date</h3>
                      <p>{formattedDate(equipment?.install_date || '')}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-muted-foreground mb-1">Warranty Expiration</h3>
                      <p>{formattedDate(equipment?.warranty_expiration || '')}</p>
                    </div>
                  </div>
                </div>
                
                {equipment?.notes && (
                  <div>
                    <h3 className="font-medium text-muted-foreground mb-1">Notes</h3>
                    <p className="whitespace-pre-wrap">{equipment.notes}</p>
                  </div>
                )}
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Custom Attributes</h3>
                  {renderAttributes()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notes" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Work Note</CardTitle>
                <CardDescription>
                  Document any work, repairs, or inspections performed on this equipment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  placeholder="Describe what was done..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={4}
                />
              </CardContent>
              <CardFooter>
                <Button onClick={handleAddNote} disabled={isSubmitting || !newNote.trim()}>
                  {isSubmitting ? 'Adding...' : 'Add Note'}
                </Button>
              </CardFooter>
            </Card>

            {workNotes.length > 0 ? (
              <div className="space-y-4">
                {workNotes.map((note) => (
                  <Card key={note.id}>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex justify-between">
                        <span>{note.author}</span>
                        <time className="text-muted-foreground">
                          {formattedDate(note.created_at)}
                        </time>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{note.note}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground">
                    No work notes have been added yet.<br />
                    Add the first note by documenting work done on this equipment.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="qr" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Equipment QR Code</CardTitle>
                <CardDescription>
                  Use this QR code to quickly access equipment information
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-8">
                <QRCodeGenerator 
                  value={qrCodeUrl} 
                  equipmentName={equipment?.name || 'Equipment'} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EquipmentDetail;
