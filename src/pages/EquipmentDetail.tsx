
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
import { Equipment, WorkNote } from '@/types';
import QRCodeGenerator from '@/components/Equipment/QRCodeGenerator';
import { MOCK_EQUIPMENT, MOCK_WORK_NOTES } from '@/data/mockData';
import { Layout } from '@/components/Layout/Layout';

const EquipmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [workNotes, setWorkNotes] = useState<WorkNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    // In a real app, we would fetch data from an API
    const foundEquipment = MOCK_EQUIPMENT.find((item) => item.id === id);
    if (foundEquipment) {
      setEquipment(foundEquipment);
      // Filter work notes for this equipment
      const equipmentNotes = MOCK_WORK_NOTES.filter((note) => note.equipmentId === id);
      setWorkNotes(equipmentNotes);
    } else {
      toast.error('Equipment not found');
      navigate('/equipment');
    }
  }, [id, navigate]);

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const newWorkNote: WorkNote = {
        id: `note-${Date.now()}`,
        equipmentId: id || '',
        authorId: 'current-user',
        author: 'John Doe',
        content: newNote,
        createdAt: new Date().toISOString(),
      };

      setWorkNotes([newWorkNote, ...workNotes]);
      setNewNote('');
      toast.success('Note added successfully');
      setIsSubmitting(false);
    }, 500);
  };

  const handleDeleteEquipment = () => {
    // In a real app, we would call an API to delete the equipment
    toast.success('Equipment deleted successfully');
    navigate('/equipment');
  };

  if (!equipment) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <p>Loading equipment details...</p>
        </div>
      </Layout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'In Use': return 'bg-blue-100 text-blue-800';
      case 'Under Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Retired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formattedDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const qrCodeUrl = window.location.origin + `/equipment/${id}`;

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{equipment.name}</h1>
              <Badge variant="outline" className={getStatusColor(equipment.status)}>
                {equipment.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Last updated on {formattedDate(equipment.lastUpdated)}
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
                      <h3 className="font-medium text-muted-foreground mb-1">Category</h3>
                      <p>{equipment.category || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-muted-foreground mb-1">Model</h3>
                      <p>{equipment.model}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-muted-foreground mb-1">Serial Number</h3>
                      <p>{equipment.serialNumber}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-muted-foreground mb-1">Location</h3>
                      <p>{equipment.location || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-muted-foreground mb-1">Assigned To</h3>
                      <p>{equipment.assignedTo || 'Unassigned'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-muted-foreground mb-1">Purchase Date</h3>
                      <p>{formattedDate(equipment.purchaseDate)}</p>
                    </div>
                  </div>
                </div>
                
                {equipment.notes && (
                  <div>
                    <h3 className="font-medium text-muted-foreground mb-1">Notes</h3>
                    <p className="whitespace-pre-wrap">{equipment.notes}</p>
                  </div>
                )}
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
                          {formattedDate(note.createdAt)}
                        </time>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{note.content}</p>
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
                  equipmentName={equipment.name} 
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
